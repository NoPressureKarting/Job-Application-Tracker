import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building2,
  CalendarClock,
  Plus,
  PlusCircle,
  ChevronDown,
} from 'lucide-react';
import { JobApplication, FollowUpReminder } from '../types';
import {
  formatDate,
  getRelativeDayDifference,
  getUrgencyBadge,
} from '../utils/dateUtils';

interface RemindersViewProps {
  jobs: JobApplication[];
  onToggleReminder: (jobId: string, reminderId: string) => void;
  onSnoozeReminder: (jobId: string, reminderId: string, days: number) => void;
  onOpenEmailTemplates: (job: JobApplication) => void;
  onEditJob: (job: JobApplication) => void;
  onAddNewReminderToJob?: (job: JobApplication) => void;
}

interface FlattenedReminder {
  job: JobApplication;
  reminder: FollowUpReminder;
  daysDiff: number;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  jobs,
  onToggleReminder,
  onSnoozeReminder,
  onOpenEmailTemplates,
  onEditJob,
  onAddNewReminderToJob,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'completed'>('pending');
  const [isSelectJobOpen, setIsSelectJobOpen] = useState(false);

  // Active jobs (excluding rejected applications which do not have reminders)
  const activeJobs = jobs.filter((j) => j.status !== 'Rejected');

  // Collect all reminders across all active jobs
  const allReminders: FlattenedReminder[] = [];
  jobs.forEach((job) => {
    if (job.status === 'Rejected') return;
    (job.reminders || []).forEach((reminder) => {
      allReminders.push({
        job,
        reminder,
        daysDiff: getRelativeDayDifference(reminder.dueDate),
      });
    });
  });

  // Sort by dueDate
  allReminders.sort((a, b) => a.reminder.dueDate.localeCompare(b.reminder.dueDate));

  const overdueList = allReminders.filter(
    (r) => !r.reminder.completed && r.daysDiff < 0
  );
  const todayList = allReminders.filter(
    (r) => !r.reminder.completed && r.daysDiff === 0
  );
  const upcomingWeekList = allReminders.filter(
    (r) => !r.reminder.completed && r.daysDiff > 0 && r.daysDiff <= 7
  );
  const futureList = allReminders.filter(
    (r) => !r.reminder.completed && r.daysDiff > 7
  );
  const completedList = allReminders.filter((r) => r.reminder.completed);

  // All upcoming interview events
  const interviewEvents: {
    job: JobApplication;
    roundName: string;
    date: string;
    time?: string;
    interviewer?: string;
    completed: boolean;
  }[] = [];

  jobs.forEach((job) => {
    if (job.status === 'Rejected') return;
    job.interviews.forEach((int) => {
      interviewEvents.push({
        job,
        roundName: int.roundName,
        date: int.date,
        time: int.time,
        interviewer: int.interviewer,
        completed: int.completed,
      });
    });
  });
  interviewEvents.sort((a, b) => a.date.localeCompare(b.date));
  const upcomingInterviews = interviewEvents.filter((i) => !i.completed);

  const renderReminderItem = (item: FlattenedReminder) => {
    const { job, reminder, daysDiff } = item;
    const urgency = getUrgencyBadge(reminder.dueDate, reminder.completed);

    return (
      <div
        key={`${job.id}-${reminder.id}`}
        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          reminder.completed
            ? 'bg-slate-100/60 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/60 opacity-60'
            : daysDiff < 0
            ? 'bg-rose-50/80 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/25 shadow-xs'
            : daysDiff === 0
            ? 'bg-amber-50/80 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/25 shadow-xs'
            : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
        }`}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={() => onToggleReminder(job.id, reminder.id)}
            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
              reminder.completed
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 bg-white dark:bg-slate-800 text-transparent hover:text-emerald-500'
            }`}
            title={reminder.completed ? 'Mark pending' : 'Mark completed'}
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                onClick={() => onEditJob(job)}
                className="font-bold text-slate-900 dark:text-slate-100 text-sm hover:underline cursor-pointer flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                {job.company}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                • {job.role}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${urgency.colorClass}`}
              >
                {urgency.label}
              </span>
            </div>

            <p
              className={`text-sm mt-1 font-medium ${
                reminder.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-800 dark:text-slate-200'
              }`}
            >
              {reminder.title}
            </p>

            {reminder.notes && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 inline-block">
                Note: {reminder.notes}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          {!reminder.completed && (
            <>
              <button
                onClick={() => onSnoozeReminder(job.id, reminder.id, 3)}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
                title="Snooze reminder by 3 days"
              >
                +3 Days
              </button>
              <button
                onClick={() => onSnoozeReminder(job.id, reminder.id, 7)}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
                title="Snooze reminder by 1 week"
              >
                +1 Week
              </button>
            </>
          )}

          <button
            onClick={() => onOpenEmailTemplates(job)}
            className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-500/30 cursor-pointer"
            title="Open ready-to-send follow up email drafts"
          >
            <Send className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>Email</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h2 className="text-lg font-bold">Follow-Up & Interview Agenda</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
            Staying persistent is key to landing offers. Keep recruiter
            conversations warm, send timely interview thank-you notes, and track
            decision milestones.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {onAddNewReminderToJob && activeJobs.length > 0 && (
            <div className="relative">
              <button
                id="schedule-followup-header-btn"
                onClick={() => setIsSelectJobOpen(!isSelectJobOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Follow-Up</span>
                <ChevronDown className="w-3 h-3 opacity-80" />
              </button>

              {isSelectJobOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsSelectJobOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-40 text-xs">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                      Select Job Application
                    </div>
                    {activeJobs.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => {
                          setIsSelectJobOpen(false);
                          onAddNewReminderToJob(job);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col transition-colors cursor-pointer"
                      >
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {job.company}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {job.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-850 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setFilterType('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterType === 'pending'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Active ({overdueList.length + todayList.length + upcomingWeekList.length + futureList.length})
            </button>
            <button
              onClick={() => setFilterType('completed')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterType === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Done ({completedList.length})
            </button>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Scheduled Interviews Timeline Widget */}
      {upcomingInterviews.length > 0 && filterType !== 'completed' && (
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
              <h3 className="font-bold text-sm text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                Upcoming Interview Schedule ({upcomingInterviews.length})
              </h3>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Synchronized from applications
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingInterviews.map((int, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900/80 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {int.job.company}
                  </span>
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/30">
                    {formatDate(int.date)}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {int.roundName}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>{int.time ? `@ ${int.time}` : 'Time TBD'}</span>
                  {int.interviewer && (
                    <span className="truncate">With {int.interviewer}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Overdue Section */}
      {(filterType === 'pending' || filterType === 'all') && overdueList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              Overdue Reminders ({overdueList.length})
            </h3>
          </div>
          <div className="space-y-2.5">
            {overdueList.map(renderReminderItem)}
          </div>
        </div>
      )}

      {/* 2. Due Today Section */}
      {(filterType === 'pending' || filterType === 'all') && todayList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <h3 className="font-bold text-sm text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              Due Today ({todayList.length})
            </h3>
          </div>
          <div className="space-y-2.5">
            {todayList.map(renderReminderItem)}
          </div>
        </div>
      )}

      {/* 3. Upcoming This Week */}
      {(filterType === 'pending' || filterType === 'all') && upcomingWeekList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            <h3 className="font-bold text-sm text-sky-700 dark:text-sky-300 uppercase tracking-wider">
              Next 7 Days ({upcomingWeekList.length})
            </h3>
          </div>
          <div className="space-y-2.5">
            {upcomingWeekList.map(renderReminderItem)}
          </div>
        </div>
      )}

      {/* 4. Later / Future */}
      {(filterType === 'pending' || filterType === 'all') && futureList.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Later / Future ({futureList.length})
          </h3>
          <div className="space-y-2.5">
            {futureList.map(renderReminderItem)}
          </div>
        </div>
      )}

      {/* 5. Completed Archive */}
      {(filterType === 'completed' || filterType === 'all') && completedList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <h3 className="font-bold text-sm text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Completed Reminders ({completedList.length})
            </h3>
          </div>
          <div className="space-y-2.5">
            {completedList.map(renderReminderItem)}
          </div>
        </div>
      )}

      {/* Empty State */}
      {allReminders.length === 0 && (
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200">No Reminders Created Yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Set follow-up reminders on your applications so you never miss a critical recruiter email or interview milestone.
            </p>
          </div>
          {onAddNewReminderToJob && activeJobs.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => onAddNewReminderToJob(activeJobs[0])}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Follow-Up for {activeJobs[0].company}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
