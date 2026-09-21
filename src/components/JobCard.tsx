import React, { useState } from 'react';
import {
  Calendar,
  DollarSign,
  ExternalLink,
  MapPin,
  Mail,
  User,
  Clock,
  CheckCircle2,
  Edit2,
  Trash2,
  Send,
  PlusCircle,
  ChevronDown,
  Gift,
  Sparkles,
} from 'lucide-react';
import { JobApplication, JobStatus } from '../types';
import { formatDate, getRelativeDayDifference, getUrgencyBadge } from '../utils/dateUtils';
import { JOB_STATUS_CONFIG } from '../utils/statusUtils';
import { getSafeExternalLink } from '../lib/firestoreSync';

interface JobCardProps {
  job: JobApplication;
  onEdit: (job: JobApplication) => void;
  onDelete: (jobId: string) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => void;
  onToggleReminder: (jobId: string, reminderId: string) => void;
  onSnoozeReminder: (jobId: string, reminderId: string, days: number) => void;
  onOpenEmailTemplates: (job: JobApplication) => void;
  onAddReminder: (job: JobApplication) => void;
  onPracticeInterview?: (job: JobApplication) => void;
  onTailorResume?: (job: JobApplication) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleReminder,
  onSnoozeReminder,
  onOpenEmailTemplates,
  onAddReminder,
  onPracticeInterview,
  onTailorResume,
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const statusConfig = JOB_STATUS_CONFIG[job.status] || JOB_STATUS_CONFIG.Applied;

  // Find next pending reminder sorted by soonest due date
  const pendingReminders = job.reminders
    .filter((r) => !r.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const nextReminder = pendingReminders[0];

  // Upcoming interviews
  const upcomingInterviews = job.interviews
    .filter((i) => !i.completed)
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextInterview = upcomingInterviews[0];

  const daysSinceApplied = job.appliedDate
    ? Math.abs(getRelativeDayDifference(job.appliedDate))
    : null;

  const companyInitial = (job.company || 'C').charAt(0).toUpperCase();

  return (
    <div className="bg-white hover:bg-slate-50/80 dark:bg-slate-900/50 dark:hover:bg-slate-900/80 rounded-2xl border border-slate-200/90 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative">
      {/* Top Header: Company initial logo, Role, Status & Actions */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-base shrink-0 shadow-xs">
              {companyInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">
                  {job.company}
                </h3>
                {getSafeExternalLink(job.jobUrl) && (
                  <a
                    href={getSafeExternalLink(job.jobUrl)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5 rounded transition-colors"
                    title="Open Job Posting"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {job.role}
              </p>
              {job.tailoredResumeData?.atsMatchScore ? (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold">
                    <Sparkles className="w-2.5 h-2.5" />
                    {job.tailoredResumeData.atsMatchScore}% ATS Match
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={job.resumeVersion}>
                    {job.resumeVersion}
                  </span>
                </div>
              ) : job.resumeVersion ? (
                <div className="mt-1 text-[10px] text-slate-400 truncate max-w-[200px]" title={job.resumeVersion}>
                  📄 {job.resumeVersion}
                </div>
              ) : null}
            </div>
          </div>

          {/* Status Dropdown Trigger */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} transition-colors cursor-pointer`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
              <span>{job.status}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showStatusMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowStatusMenu(false)}
                />
                <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50 text-xs">
                  {(Object.keys(JOB_STATUS_CONFIG) as JobStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        onStatusChange(job.id, st);
                        setShowStatusMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                        job.status === st ? 'font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-slate-800/80' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${JOB_STATUS_CONFIG[st].dotColor}`}
                      />
                      <span>{st}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Location, Salary, Workplace Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3.5 text-xs text-slate-700 dark:text-slate-300">
          <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 px-2.5 py-0.5 rounded-lg text-slate-700 dark:text-slate-300 font-medium">
            <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            {job.location || 'Remote'}
          </span>
          <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 px-2.5 py-0.5 rounded-lg text-slate-700 dark:text-slate-300 font-medium">
            {job.workplaceType}
          </span>
          {(job.salaryRange || job.salary) && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25 px-2.5 py-0.5 rounded-lg font-medium">
              <DollarSign className="w-3 h-3 text-emerald-600 dark:text-emerald-400 -mr-0.5" />
              {job.salaryRange || job.salary}
            </span>
          )}
        </div>

        {/* Offer Package Details (if available or status is Offer) */}
        {job.offerDetails && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-500/30 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
              <Gift className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Offer Details & Terms:</span>
            </div>
            <p className="text-[11px] text-emerald-900 dark:text-emerald-200 whitespace-pre-line font-mono bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-emerald-200/60 dark:border-emerald-500/20 leading-relaxed">
              {job.offerDetails}
            </p>
          </div>
        )}

        {/* Applied Date info */}
        <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-500 dark:text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          {job.appliedDate ? (
            <span>
              Applied {formatDate(job.appliedDate)}{' '}
              <span className="text-slate-400 dark:text-slate-500">
                ({daysSinceApplied === 0 ? 'Today' : `${daysSinceApplied}d ago`})
              </span>
            </span>
          ) : (
            <span className="italic text-slate-400 dark:text-slate-500">Not yet applied (Saved)</span>
          )}
        </div>

        {/* Highlighted Next Follow-Up Reminder Box */}
        {nextReminder && job.status !== 'Rejected' ? (
          <div className="mt-3.5 p-3 rounded-xl border bg-slate-50/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Follow-Up Reminder:</span>
              </div>
              {(() => {
                const badge = getUrgencyBadge(nextReminder.dueDate, nextReminder.completed);
                return (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.colorClass}`}
                  >
                    {badge.label}
                  </span>
                );
              })()}
            </div>
            <p className="text-slate-800 dark:text-slate-300 font-medium pl-5">{nextReminder.title}</p>
            {nextReminder.notes && (
              <p className="text-slate-500 pl-5 text-[11px] italic">
                "{nextReminder.notes}"
              </p>
            )}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/80 pl-5">
              <button
                onClick={() => onSnoozeReminder(job.id, nextReminder.id, 3)}
                className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors cursor-pointer"
                title="Snooze 3 days"
              >
                +3 Days
              </button>
              <button
                onClick={() => onToggleReminder(job.id, nextReminder.id)}
                className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-md border border-emerald-200 dark:border-emerald-500/30 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3 h-3" />
                Mark Done
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 py-2 px-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between text-slate-400 dark:text-slate-500">
            <span>{job.status === 'Rejected' ? 'Position closed • No reminders' : 'No pending reminders'}</span>
            {job.status !== 'Rejected' && (
              <button
                onClick={() => onAddReminder(job)}
                className="text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                Add Follow-up
              </button>
            )}
          </div>
        )}

        {/* Upcoming Interview Round (if scheduled) */}
        {nextInterview && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
              <span>Interview: {nextInterview.roundName}</span>
            </div>
            <span className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold">
              {formatDate(nextInterview.date)}{' '}
              {nextInterview.time ? `@ ${nextInterview.time}` : ''}
            </span>
          </div>
        )}

        {/* Recruiter / Contact snippet if available */}
        {job.contactName && (
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800/70">
            <div className="flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <span className="truncate text-slate-700 dark:text-slate-400 font-medium">
                {job.contactName} {job.contactRole ? `(${job.contactRole})` : ''}
              </span>
            </div>
            {job.contactEmail && (
              <a
                href={`mailto:${job.contactEmail}`}
                className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 p-1 transition-colors"
                title={`Email ${job.contactEmail}`}
              >
                <Mail className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Practice Interview Button */}
          <button
            id={`practice-interview-btn-${job.id}`}
            onClick={() => onPracticeInterview?.(job)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-500/30 transition-colors cursor-pointer"
            title="Practice mock interview & view role-specific questions"
          >
            <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>Practice Interview</span>
          </button>

          {/* Tailor Resume Quick Button */}
          {onTailorResume && (
            <button
              onClick={() => onTailorResume(job)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:hover:bg-purple-500/25 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-500/30 transition-colors cursor-pointer"
              title="Tailor base resume for this application"
            >
              <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              <span>Tailor</span>
            </button>
          )}

          {/* Follow-up Email Templates Button */}
          <button
            id={`email-template-btn-${job.id}`}
            onClick={() => onOpenEmailTemplates(job)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
            title="Open pre-drafted follow-up emails for this application"
          >
            <Send className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Email</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {job.status !== 'Rejected' && (
            <button
              onClick={() => onAddReminder(job)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Add reminder"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(job)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit Application"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(job.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete Application"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
