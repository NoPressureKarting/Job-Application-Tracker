import React, { useState } from 'react';
import {
  ExternalLink,
  ChevronDown,
  Send,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  PlusCircle,
} from 'lucide-react';
import { JobApplication, JobStatus } from '../types';
import { formatDate, getUrgencyBadge } from '../utils/dateUtils';
import { JOB_STATUS_CONFIG } from '../utils/statusUtils';
import { getSafeExternalLink } from '../lib/firestoreSync';

interface JobTableViewProps {
  jobs: JobApplication[];
  onEdit: (job: JobApplication) => void;
  onDelete: (jobId: string) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => void;
  onToggleReminder: (jobId: string, reminderId: string) => void;
  onAddReminder?: (job: JobApplication) => void;
  onOpenEmailTemplates: (job: JobApplication) => void;
  onPracticeInterview?: (job: JobApplication) => void;
  onTailorResume?: (job: JobApplication) => void;
}

export const JobTableView: React.FC<JobTableViewProps> = ({
  jobs,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleReminder,
  onAddReminder,
  onOpenEmailTemplates,
  onPracticeInterview,
  onTailorResume,
}) => {
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);

  if (jobs.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 shadow-xs">
        No applications match your current filters.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">Company & Role</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Applied Date</th>
              <th className="py-3.5 px-4">Next Follow-Up / Reminder</th>
              <th className="py-3.5 px-4">Location & Salary</th>
              <th className="py-3.5 px-4">Contact</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {jobs.map((job) => {
              const statusCfg = JOB_STATUS_CONFIG[job.status] || JOB_STATUS_CONFIG.Applied;
              const pendingReminders = job.reminders
                .filter((r) => !r.completed)
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
              const nextReminder = pendingReminders[0];

              return (
                <tr
                  key={job.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Company & Role */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {job.company}
                      </span>
                      {getSafeExternalLink(job.jobUrl) && (
                        <a
                          href={getSafeExternalLink(job.jobUrl)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title="Open job link"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 font-medium">{job.role}</div>
                    {job.tailoredResumeData?.atsMatchScore ? (
                      <div className="mt-1 flex items-center gap-1">
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold">
                          <Sparkles className="w-2.5 h-2.5" />
                          {job.tailoredResumeData.atsMatchScore}% ATS
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={job.resumeVersion}>
                          {job.resumeVersion}
                        </span>
                      </div>
                    ) : job.resumeVersion ? (
                      <div className="mt-0.5 text-[10px] text-slate-400 truncate max-w-[150px]" title={job.resumeVersion}>
                        📄 {job.resumeVersion}
                      </div>
                    ) : null}
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3.5 px-4">
                    <div className="relative inline-block">
                      <button
                        onClick={() =>
                          setOpenStatusMenuId(
                            openStatusMenuId === job.id ? null : job.id
                          )
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer ${statusCfg.bgColor} ${statusCfg.textColor} ${statusCfg.borderColor}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`}
                        />
                        <span>{job.status}</span>
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>

                      {openStatusMenuId === job.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenStatusMenuId(null)}
                          />
                          <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1 z-50 text-xs">
                            {(Object.keys(JOB_STATUS_CONFIG) as JobStatus[]).map(
                              (st) => (
                                <button
                                  key={st}
                                  onClick={() => {
                                    onStatusChange(job.id, st);
                                    setOpenStatusMenuId(null);
                                  }}
                                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                                    job.status === st
                                      ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-slate-50 dark:bg-slate-800/80'
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${JOB_STATUS_CONFIG[st].dotColor}`}
                                  />
                                  <span>{st}</span>
                                </button>
                              )
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Applied Date */}
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {formatDate(job.appliedDate)}
                  </td>

                  {/* Next Reminder */}
                  <td className="py-3.5 px-4">
                    {nextReminder && job.status !== 'Rejected' ? (
                      <div className="flex items-center gap-2">
                        {(() => {
                          const badge = getUrgencyBadge(
                            nextReminder.dueDate,
                            nextReminder.completed
                          );
                          return (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${badge.colorClass}`}
                            >
                              {badge.label}
                            </span>
                          );
                        })()}
                        <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[180px]">
                          {nextReminder.title}
                        </span>
                        <button
                          onClick={() =>
                            onToggleReminder(job.id, nextReminder.id)
                          }
                          className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors cursor-pointer"
                          title="Mark completed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : onAddReminder && job.status !== 'Rejected' ? (
                      <button
                        onClick={() => onAddReminder(job)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                        title="Set follow-up reminder"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>Add reminder</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">
                        {job.status === 'Rejected' ? 'Position closed' : 'No reminder set'}
                      </span>
                    )}
                  </td>

                  {/* Location & Salary */}
                  <td className="py-3.5 px-4">
                    <div className="text-slate-700 dark:text-slate-300">
                      {job.location || 'Remote'} ({job.workplaceType})
                    </div>
                    {(job.salaryRange || job.salary) && (
                      <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {job.salaryRange || job.salary}
                      </div>
                    )}
                    {job.offerDetails && (
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 mt-1 inline-block">
                        Offer terms logged
                      </div>
                    )}
                  </td>

                  {/* Contact */}
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {job.contactName ? (
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-200">
                          {job.contactName}
                        </div>
                        {job.contactEmail && (
                          <div className="text-slate-400 dark:text-slate-500 text-[11px]">
                            {job.contactEmail}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {onAddReminder && job.status !== 'Rejected' && (
                        <button
                          onClick={() => onAddReminder(job)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg transition-colors cursor-pointer"
                          title="Add Reminder"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onPracticeInterview?.(job)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg transition-colors cursor-pointer"
                        title="Practice Interview & Prep"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      {onTailorResume && (
                        <button
                          onClick={() => onTailorResume(job)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-500/20 rounded-lg transition-colors cursor-pointer"
                          title="Tailor base resume for this job"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        </button>
                      )}
                      <button
                        onClick={() => onOpenEmailTemplates(job)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Open follow-up email templates"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(job)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Job"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(job.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Job"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
