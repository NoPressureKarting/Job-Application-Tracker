import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Check,
  Sparkles,
  FileCheck,
  AlertCircle,
  Eye,
  X,
  Copy,
  Plus,
  Download,
} from 'lucide-react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  CloudResume,
  subscribeToUserResumes,
  saveResumeToCloud,
  deleteResumeFromCloud,
} from '../lib/firestoreSync';
import { ResumeTailorModal } from './ResumeTailorModal';
import { generateResumePdf } from '../utils/pdfGenerator';

interface ResumeHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getLocalResumesKey = (userId?: string | null) =>
  userId ? `job_tracker_resumes_${userId}` : 'job_tracker_resumes_guest';

export const ResumeHubModal: React.FC<ResumeHubModalProps> = ({ isOpen, onClose }) => {
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

  const [activePreviewResume, setActivePreviewResume] = useState<CloudResume | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [manualTextTitle, setManualTextTitle] = useState('');
  const [manualTextContent, setManualTextContent] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isTailorModalOpen, setIsTailorModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      // Reload resumes for the specific user context
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

  const showCopyToast = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  const handleDownloadPdf = (resume: CloudResume) => {
    try {
      const safeName = (resume.name || 'Resume')
        .replace(/\.[a-zA-Z0-9]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/__+/g, '_');
      generateResumePdf(resume.textContent, `${safeName}.pdf`, {
        company: resume.tailoredFor?.company,
      });
      showCopyToast(`Downloaded "${resume.name}" as PDF`);
    } catch (e) {
      console.error('PDF download error:', e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      const newResume: CloudResume = {
        id: `res-${Date.now()}`,
        userId: currentUser?.uid || 'local',
        name: file.name.replace(/\.[^/.]+$/, ''),
        uploadedAt: new Date().toISOString().split('T')[0],
        textContent: text || `[Uploaded file: ${file.name}]`,
        fileSizeFormatted: `${(file.size / 1024).toFixed(1)} KB`,
        isDefault: resumes.length === 0,
      };

      const updated = [newResume, ...resumes];
      setResumes(updated);
      localStorage.setItem(getLocalResumesKey(currentUser?.uid), JSON.stringify(updated));

      if (currentUser) {
        await saveResumeToCloud(currentUser.uid, newResume);
      }
      showCopyToast('Resume uploaded and processed successfully');
    } catch (err: any) {
      console.error('File read error:', err);
      showCopyToast('Error reading file. Try pasting the resume text instead.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveManualResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTextTitle.trim() || !manualTextContent.trim()) return;

    const newResume: CloudResume = {
      id: `res-${Date.now()}`,
      userId: currentUser?.uid || 'local',
      name: manualTextTitle.trim(),
      uploadedAt: new Date().toISOString().split('T')[0],
      textContent: manualTextContent.trim(),
      fileSizeFormatted: `${(manualTextContent.length / 1024).toFixed(1)} KB`,
      isDefault: resumes.length === 0,
    };

    const updated = [newResume, ...resumes];
    setResumes(updated);
    localStorage.setItem(getLocalResumesKey(currentUser?.uid), JSON.stringify(updated));

    if (currentUser) {
      await saveResumeToCloud(currentUser.uid, newResume);
    }

    setManualTextTitle('');
    setManualTextContent('');
    setShowManualInput(false);
    showCopyToast('Resume profile saved');
  };

  const handleSetDefault = async (resumeId: string) => {
    const updated = resumes.map((r) => ({
      ...r,
      isDefault: r.id === resumeId,
    }));
    setResumes(updated);
    localStorage.setItem(getLocalResumesKey(currentUser?.uid), JSON.stringify(updated));

    if (currentUser) {
      for (const r of updated) {
        await saveResumeToCloud(currentUser.uid, r);
      }
    }
    showCopyToast('Default resume updated');
  };

  const handleDeleteResume = async (resumeId: string) => {
    const updated = resumes.filter((r) => r.id !== resumeId);
    setResumes(updated);
    localStorage.setItem(getLocalResumesKey(currentUser?.uid), JSON.stringify(updated));

    if (currentUser) {
      await deleteResumeFromCloud(resumeId);
    }
    if (activePreviewResume?.id === resumeId) {
      setActivePreviewResume(null);
    }
    showCopyToast('Resume removed');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Resume Hub & Profiles
                </h3>
                {currentUser && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30">
                    Cloud Synced
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload and manage resume versions used for job matching and interview preparation.
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Action buttons bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Base Resume</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.json,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setShowManualInput(!showManualInput)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Paste Text</span>
              </button>
            </div>

            <button
              onClick={() => setIsTailorModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>⚡ Auto-Tailor for a Job</span>
            </button>
          </div>

          {/* Manual Input Form */}
          {showManualInput && (
            <form
              onSubmit={handleSaveManualResume}
              className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-indigo-200 dark:border-indigo-800/60 space-y-3 animate-fade-in"
            >
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Add Resume Profile
              </h4>
              <input
                type="text"
                placeholder="Resume label (e.g. Senior Frontend / Fullstack 2026)"
                value={manualTextTitle}
                onChange={(e) => setManualTextTitle(e.target.value)}
                className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                required
              />
              <textarea
                rows={5}
                placeholder="Paste your complete resume text, work experience, education, and skills..."
                value={manualTextContent}
                onChange={(e) => setManualTextContent(e.target.value)}
                className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualInput(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Save Resume
                </button>
              </div>
            </form>
          )}

          {/* Resume List */}
          {resumes.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No resumes uploaded yet
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload your resume versions so you can attach them to applications and tailor your interview questions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    resume.isDefault
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800/80 shadow-xs'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {resume.name}
                          </h4>
                          {resume.isTailored && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wider shrink-0">
                              Tailored
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {resume.uploadedAt} {resume.fileSizeFormatted ? `• ${resume.fileSizeFormatted}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleDownloadPdf(resume)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Download ATS PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setActivePreviewResume(resume)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Preview text"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteResume(resume.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Delete resume"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {resume.tailoredFor && (
                    <div className="mt-2 p-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                          Target: {resume.tailoredFor.company || 'Role'}
                        </span>
                        {resume.tailoredFor.atsMatchScore && (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {resume.tailoredFor.atsMatchScore}% ATS Match
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    {resume.isDefault ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                        <Check className="w-3 h-3" />
                        Primary Default
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(resume.id)}
                        className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                      >
                        Set as Default
                      </button>
                    )}

                    <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                      {resume.textContent.length} chars
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Text Preview Modal/Drawer */}
          {activePreviewResume && (
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Preview: {activePreviewResume.name}</span>
                </h5>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPdf(activePreviewResume)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activePreviewResume.textContent);
                      showCopyToast('Resume text copied');
                    }}
                    className="text-xs text-slate-600 dark:text-slate-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    Copy Text
                  </button>
                  <button
                    onClick={() => setActivePreviewResume(null)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <pre className="text-xs font-mono p-3 bg-white dark:bg-slate-900 rounded-lg max-h-48 overflow-y-auto text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed border border-slate-200 dark:border-slate-800">
                {activePreviewResume.textContent}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Toast Notification */}
        {copiedNotification && (
          <div className="p-2.5 bg-indigo-600 text-white text-center text-xs font-semibold animate-fade-in">
            {copiedNotification}
          </div>
        )}
      </div>

      {/* Embedded Resume Tailor Modal */}
      <ResumeTailorModal
        isOpen={isTailorModalOpen}
        onClose={() => setIsTailorModalOpen(false)}
      />
    </div>
  );
};
