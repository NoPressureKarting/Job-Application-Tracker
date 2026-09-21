import React from 'react';
import {
  Plus,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Send,
  Sparkles,
  Filter,
  Eye,
  PlusCircle,
} from 'lucide-react';
import { JobApplication, JobStatus } from '../types';
import { JOB_STATUS_CONFIG } from '../utils/statusUtils';
import { getUrgencyBadge } from '../utils/dateUtils';
import { getSafeExternalLink } from '../lib/firestoreSync';

interface KanbanBoardProps {
  jobs: JobApplication[];
  onEdit: (job: JobApplication) => void;
  onDelete: (jobId: string) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => void;
  onAddNewWithStatus: (status: JobStatus) => void;
  onToggleReminder: (jobId: string, reminderId: string) => void;
  onAddReminder?: (job: JobApplication) => void;
  onOpenEmailTemplates: (job: JobApplication) => void;
  onPracticeInterview?: (job: JobApplication) => void;
  statusFilter?: JobStatus | 'ALL';
  onClearStatusFilter?: () => void;
  totalAllJobs?: number;
}

const COLUMNS: JobStatus[] = [
  'Saved',
  'Applied',
  'Screening',
  'Assessment',
  'Interviewing',
  'Offer',
  'Rejected',
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  jobs,
  onEdit,
  onStatusChange,
  onAddNewWithStatus,
  onToggleReminder,
  onAddReminder,
  onOpenEmailTemplates,
  onPracticeInterview,
  statusFilter = 'ALL',
  onClearStatusFilter,
  totalAllJobs,
}) => {
  return (
    <div className="space-y-3">
      {/* If status filter is active on Kanban, show informative bar so user knows why other columns are empty */}
      {statusFilter !== 'ALL' && onClearStatusFilter && (
        <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-300 animate-fade-in">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              Pipeline Board is currently filtered to show only <strong>"{statusFilter}"</strong> stage ({jobs.length} items).
              {totalAllJobs !== undefined ? ` (Other ${Math.max(0, totalAllJobs - jobs.length)} jobs are in other stages)` : ''}
            </span>
          </div>
          <button
            onClick={onClearStatusFilter}
            className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 font-semibold hover:bg-amber-100 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            Show All Stages
          </button>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 min-h-[70vh]">
        {COLUMNS.map((columnStatus, colIndex) => {
          const config = JOB_STATUS_CONFIG[columnStatus];
          const columnJobs = jobs.filter((j) => j.status === columnStatus);
          const isTargetedColumn = statusFilter === columnStatus;

          return (
            <div
              key={columnStatus}
              className={`flex-shrink-0 w-80 rounded-2xl flex flex-col max-h-[80vh] shadow-xs transition-all ${
                isTargetedColumn
                  ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-2 border-indigo-500/80 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Column Header */}
              <div
                className={`p-3.5 border-b flex items-center justify-between rounded-t-2xl ${
                  isTargetedColumn
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800'
                    : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {config.columnTitle}
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700/60">
                    {columnJobs.length}
                  </span>
                </div>
                <button
                  onClick={() => onAddNewWithStatus(columnStatus)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                  title={`Add job to ${config.columnTitle}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Column Body Cards */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {columnJobs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl">
                    {statusFilter !== 'ALL' && statusFilter !== columnStatus ? (
                      <span className="text-slate-400">Hidden by filter</span>
                    ) : (
                      <span>No jobs in {config.columnTitle}</span>
                    )}
                  </div>
                ) : (
                  columnJobs.map((job) => {
                    const activeReminder = job.reminders.find((r) => !r.completed);
                    const urgency = activeReminder
                      ? getUrgencyBadge(activeReminder.dueDate)
                      : null;

                    return (
                      <div
                        key={job.id}
                        className="bg-white dark:bg-slate-800/90 rounded-xl p-3.5 border border-slate-200/90 dark:border-slate-700/70 hover:border-indigo-300 dark:hover:border-indigo-500/50 shadow-xs hover:shadow-md transition-all space-y-2.5 text-slate-900 dark:text-slate-100 group"
                      >
                        {/* Company & Role */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {job.company}
                            </h5>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
                              {job.role}
                            </p>
                          </div>
                          {getSafeExternalLink(job.jobUrl) && (
                            <a
                              href={getSafeExternalLink(job.jobUrl)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        {/* Workplace & Salary Meta */}
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-medium">
                            {job.workplaceType}
                          </span>
                          {(job.salaryRange || job.salary) && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/20 truncate max-w-[140px]">
                              {job.salaryRange || job.salary}
                            </span>
                          )}
                        </div>

                        {/* Urgent reminder badge or Add reminder prompt */}
                        {activeReminder && job.status !== 'Rejected' ? (
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold uppercase text-[10px] border ${
                                  urgency?.colorClass || 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {urgency?.label || 'Reminder'}
                              </span>
                              <span className="text-slate-400 dark:text-slate-500 text-[10px] flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {activeReminder.dueDate}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1">
                              {activeReminder.title}
                            </p>
                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() =>
                                  onToggleReminder(job.id, activeReminder.id)
                                }
                                className="text-[10px] text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Done
                              </button>
                            </div>
                          </div>
                        ) : (
                          onAddReminder && job.status !== 'Rejected' && (
                            <button
                              onClick={() => onAddReminder(job)}
                              className="w-full py-1 px-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-700/60 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/10 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              title="Set follow-up reminder"
                            >
                              <PlusCircle className="w-3 h-3" />
                              <span>Add Reminder</span>
                            </button>
                          )
                        )}

                        {/* Card Footer: Move arrows & Actions */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                          {/* Left/Right Column Move Controls */}
                          <div className="flex items-center gap-1">
                            <button
                              disabled={colIndex === 0}
                              onClick={() =>
                                onStatusChange(job.id, COLUMNS[colIndex - 1])
                              }
                              className={`p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${
                                colIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''
                              }`}
                              title="Move to previous stage"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={colIndex === COLUMNS.length - 1}
                              onClick={() =>
                                onStatusChange(job.id, COLUMNS[colIndex + 1])
                              }
                              className={`p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${
                                colIndex === COLUMNS.length - 1
                                  ? 'opacity-30 cursor-not-allowed'
                                  : ''
                              }`}
                              title="Move to next stage"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            {onAddReminder && job.status !== 'Rejected' && (
                              <button
                                onClick={() => onAddReminder(job)}
                                className="p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 cursor-pointer"
                                title="Add Reminder"
                              >
                                <PlusCircle className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => onPracticeInterview?.(job)}
                              className="p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 cursor-pointer"
                              title="Practice Interview"
                            >
                              <Sparkles className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onOpenEmailTemplates(job)}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 cursor-pointer"
                              title="Email Template"
                            >
                              <Send className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onEdit(job)}
                              className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
