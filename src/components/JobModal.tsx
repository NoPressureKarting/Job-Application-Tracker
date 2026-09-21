import React, { useState } from 'react';
import {
  X,
  Trash2,
  Calendar,
  Clock,
  Briefcase,
  User,
  CheckCircle2,
  DollarSign,
  Gift,
  AlertCircle,
  Sparkles,
  FileText,
} from 'lucide-react';
import {
  JobApplication,
  JobStatus,
  WorkplaceType,
  EmploymentType,
  FollowUpReminder,
  InterviewEvent,
  ReminderType,
  TailoredResumeMetadata,
} from '../types';
import { getTodayString, addDays } from '../utils/dateUtils';
import { JOB_STATUS_CONFIG } from '../utils/statusUtils';
import { ResumeTailorModal } from './ResumeTailorModal';

interface JobModalProps {
  initialJob?: Partial<JobApplication> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (job: JobApplication) => void;
}

type TabType = 'overview' | 'reminders' | 'interviews' | 'notes';

export const JobModal: React.FC<JobModalProps> = ({
  initialJob,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(initialJob?.id);
  const today = getTodayString();

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Form states
  const [company, setCompany] = useState(initialJob?.company || '');
  const [role, setRole] = useState(initialJob?.role || '');
  const [status, setStatus] = useState<JobStatus>(initialJob?.status || 'Applied');
  const [location, setLocation] = useState(initialJob?.location || '');
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType>(
    initialJob?.workplaceType || 'Remote'
  );
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    initialJob?.employmentType || 'Full-time'
  );
  const [salaryRange, setSalaryRange] = useState(
    initialJob?.salaryRange || initialJob?.salary || ''
  );
  const [offerDetails, setOfferDetails] = useState(
    initialJob?.offerDetails || ''
  );
  const [appliedDate, setAppliedDate] = useState(
    initialJob?.appliedDate !== undefined ? initialJob.appliedDate : today
  );
  const [jobUrl, setJobUrl] = useState(initialJob?.jobUrl || '');
  const [contactName, setContactName] = useState(initialJob?.contactName || '');
  const [contactEmail, setContactEmail] = useState(initialJob?.contactEmail || '');
  const [contactRole, setContactRole] = useState(initialJob?.contactRole || '');
  const [resumeVersion, setResumeVersion] = useState(initialJob?.resumeVersion || '');
  const [tailoredResumeId, setTailoredResumeId] = useState(initialJob?.tailoredResumeId || '');
  const [tailoredResumeData, setTailoredResumeData] = useState<TailoredResumeMetadata | undefined>(
    initialJob?.tailoredResumeData
  );
  const [isTailorModalOpen, setIsTailorModalOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState(initialJob?.jobDescription || '');
  const [notes, setNotes] = useState(initialJob?.notes || '');

  // Reminders array
  const [reminders, setReminders] = useState<FollowUpReminder[]>(
    initialJob?.reminders || []
  );

  // Interviews array
  const [interviews, setInterviews] = useState<InterviewEvent[]>(
    initialJob?.interviews || []
  );

  // New Reminder inline state
  const [newRemTitle, setNewRemTitle] = useState('');
  const [newRemDate, setNewRemDate] = useState(addDays(today, 7));
  const [newRemType, setNewRemType] = useState<ReminderType>('application-followup');
  const [newRemNotes, setNewRemNotes] = useState('');

  // New Interview inline state
  const [newIntRound, setNewIntRound] = useState('');
  const [newIntDate, setNewIntDate] = useState(addDays(today, 3));
  const [newIntTime, setNewIntTime] = useState('');
  const [newIntInterviewer, setNewIntInterviewer] = useState('');
  const [newIntNotes, setNewIntNotes] = useState('');

  // Validation
  const [errors, setErrors] = useState<{ company?: string; role?: string }>({});

  const handleStatusSelectChange = (newStatus: JobStatus) => {
    setStatus(newStatus);
    if (newStatus === 'Rejected') {
      setReminders([]);
    }
  };

  const handleAddReminder = () => {
    if (!newRemTitle.trim()) return;
    const newRem: FollowUpReminder = {
      id: `rem-${Date.now()}`,
      title: newRemTitle.trim(),
      dueDate: newRemDate,
      completed: false,
      type: newRemType,
      notes: newRemNotes.trim() || undefined,
    };
    setReminders([...reminders, newRem]);
    setNewRemTitle('');
    setNewRemNotes('');
    setNewRemDate(addDays(today, 7));
  };

  const handleQuickAdd1WeekFollowup = () => {
    const defaultDate = appliedDate ? addDays(appliedDate, 7) : addDays(today, 7);
    const newRem: FollowUpReminder = {
      id: `rem-${Date.now()}`,
      title: `Check in with ${company || 'hiring team'} on submitted application`,
      dueDate: defaultDate,
      completed: false,
      type: 'application-followup',
      notes: 'Send polite follow-up email reiterating enthusiasm.',
    };
    setReminders([...reminders, newRem]);
  };

  const handleQuickAddThankYou = () => {
    const newRem: FollowUpReminder = {
      id: `rem-${Date.now()}`,
      title: `Send thank-you email following interview`,
      dueDate: today,
      completed: false,
      type: 'post-interview-thank-you',
      notes: 'Send within 24 hours of interview completion.',
    };
    setReminders([...reminders, newRem]);
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  const handleToggleReminder = (id: string) => {
    setReminders(
      reminders.map((r) =>
        r.id === id ? { ...r, completed: !r.completed } : r
      )
    );
  };

  const handleAddInterview = () => {
    if (!newIntRound.trim()) return;
    const newInt: InterviewEvent = {
      id: `int-${Date.now()}`,
      roundName: newIntRound.trim(),
      date: newIntDate,
      time: newIntTime.trim() || undefined,
      interviewer: newIntInterviewer.trim() || undefined,
      notes: newIntNotes.trim() || undefined,
      completed: false,
    };
    setInterviews([...interviews, newInt]);
    setNewIntRound('');
    setNewIntTime('');
    setNewIntInterviewer('');
    setNewIntNotes('');
  };

  const handleDeleteInterview = (id: string) => {
    setInterviews(interviews.filter((i) => i.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errs: { company?: string; role?: string } = {};
    if (!company.trim()) errs.company = 'Company name is required';
    if (!role.trim()) errs.role = 'Job title / role is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setActiveTab('overview');
      return;
    }

    const jobData: JobApplication = {
      id: initialJob?.id || `job-${Date.now()}`,
      company: company.trim(),
      role: role.trim(),
      status,
      location: location.trim() || 'Remote',
      workplaceType,
      employmentType,
      salary: salaryRange.trim() || undefined,
      salaryRange: salaryRange.trim() || undefined,
      offerDetails: offerDetails.trim() || undefined,
      appliedDate,
      jobUrl: jobUrl.trim() || undefined,
      contactName: contactName.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      contactRole: contactRole.trim() || undefined,
      resumeVersion: resumeVersion.trim() || undefined,
      tailoredResumeId: tailoredResumeId.trim() || undefined,
      tailoredResumeData: tailoredResumeData || undefined,
      jobDescription: jobDescription.trim() || undefined,
      notes: notes.trim() || undefined,
      reminders: status === 'Rejected' ? [] : reminders,
      interviews,
      createdAt: initialJob?.createdAt || today,
      updatedAt: today,
    };

    onSave(jobData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col text-slate-900 dark:text-slate-100">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                {isEditing ? `Edit ${company || 'Job Application'}` : 'Record New Job Application'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track status, follow-up deadlines, contacts, and interview rounds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-slate-50/50 dark:bg-slate-900/60 overflow-x-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reminders')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'reminders'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            Follow-Up Reminders ({status === 'Rejected' ? 0 : reminders.filter((r) => !r.completed).length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('interviews')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'interviews'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            Interviews ({interviews.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'notes'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            Contact & Notes
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Stripe, Airbnb, Google"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  {errors.company && (
                    <p className="text-xs text-rose-500 mt-1">{errors.company}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Job Title / Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  {errors.role && (
                    <p className="text-xs text-rose-500 mt-1">{errors.role}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Application Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => handleStatusSelectChange(e.target.value as JobStatus)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    {(Object.keys(JOB_STATUS_CONFIG) as JobStatus[]).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date Applied
                  </label>
                  <input
                    type="date"
                    value={appliedDate}
                    onChange={(e) => setAppliedDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Salary Range / Target Comp</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500">
                      <DollarSign className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={salaryRange}
                      onChange={(e) => setSalaryRange(e.target.value)}
                      placeholder="e.g. $75,000 - $95,000"
                      className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Salary Range Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Quick presets:</span>
                {[
                  '$60,000 - $75,000',
                  '$75,000 - $95,000',
                  '$95,000 - $120,000',
                  '$120,000 - $150,000',
                  '$35 - $60/hr',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSalaryRange(preset)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Offer Details / Compensation Breakdown Section */}
              {status === 'Offer' ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                        Official Offer Package & Terms
                      </h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        Record your base salary, sign-on bonus, benefits, and decision deadline.
                      </p>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    value={offerDetails}
                    onChange={(e) => setOfferDetails(e.target.value)}
                    placeholder="e.g.&#10;• Base Salary: $85,000 / yr&#10;• Sign-on Bonus: $5,000&#10;• 401(k) Match: 4%&#10;• Annual Target Bonus: 5-10%&#10;• Decision Deadline: Next Friday"
                    className="w-full p-3 text-xs sm:text-sm bg-white dark:bg-slate-900/90 border border-emerald-300 dark:border-emerald-500/40 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-emerald-500 leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Offer Details & Compensation Breakdown (Optional)</span>
                    <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                      Base, bonus, benefits, or notes
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={offerDetails}
                    onChange={(e) => setOfferDetails(e.target.value)}
                    placeholder="e.g. Target Base: $80,000, 401(k) match, health coverage..."
                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Workplace Type
                  </label>
                  <select
                    value={workplaceType}
                    onChange={(e) => setWorkplaceType(e.target.value as WorkplaceType)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) =>
                      setEmploymentType(e.target.value as EmploymentType)
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, Remote US"
                    className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job Posting URL
                </label>
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://company.com/careers/job-id"
                  className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />

                {/* AI Tailor Resume Callout */}
                <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-r from-indigo-50/90 via-purple-50/40 to-slate-50 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Tailor Resume from this Job Link
                        </span>
                        {tailoredResumeData?.atsMatchScore && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-500/30">
                            {tailoredResumeData.atsMatchScore}% ATS Match
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {resumeVersion ? `Current version: "${resumeVersion}"` : 'Automatically extract job requirements & adapt your base resume with AI.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsTailorModalOpen(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{resumeVersion ? 'Re-Tailor Resume' : '✨ Auto-Tailor Resume'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REMINDERS */}
          {activeTab === 'reminders' && (
            <div className="space-y-4">
              {status === 'Rejected' ? (
                <div className="p-5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-500/30 text-rose-900 dark:text-rose-200 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-700 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Follow-Up Reminders Removed for Rejected Application</span>
                  </div>
                  <p className="text-xs text-rose-600 dark:text-rose-300 leading-relaxed">
                    Because this job status is currently set to <strong>Rejected</strong>, follow-up reminders are disabled and any existing reminders have been removed since this role is no longer an active option.
                  </p>
                  <p className="text-[11px] text-rose-500/90 dark:text-rose-400/90 italic">
                    To schedule follow-ups again, switch the status on the Overview tab to an active stage (such as Applied, Screening, or Interviewing).
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        Follow-Up Tasks & Reminders
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Set proactive reminders to check in after applying or interviewing
                      </p>
                    </div>

                    {/* Quick Add Presets */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleQuickAdd1WeekFollowup}
                        className="text-xs font-semibold px-2.5 py-1.5 bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-500/30 transition-colors cursor-pointer"
                      >
                        + 1-Week Follow-Up
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickAddThankYou}
                        className="text-xs font-semibold px-2.5 py-1.5 bg-blue-50 dark:bg-blue-500/15 hover:bg-blue-100 dark:hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-500/30 transition-colors cursor-pointer"
                      >
                        + Interview Thank-You
                      </button>
                    </div>
                  </div>

                  {/* Current Reminders List */}
                  <div className="space-y-2">
                    {reminders.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                        No follow-up reminders scheduled yet. Add one below or use the quick buttons above.
                      </div>
                    ) : (
                      reminders.map((rem) => (
                        <div
                          key={rem.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                            rem.completed
                              ? 'bg-slate-50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800/60'
                              : 'bg-slate-50/80 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleReminder(rem.id)}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer ${
                                rem.completed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-semibold truncate ${
                              rem.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-200'
                            }`}
                          >
                            {rem.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Due: {rem.dueDate} {rem.notes ? `• ${rem.notes}` : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteReminder(rem.id)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Custom Reminder Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <h5 className="font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Create Custom Reminder
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newRemTitle}
                    onChange={(e) => setNewRemTitle(e.target.value)}
                    placeholder="Reminder title (e.g. Email recruiter, check assessment)"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <input
                    type="date"
                    value={newRemDate}
                    onChange={(e) => setNewRemDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRemNotes}
                    onChange={(e) => setNewRemNotes(e.target.value)}
                    placeholder="Optional notes or context..."
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddReminder}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 shrink-0 transition-colors shadow-xs cursor-pointer"
                  >
                    Add Reminder
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

          {/* TAB 3: INTERVIEWS */}
          {activeTab === 'interviews' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Interview Rounds & Logs
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Keep a record of all screening calls, technical rounds, and onsite loops
                </p>
              </div>

              {/* Current Interviews List */}
              <div className="space-y-2">
                {interviews.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                    No interview rounds logged yet. Add one below when scheduled.
                  </div>
                ) : (
                  interviews.map((int) => (
                    <div
                      key={int.id}
                      className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-200">
                            {int.roundName}
                          </span>
                          <span className="text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 px-2 py-0.5 rounded font-medium">
                            {int.date} {int.time ? `@ ${int.time}` : ''}
                          </span>
                        </div>
                        {int.interviewer && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            Interviewer: {int.interviewer}
                          </p>
                        )}
                        {int.notes && (
                          <p className="text-[11px] text-slate-500 italic mt-0.5">
                            "{int.notes}"
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteInterview(int.id)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Interview Round */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <h5 className="font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Log Interview Stage
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newIntRound}
                    onChange={(e) => setNewIntRound(e.target.value)}
                    placeholder="Round (e.g. Recruiter, System Design, Final)"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <input
                    type="date"
                    value={newIntDate}
                    onChange={(e) => setNewIntDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={newIntTime}
                    onChange={(e) => setNewIntTime(e.target.value)}
                    placeholder="Time (e.g. 2:00 PM EST)"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newIntInterviewer}
                    onChange={(e) => setNewIntInterviewer(e.target.value)}
                    placeholder="Interviewer Name / Team"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <input
                    type="text"
                    value={newIntNotes}
                    onChange={(e) => setNewIntNotes(e.target.value)}
                    placeholder="Preparation notes or feedback..."
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddInterview}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 transition-colors shadow-xs cursor-pointer"
                >
                  Add Interview Round
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CONTACT & NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Title / Role
                  </label>
                  <input
                    type="text"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    placeholder="e.g. Senior Recruiter"
                    className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Resume / Portfolio Version Used
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTailorModalOpen(true)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Tailor New Resume</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={resumeVersion}
                  onChange={(e) => setResumeVersion(e.target.value)}
                  placeholder="e.g. FullStack_Resume_v2.pdf, Tailored - Senior Engineer (Stripe)"
                  className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                {tailoredResumeData?.atsMatchScore && (
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>ATS Match: {tailoredResumeData.atsMatchScore}% • Tailored specifically for this position</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Job Description & Requirements (Optional)</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                    Used to tailor follow-up emails and resumes
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste core responsibilities, qualifications, or requirements from the posting..."
                  className="w-full p-3 text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Application Notes & Context
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key notes, specific discussion points, referral source, questions asked..."
                  className="w-full p-3 text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-5 py-2 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-500/20 transition-colors cursor-pointer"
              >
                {isEditing ? 'Save Changes' : 'Record Application'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Embedded Resume Tailor Workflow */}
      <ResumeTailorModal
        isOpen={isTailorModalOpen}
        onClose={() => setIsTailorModalOpen(false)}
        initialJobUrl={jobUrl}
        initialCompany={company}
        initialRole={role}
        initialJobDescription={notes}
        onApplyToJob={(name, id, meta) => {
          setResumeVersion(name);
          setTailoredResumeId(id);
          setTailoredResumeData(meta);
        }}
      />
    </div>
  );
};
