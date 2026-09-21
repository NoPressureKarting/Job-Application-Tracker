import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { JobApplication, FollowUpReminder, ReminderType } from '../types';
import { getTodayString, addDays } from '../utils/dateUtils';

interface AddReminderModalProps {
  job: JobApplication | null;
  isOpen?: boolean;
  onClose: () => void;
  onSave?: (jobId: string, reminder: FollowUpReminder) => void;
  onSaveReminder?: (jobId: string, reminder: FollowUpReminder) => void;
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  job,
  isOpen = true,
  onClose,
  onSave,
  onSaveReminder,
}) => {
  if (!isOpen || !job) return null;

  const today = getTodayString();
  const [title, setTitle] = useState(`Follow up with ${job.company} on status`);
  const [dueDate, setDueDate] = useState(addDays(today, 7));
  const [type, setType] = useState<ReminderType>('application-followup');
  const [notes, setNotes] = useState('');

  // Reset / sync form whenever target job changes
  useEffect(() => {
    if (job) {
      setTitle(`Follow up with ${job.company} on status`);
      setDueDate(addDays(getTodayString(), 7));
      setType('application-followup');
      setNotes('');
    }
  }, [job]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newReminder: FollowUpReminder = {
      id: `rem-${Date.now()}`,
      title: title.trim(),
      dueDate,
      completed: false,
      type,
      notes: notes.trim() || undefined,
    };

    const saveHandler = onSave || onSaveReminder;
    if (saveHandler) {
      saveHandler(job.id, newReminder);
    }
    onClose();
  };

  const handleQuickPreset = (presetTitle: string, daysAhead: number, presetType: ReminderType) => {
    setTitle(presetTitle);
    setDueDate(addDays(today, daysAhead));
    setType(presetType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                Add Follow-Up Reminder
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                For {job.company} • {job.role}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Quick Follow-Up Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleQuickPreset(
                    `Send 1-week follow-up email to ${job.company}`,
                    7,
                    'application-followup'
                  )
                }
                className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg font-medium border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
              >
                + 1 Week Follow-Up
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickPreset(
                    `Send post-interview thank you to ${job.company}`,
                    1,
                    'post-interview-thank-you'
                  )
                }
                className="text-xs px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/15 dark:hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 rounded-lg font-medium transition-colors cursor-pointer"
              >
                + Post-Interview Thank You
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickPreset(
                    `Check in on hiring decision timeline for ${job.role}`,
                    5,
                    'decision-check-in'
                  )
                }
                className="text-xs px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 rounded-lg font-medium transition-colors cursor-pointer"
              >
                + Decision Timeline
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reminder Task
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ReminderType)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              >
                <option value="application-followup">Application Follow-Up</option>
                <option value="post-interview-thank-you">Interview Thank-You</option>
                <option value="decision-check-in">Decision Check-In</option>
                <option value="assessment-due">Assessment Due</option>
                <option value="offer-response">Offer Response</option>
                <option value="custom">Custom Task</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Additional Context / Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Check recruiter's email from Thursday"
              className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md shadow-indigo-500/20 transition-colors cursor-pointer"
            >
              Save Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
