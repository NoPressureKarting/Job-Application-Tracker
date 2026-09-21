import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Link as LinkIcon,
  FileText,
  Check,
  Copy,
  Download,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Briefcase,
  Building2,
  Target,
  Edit3,
  Eye,
  X,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  CloudResume,
  subscribeToUserResumes,
  saveResumeToCloud,
} from '../lib/firestoreSync';
import { TailoredResumeMetadata } from '../types';
import { generateResumePdf } from '../utils/pdfGenerator';

const getLocalResumesKey = (userId?: string | null) =>
  userId ? `job_tracker_resumes_${userId}` : 'job_tracker_resumes_guest';

export interface TailoredResultData {
  company: string;
  role: string;
  tailoredTitle: string;
  atsMatchScore: number;
  matchRationale: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  keyImprovements: string[];
  tailoredSummary: string;
  tailoredResumeMarkdown: string;
}

interface ResumeTailorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialJobUrl?: string;
  initialCompany?: string;
  initialRole?: string;
  initialJobDescription?: string;
  onApplyToJob?: (
    resumeName: string,
    resumeId: string,
    metadata: TailoredResumeMetadata,
    fullMarkdown: string
  ) => void;
}

export const ResumeTailorModal: React.FC<ResumeTailorModalProps> = ({
  isOpen,
  onClose,
  initialJobUrl = '',
  initialCompany = '',
  initialRole = '',
  initialJobDescription = '',
  onApplyToJob,
}) => {
  if (!isOpen) return null;

  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const [resumes, setResumes] = useState<CloudResume[]>(() => {
    try {
      const storageKey = getLocalResumesKey(auth.currentUser?.uid);
      const cached = localStorage.getItem(storageKey);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // Base resume selection
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [adhocResumeText, setAdhocResumeText] = useState<string>('');
  const [useAdhocResume, setUseAdhocResume] = useState(false);

  // Job inputs
  const [jobUrl, setJobUrl] = useState(initialJobUrl);
  const [company, setCompany] = useState(initialCompany);
  const [role, setRole] = useState(initialRole);
  const [jobDescription, setJobDescription] = useState(initialJobDescription);

  // Processing states
  const [isExtractingJob, setIsExtractingJob] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractSuccessMsg, setExtractSuccessMsg] = useState<string | null>(null);

  const [isTailoring, setIsTailoring] = useState(false);
  const [tailorError, setTailorError] = useState<string | null>(null);
  const [tailoredResult, setTailoredResult] = useState<TailoredResultData | null>(null);

  // Result display state
  const [isEditingMarkdown, setIsEditingMarkdown] = useState(false);
  const [editableMarkdown, setEditableMarkdown] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Track auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      try {
        const storageKey = getLocalResumesKey(user?.uid);
        const cached = localStorage.getItem(storageKey);
        setResumes(cached ? JSON.parse(cached) : []);
      } catch {
        setResumes([]);
      }
    });
    return () => unsub();
  }, []);

  // Fetch resumes
  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToUserResumes(currentUser.uid, (cloudResumes) => {
      setResumes(cloudResumes);
      try {
        localStorage.setItem(getLocalResumesKey(currentUser.uid), JSON.stringify(cloudResumes));
      } catch (e) {
        console.error(e);
      }
    });
    return () => unsub();
  }, [currentUser]);

  // Set default selected base resume
  useEffect(() => {
    if (resumes.length > 0 && !selectedResumeId) {
      const defaultOne = resumes.find((r) => r.isDefault) || resumes[0];
      setSelectedResumeId(defaultOne.id);
    }
  }, [resumes, selectedResumeId]);

  // If initial props change
  useEffect(() => {
    if (initialJobUrl) setJobUrl(initialJobUrl);
    if (initialCompany) setCompany(initialCompany);
    if (initialRole) setRole(initialRole);
    if (initialJobDescription) setJobDescription(initialJobDescription);
  }, [initialJobUrl, initialCompany, initialRole, initialJobDescription]);

  // Extract job from URL
  const handleExtractJobFromUrl = async () => {
    if (!jobUrl || !jobUrl.trim().startsWith('http')) {
      setExtractError('Please enter a valid web URL starting with http:// or https://');
      return;
    }

    setIsExtractingJob(true);
    setExtractError(null);
    setExtractSuccessMsg(null);

    try {
      const res = await fetch('/api/extract-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract job posting info from link');
      }

      if (data.data) {
        if (data.data.company && !company) setCompany(data.data.company);
        if (data.data.role && !role) setRole(data.data.role);

        let desc = data.data.rawDescription || '';
        if (data.data.summary && !desc.includes(data.data.summary)) {
          desc = `${data.data.summary}\n\n${desc}`;
        }
        if (data.data.keyRequirements && data.data.keyRequirements.length > 0) {
          desc += `\n\nKey Requirements:\n- ${data.data.keyRequirements.join('\n- ')}`;
        }
        if (desc) {
          setJobDescription(desc.trim());
        }

        setExtractSuccessMsg(
          data.extractedFromUrl
            ? 'Job details and requirements extracted from link!'
            : 'Extracted job context. You can supplement with additional text below.'
        );
      }
    } catch (err: any) {
      console.error('Job extract error:', err);
      setExtractError(
        err.message?.includes('login') || err.message?.includes('fetch')
          ? 'Link could not be scraped directly (site may require login). You can paste the job description below.'
          : err.message || 'Error extracting link details. Please paste description text below.'
      );
    } finally {
      setIsExtractingJob(false);
    }
  };

  // Get active base resume text
  const getActiveBaseResume = (): { text: string; name: string; id: string } => {
    if (useAdhocResume) {
      return {
        text: adhocResumeText,
        name: 'Pasted Base Resume',
        id: 'adhoc',
      };
    }
    const found = resumes.find((r) => r.id === selectedResumeId);
    if (found) {
      return {
        text: found.textContent,
        name: found.name,
        id: found.id,
      };
    }
    return {
      text: adhocResumeText,
      name: 'Custom Resume',
      id: 'custom',
    };
  };

  // Handle Tailoring
  const handleGenerateTailoredResume = async () => {
    const base = getActiveBaseResume();
    if (!base.text || base.text.trim().length < 20) {
      setTailorError('Please select or paste your base resume before generating.');
      return;
    }

    if (!jobDescription && !jobUrl && !role) {
      setTailorError('Please provide a job link, job description, or at least a target role & company.');
      return;
    }

    setIsTailoring(true);
    setTailorError(null);
    setTailoredResult(null);

    try {
      const res = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseResumeText: base.text,
          baseResumeName: base.name,
          jobUrl: jobUrl.trim(),
          jobDescription: jobDescription.trim(),
          company: company.trim(),
          role: role.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate tailored resume');
      }

      setTailoredResult(data.data);
      setEditableMarkdown(data.data.tailoredResumeMarkdown);
      if (data.data.company && !company) setCompany(data.data.company);
      if (data.data.role && !role) setRole(data.data.role);
    } catch (err: any) {
      console.error('Tailoring error:', err);
      setTailorError(err.message || 'An error occurred while generating your tailored resume.');
    } finally {
      setIsTailoring(false);
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    const textToCopy = editableMarkdown || tailoredResult?.tailoredResumeMarkdown || '';
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2200);
  };

  // Download PDF file
  const handleDownloadPdf = () => {
    const content = editableMarkdown || tailoredResult?.tailoredResumeMarkdown || '';
    if (!content) return;
    setIsGeneratingPdf(true);
    try {
      const safeTitle = (
        tailoredResult?.tailoredTitle ||
        `Resume_${company || 'Job'}_${role || 'Tailored'}`
      )
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/__+/g, '_');
      generateResumePdf(content, `${safeTitle}.pdf`, {
        company,
        role,
      });
    } catch (err) {
      console.error('Failed to generate resume PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Download Markdown file
  const handleDownloadMarkdown = () => {
    const content = editableMarkdown || tailoredResult?.tailoredResumeMarkdown || '';
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = (
      tailoredResult?.tailoredTitle ||
      `Resume_${company || 'Job'}_${role || 'Tailored'}`
    )
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/__+/g, '_');
    link.href = url;
    link.download = `${safeTitle}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Save to Resume Hub & optionally link to active Job Application
  const handleSaveAndApply = async () => {
    if (!tailoredResult) return;
    setIsSavingResume(true);
    setSaveSuccessMsg(null);

    const base = getActiveBaseResume();
    const resumeId = `tailored-res-${Date.now()}`;
    const resumeTitle =
      tailoredResult.tailoredTitle ||
      `Tailored – ${company ? `${company} ` : ''}${role || 'Role'}`;
    const fullContent = editableMarkdown || tailoredResult.tailoredResumeMarkdown;

    const metadata: TailoredResumeMetadata = {
      atsMatchScore: tailoredResult.atsMatchScore,
      matchedKeywords: tailoredResult.matchedKeywords || [],
      missingKeywords: tailoredResult.missingKeywords || [],
      keyImprovements: tailoredResult.keyImprovements || [],
      tailoredAt: new Date().toISOString(),
      sourceBaseResumeId: base.id,
      sourceBaseResumeName: base.name,
    };

    const newResume: CloudResume = {
      id: resumeId,
      userId: currentUser?.uid || 'local',
      name: resumeTitle,
      uploadedAt: new Date().toISOString().split('T')[0],
      textContent: fullContent,
      fileSizeFormatted: `${(fullContent.length / 1024).toFixed(1)} KB`,
      isDefault: false,
      isTailored: true,
      tailoredFor: {
        company: company || tailoredResult.company,
        role: role || tailoredResult.role,
        jobUrl: jobUrl || '',
        atsMatchScore: tailoredResult.atsMatchScore,
        matchedKeywords: tailoredResult.matchedKeywords,
        missingKeywords: tailoredResult.missingKeywords,
        keyImprovements: tailoredResult.keyImprovements,
        baseResumeName: base.name,
      },
    };

    // Save to localStorage cache
    try {
      const updated = [newResume, ...resumes];
      setResumes(updated);
      localStorage.setItem(getLocalResumesKey(currentUser?.uid), JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    // Save to Firestore if authenticated
    if (currentUser) {
      try {
        await saveResumeToCloud(currentUser.uid, newResume);
      } catch (e) {
        console.error('Failed to sync to cloud:', e);
      }
    }

    // Trigger parent callback if this was invoked from JobModal
    if (onApplyToJob) {
      onApplyToJob(resumeTitle, resumeId, metadata, fullContent);
    }

    setSaveSuccessMsg('Tailored resume saved to Resume Hub and linked!');
    setIsSavingResume(false);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  AI Resume Tailor
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wider">
                  ATS Optimizer
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transforms your base resume into an ATS-optimized, role-specific version matching the job link.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {!tailoredResult ? (
            /* STEP 1: CONFIGURATION & GENERATION */
            <div className="space-y-6">
              {/* Section 1: Choose Base Resume */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      1. Select Your Base Resume
                    </h4>
                  </div>
                  {resumes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setUseAdhocResume(!useAdhocResume)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      {useAdhocResume ? 'Choose from Resume Hub' : 'Or paste fresh text'}
                    </button>
                  )}
                </div>

                {!useAdhocResume && resumes.length > 0 ? (
                  <div className="space-y-2">
                    <label className="text-xs text-slate-600 dark:text-slate-400 block">
                      Choose which uploaded resume profile to adapt:
                    </label>
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                    >
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} {r.isDefault ? '★ (Default)' : ''} — {r.fileSizeFormatted || 'Ready'}
                        </option>
                      ))}
                    </select>

                    {/* Quick Preview Snippet */}
                    {selectedResumeId && (
                      <div className="p-2.5 bg-white dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 max-h-20 overflow-hidden line-clamp-3 italic">
                        "
                        {resumes.find((r) => r.id === selectedResumeId)?.textContent.slice(0, 240) ||
                          'No text content preview'}
                        ..."
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs text-slate-600 dark:text-slate-400 block">
                      Paste your base resume text (Work experience, Skills, Education):
                    </label>
                    <textarea
                      rows={5}
                      value={adhocResumeText}
                      onChange={(e) => setAdhocResumeText(e.target.value)}
                      placeholder="Paste your standard resume content here (experience bullet points, skills, summary, etc.)..."
                      className="w-full p-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Section 2: Job Link & Target Info */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    2. Target Job Link & Posting Details
                  </h4>
                </div>

                {/* URL Extraction Bar */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Job Posting Link (URL)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="url"
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        placeholder="https://jobs.lever.co/company/role or LinkedIn, Greenhouse, career portal..."
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isExtractingJob || !jobUrl.trim()}
                      onClick={handleExtractJobFromUrl}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      {isExtractingJob ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Reading Link...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Extract Link Info</span>
                        </>
                      )}
                    </button>
                  </div>

                  {extractError && (
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{extractError}</span>
                    </div>
                  )}

                  {extractSuccessMsg && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{extractSuccessMsg}</span>
                    </div>
                  )}
                </div>

                {/* Company & Role Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Company Name
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. Stripe, Google, Acme Corp"
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target Role Title
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g. Senior Full-Stack Engineer"
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Job Description Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Job Description / Core Requirements
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Paste text if link is protected by login
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job posting details, required tech stack, responsibilities, or nice-to-haves..."
                    className="w-full p-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {tailorError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{tailorError}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                disabled={isTailoring}
                onClick={handleGenerateTailoredResume}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isTailoring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Job Link & Tailoring Your Resume with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Tailored Resume for This Job</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* STEP 2: TAILORED RESULT PREVIEW & ATS METRICS */
            <div className="space-y-6">
              {/* Top Banner: ATS Match & Summary */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-slate-100 dark:to-slate-800/60 border border-indigo-200/80 dark:border-indigo-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Tailored For:
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {tailoredResult.role} at {tailoredResult.company}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {tailoredResult.matchRationale}
                    </p>
                  </div>

                  {/* ATS Match Gauge Badge */}
                  <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/40 shadow-xs shrink-0 self-start sm:self-center">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
                        ATS Match
                      </span>
                      <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                        {tailoredResult.atsMatchScore}%
                      </span>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>

                {/* Key Improvements Made */}
                {tailoredResult.keyImprovements && tailoredResult.keyImprovements.length > 0 && (
                  <div className="pt-2 border-t border-indigo-100 dark:border-slate-800/80">
                    <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      ✨ Key Enhancements Applied to Your Experience:
                    </h5>
                    <ul className="space-y-1">
                      {tailoredResult.keyImprovements.map((imp, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2"
                        >
                          <span className="text-emerald-500 font-bold shrink-0">•</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Keywords Chips */}
                <div className="pt-2 border-t border-indigo-100 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">
                    Matched Keywords:
                  </span>
                  {tailoredResult.matchedKeywords?.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium"
                    >
                      ✓ {kw}
                    </span>
                  ))}
                  {tailoredResult.missingKeywords?.map((kw, i) => (
                    <span
                      key={`m-${i}`}
                      className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-medium"
                      title="Recommended keyword or skill from job posting to review"
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Bar for Tailored Content */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingMarkdown(false)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                      !isEditingMarkdown
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Formatted Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditingMarkdown(true)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isEditingMarkdown
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Markdown</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedToast ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    title="Download candidate-ready ATS vector PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadMarkdown}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download raw markdown file (.md)"
                  >
                    <span>.md</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTailoredResult(null)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>

              {/* Resume Content View / Edit */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {isEditingMarkdown ? (
                  <textarea
                    rows={16}
                    value={editableMarkdown}
                    onChange={(e) => setEditableMarkdown(e.target.value)}
                    className="w-full p-4 font-mono text-xs bg-slate-950 text-slate-100 focus:outline-none leading-relaxed"
                  />
                ) : (
                  <div className="p-5 sm:p-6 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 max-h-[420px] overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {editableMarkdown || tailoredResult.tailoredResumeMarkdown}
                  </div>
                )}
              </div>

              {saveSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>

          {tailoredResult && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Download ATS vector PDF"
              >
                <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
              </button>

              <button
                type="button"
                disabled={isSavingResume}
                onClick={handleSaveAndApply}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
              {isSavingResume ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save to Resume Hub & Link to Application</span>
                </>
              )}
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
