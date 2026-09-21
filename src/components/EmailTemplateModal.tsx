import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Mail,
  Send,
  Sparkles,
  Layers,
  Tag,
  Plus,
  RotateCcw,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  FileText,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { JobApplication } from '../types';
import {
  generateTemplatesForJob,
  detectJobDomain,
  getDomainLabel,
  extractSuggestedRequirements,
  EmailTemplate,
  JobDomain,
  FollowUpObjective,
  EmailTone,
} from '../utils/emailTemplates';
import { getTodayString } from '../utils/dateUtils';

interface EmailTemplateModalProps {
  job: JobApplication | null;
  allJobs?: JobApplication[];
  isOpen?: boolean;
  onClose: () => void;
  onSaveJob?: (job: JobApplication) => void;
}

export const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({
  job,
  allJobs = [],
  isOpen = true,
  onClose,
  onSaveJob,
}) => {
  if (!isOpen || !job) return null;

  // Identify if candidate has applied to other positions at the same company
  const otherJobsAtCompany = useMemo(() => {
    if (!job.company) return [];
    const normalizedCompany = job.company.trim().toLowerCase();
    return allJobs.filter(
      (j) =>
        j.id !== job.id &&
        j.company &&
        j.company.trim().toLowerCase() === normalizedCompany
    );
  }, [job, allJobs]);

  const hasMultipleApplicationsAtCompany = otherJobsAtCompany.length > 0;
  const otherRoleNames = otherJobsAtCompany.map((j) => j.role).filter(Boolean);

  // Configuration states
  const [selectedDomain, setSelectedDomain] = useState<JobDomain>(() =>
    detectJobDomain(job.role, job.jobDescription, job.notes)
  );
  const [isMultiRoleEnabled, setIsMultiRoleEnabled] = useState<boolean>(
    hasMultipleApplicationsAtCompany
  );
  const [selectedTone, setSelectedTone] = useState<EmailTone>('professional-value');
  const [candidateName, setCandidateName] = useState('Applicant');

  // Key requirements to highlight
  const [requirements, setRequirements] = useState<string[]>(() =>
    extractSuggestedRequirements(job, detectJobDomain(job.role, job.jobDescription, job.notes))
  );
  const [newReqInput, setNewReqInput] = useState('');
  const [showAddReqInput, setShowAddReqInput] = useState(false);

  // Template generation
  const templates = useMemo(() => {
    return generateTemplatesForJob(job, {
      domain: selectedDomain,
      requirementsToHighlight: requirements,
      isMultiRoleAtCompany: isMultiRoleEnabled,
      otherRolesAtCompany: otherRoleNames,
      tone: selectedTone,
      candidateName,
    });
  }, [
    job,
    selectedDomain,
    requirements,
    isMultiRoleEnabled,
    otherRoleNames,
    selectedTone,
    candidateName,
  ]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    // If multiple roles exist at company, prioritize the multi-role template
    if (hasMultipleApplicationsAtCompany) {
      const multiTmpl = templates.find((t) => t.id === 'app-followup-multi-role');
      if (multiTmpl) return multiTmpl.id;
    }
    return templates[0]?.id || '';
  });

  const currentTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const [subjectText, setSubjectText] = useState(currentTemplate?.subject || '');
  const [bodyText, setBodyText] = useState(currentTemplate?.body || '');
  const [alternativeSubjects, setAlternativeSubjects] = useState<string[]>([]);
  const [aiRationale, setAiRationale] = useState<string | null>(null);

  // UI state
  const [copied, setCopied] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Keep state updated when target job changes
  useEffect(() => {
    if (job) {
      const detected = detectJobDomain(job.role, job.jobDescription, job.notes);
      setSelectedDomain(detected);
      const reqs = extractSuggestedRequirements(job, detected);
      setRequirements(reqs);
      setIsMultiRoleEnabled(hasMultipleApplicationsAtCompany);

      const newTemplates = generateTemplatesForJob(job, {
        domain: detected,
        requirementsToHighlight: reqs,
        isMultiRoleAtCompany: hasMultipleApplicationsAtCompany,
        otherRolesAtCompany: otherRoleNames,
      });

      const defaultTemplate = hasMultipleApplicationsAtCompany
        ? newTemplates.find((t) => t.id === 'app-followup-multi-role') || newTemplates[0]
        : newTemplates[0];

      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
        setSubjectText(defaultTemplate.subject);
        setBodyText(defaultTemplate.body);
      }
      setAlternativeSubjects([]);
      setAiRationale(null);
      setCopied(false);
      setAiError(null);
    }
  }, [job, hasMultipleApplicationsAtCompany]);

  const handleSelectTemplate = (tmpl: EmailTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setSubjectText(tmpl.subject);
    setBodyText(tmpl.body);
    setAlternativeSubjects([]);
    setAiRationale(null);
    setCopied(false);
  };

  const handleAddRequirement = () => {
    const trimmed = newReqInput.trim();
    if (trimmed && !requirements.includes(trimmed)) {
      const updated = [...requirements, trimmed];
      setRequirements(updated);
      setNewReqInput('');
      setShowAddReqInput(false);

      // Re-apply to active template
      const updatedTemplates = generateTemplatesForJob(job, {
        domain: selectedDomain,
        requirementsToHighlight: updated,
        isMultiRoleAtCompany: isMultiRoleEnabled,
        otherRolesAtCompany: otherRoleNames,
        tone: selectedTone,
        candidateName,
      });
      const match = updatedTemplates.find((t) => t.id === selectedTemplateId);
      if (match) {
        setSubjectText(match.subject);
        setBodyText(match.body);
      }
    }
  };

  const handleRemoveRequirement = (reqToRemove: string) => {
    const updated = requirements.filter((r) => r !== reqToRemove);
    setRequirements(updated);

    const updatedTemplates = generateTemplatesForJob(job, {
      domain: selectedDomain,
      requirementsToHighlight: updated,
      isMultiRoleAtCompany: isMultiRoleEnabled,
      otherRolesAtCompany: otherRoleNames,
      tone: selectedTone,
      candidateName,
    });
    const match = updatedTemplates.find((t) => t.id === selectedTemplateId);
    if (match) {
      setSubjectText(match.subject);
      setBodyText(match.body);
    }
  };

  const handleCopy = () => {
    const fullText = `Subject: ${subjectText}\n\n${bodyText}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Generate mailto link
  const mailtoUrl = `mailto:${encodeURIComponent(
    job.contactEmail || ''
  )}?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(
    bodyText
  )}`;

  // AI-Powered Bespoke Generation via Gemini
  const handleGenerateAiEmail = async () => {
    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const res = await fetch('/api/generate-followup-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: job.company,
          role: job.role,
          appliedDate: job.appliedDate,
          contactName: job.contactName,
          contactRole: job.contactRole,
          jobDescription: job.jobDescription,
          requirements: requirements,
          notes: job.notes,
          objective: currentTemplate?.category || 'role-requirements',
          tone: selectedTone,
          isMultiRoleAtCompany: isMultiRoleEnabled,
          otherRolesAtCompany: otherRoleNames,
          candidateName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate email with AI');
      }

      if (data.data?.subject) {
        setSubjectText(data.data.subject);
      }
      if (data.data?.body) {
        setBodyText(data.data.body);
      }
      if (Array.isArray(data.data?.alternativeSubjects)) {
        setAlternativeSubjects(data.data.alternativeSubjects);
      }
      if (data.data?.rationale) {
        setAiRationale(data.data.rationale);
      }
    } catch (err: any) {
      console.warn('AI generation fell back to dynamic rule template:', err);
      setAiError('Could not connect to Gemini API. Kept role-tailored template.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Save draft record into job notes
  const handleSaveToJobNotes = () => {
    if (!onSaveJob || !job) return;

    const today = getTodayString();
    const snippet = `\n\n--- Follow-up Email Drafted (${today}) ---\nSubject: ${subjectText}\n\n${bodyText.slice(0, 350)}...`;
    const updatedNotes = job.notes ? `${job.notes}${snippet}` : snippet.trim();

    const updatedJob: JobApplication = {
      ...job,
      notes: updatedNotes,
      updatedAt: today,
    };

    onSaveJob(updatedJob);
    setSaveSuccessMsg('Saved draft to job notes!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const wordCount = bodyText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = bodyText.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden max-h-[94vh] flex flex-col text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-tight">
                  Follow-Up Email Generator
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                  {getDomainLabel(selectedDomain)}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Targeting <strong className="text-slate-800 dark:text-slate-200">{job.company}</strong> • {job.role}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Multi-Role at Company Alert & Control */}
          <div
            className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
              isMultiRoleEnabled
                ? 'bg-amber-50/70 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Briefcase
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    isMultiRoleEnabled
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-400'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Multiple Applications at {job.company}
                    </span>
                    {hasMultipleApplicationsAtCompany && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-semibold">
                        {otherRoleNames.length} other {otherRoleNames.length === 1 ? 'role' : 'roles'} applied
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {hasMultipleApplicationsAtCompany ? (
                      <>
                        You also applied for <strong className="text-slate-700 dark:text-slate-300">{otherRoleNames.join(', ')}</strong>. Tailoring prevents emails from looking like identical copy-paste templates to {job.company}&apos;s recruiters.
                      </>
                    ) : (
                      <>
                        Applying to more than one job at {job.company}? Enable this to tailor the draft specifically for this requisition so it stands out.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={isMultiRoleEnabled}
                  onChange={(e) => setIsMultiRoleEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-amber-600"></div>
                <span className="ml-2 text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
                  Multi-Role Framing
                </span>
              </label>
            </div>
          </div>

          {/* Job Requirements & Custom Highlights Bar */}
          <div className="p-3 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                <span>Job Requirements Highlighted In Email</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddReqInput(!showAddReqInput)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Custom Requirement</span>
              </button>
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {requirements.map((req, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs"
                >
                  <span className="truncate max-w-[260px]">{req}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(req)}
                    className="text-slate-400 hover:text-red-500 rounded-full p-0.5 transition-colors cursor-pointer"
                    title="Remove requirement"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {showAddReqInput && (
                <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
                  <input
                    type="text"
                    value={newReqInput}
                    onChange={(e) => setNewReqInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddRequirement();
                      }
                    }}
                    placeholder="e.g., Client relationship management"
                    className="px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-indigo-400 dark:border-indigo-500 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none w-56"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddRequirement}
                    className="px-2 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              These specific competencies are woven directly into the email text to prove your alignment for the <strong className="text-slate-700 dark:text-slate-300">{job.role}</strong> position.
            </p>
          </div>

          {/* Template Objective Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Select Follow-Up Objective & Framing
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Tone:</span>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value as EmailTone)}
                  aria-label="Email Tone"
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="professional-value">Professional & Value-Driven</option>
                  <option value="warm-conversational">Warm & Conversational</option>
                  <option value="concise-direct">Concise & Direct</option>
                  <option value="strategic-executive">Strategic & Executive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {templates.map((tmpl) => {
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-950 dark:text-white border-indigo-400 dark:border-indigo-500 shadow-xs'
                        : 'bg-slate-50/70 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-xs leading-tight line-clamp-1">
                          {tmpl.name}
                        </span>
                        {tmpl.badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                              tmpl.isMultiRoleSpecific
                                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {tmpl.badge}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[11px] line-clamp-2 ${
                          isSelected
                            ? 'text-indigo-700 dark:text-indigo-200'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {tmpl.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Generator / Polish Action Bar */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  AI Craft with Gemini
                </h4>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  Generates an authentic, non-generic draft matching this role’s requirements and multi-job context.
                </p>
              </div>
            </div>

            <button
              onClick={handleGenerateAiEmail}
              disabled={isGeneratingAi}
              className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-all cursor-pointer ${
                isGeneratingAi
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 active:scale-98'
              }`}
            >
              {isGeneratingAi ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Drafting tailored email...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{aiRationale ? 'Regenerate Alternate Draft' : 'Craft Bespoke AI Draft'}</span>
                </>
              )}
            </button>
          </div>

          {aiError && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {/* AI Strategy Rationale Banner */}
          {aiRationale && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <strong className="font-semibold">Strategy Rationale:</strong> {aiRationale}
              </div>
            </div>
          )}

          {/* Alternate Subject Line Suggestions */}
          {alternativeSubjects.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Alternate Subject Lines (Click to Apply):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {alternativeSubjects.map((sub, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSubjectText(sub)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-left"
                  >
                    &ldquo;{sub}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subject Line Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Subject Line
              </label>
              {job.contactEmail && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  To: <strong className="text-slate-700 dark:text-slate-300">{job.contactName || job.company}</strong> ({job.contactEmail})
                </span>
              )}
            </div>
            <input
              type="text"
              value={subjectText}
              onChange={(e) => setSubjectText(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Body Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Message Body (Fully Editable)
              </label>
              <div className="text-[11px] text-slate-400">
                {wordCount} words • {charCount} chars
              </div>
            </div>
            <textarea
              rows={10}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full p-3.5 text-xs sm:text-sm font-sans bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 leading-relaxed placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>

            {onSaveJob && (
              <button
                type="button"
                onClick={handleSaveToJobNotes}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Save draft into application notes"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Save to Notes</span>
              </button>
            )}

            {saveSuccessMsg && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {saveSuccessMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {job.contactEmail && (
              <a
                href={mailtoUrl}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Open Mail App</span>
              </a>
            )}

            <button
              onClick={handleCopy}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 active:scale-98'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-indigo-200" />
                  <span>Copy Full Draft</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
