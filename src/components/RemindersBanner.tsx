import React from 'react';
import { ChevronRight, Bell } from 'lucide-react';
import { JobApplication } from '../types';
import { getRelativeDayDifference } from '../utils/dateUtils';

interface RemindersBannerProps {
  jobs: JobApplication[];
  onViewReminders: () => void;
}

export const RemindersBanner: React.FC<RemindersBannerProps> = ({
  jobs,
  onViewReminders,
}) => {
  let overdueCount = 0;
  let dueTodayCount = 0;
  const urgentJobs: { job: JobApplication; title: string; isOverdue: boolean }[] = [];

  jobs.forEach((job) => {
    if (job.status === 'Rejected') return;
    job.reminders.forEach((rem) => {
      if (!rem.completed) {
        const diff = getRelativeDayDifference(rem.dueDate);
        if (diff < 0) {
          overdueCount++;
          urgentJobs.push({ job, title: rem.title, isOverdue: true });
        } else if (diff === 0) {
          dueTodayCount++;
          urgentJobs.push({ job, title: rem.title, isOverdue: false });
        }
      }
    });
  });

  const totalUrgent = overdueCount + dueTodayCount;
  if (totalUrgent === 0) return null;

  return (
    <div
      onClick={onViewReminders}
      className={`cursor-pointer rounded-2xl p-4 border transition-all flex items-center justify-between gap-3 ${
        overdueCount > 0
          ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 hover:border-rose-300 dark:hover:border-rose-500/50 shadow-sm'
          : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 hover:border-amber-300 dark:hover:border-amber-500/50 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            overdueCount > 0
              ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
              : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
          }`}
        >
          <Bell className="w-4 h-4 animate-pulse" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              {overdueCount > 0
                ? `${overdueCount} Overdue Follow-Up ${overdueCount === 1 ? 'Action' : 'Actions'}`
                : `${dueTodayCount} Follow-Up Due Today`}
            </span>
            {overdueCount > 0 && dueTodayCount > 0 && (
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                (+{dueTodayCount} due today)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
            {urgentJobs[0]
              ? `Next: ${urgentJobs[0].job.company} — "${urgentJobs[0].title}"`
              : 'Take action to maintain momentum in your job search'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors shadow-xs">
        <span>Review Agenda</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};
