import { JobStatus } from '../types';

export const JOB_STATUS_CONFIG: Record<
  JobStatus,
  {
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    dotColor: string;
    columnTitle: string;
  }
> = {
  Saved: {
    label: 'Saved / Wishlist',
    bgColor: 'bg-slate-100 dark:bg-slate-800/60',
    textColor: 'text-slate-700 dark:text-slate-300',
    borderColor: 'border-slate-300 dark:border-slate-700/60',
    dotColor: 'bg-slate-500 dark:bg-slate-400',
    columnTitle: 'Wishlist & Saved',
  },
  Applied: {
    label: 'Applied',
    bgColor: 'bg-sky-50 dark:bg-sky-500/15',
    textColor: 'text-sky-700 dark:text-sky-300',
    borderColor: 'border-sky-300 dark:border-sky-500/30',
    dotColor: 'bg-sky-500 dark:bg-sky-400',
    columnTitle: 'Applied (Waiting)',
  },
  Screening: {
    label: 'Screening',
    bgColor: 'bg-indigo-50 dark:bg-indigo-500/15',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    borderColor: 'border-indigo-300 dark:border-indigo-500/30',
    dotColor: 'bg-indigo-500 dark:bg-indigo-400',
    columnTitle: 'Recruiter Screening',
  },
  Assessment: {
    label: 'Take-Home / Test',
    bgColor: 'bg-purple-50 dark:bg-purple-500/15',
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-300 dark:border-purple-500/30',
    dotColor: 'bg-purple-500 dark:bg-purple-400',
    columnTitle: 'Assessment & Test',
  },
  Interviewing: {
    label: 'Interview Loops',
    bgColor: 'bg-blue-50 dark:bg-blue-500/15',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-300 dark:border-blue-500/30',
    dotColor: 'bg-blue-500 dark:bg-blue-400',
    columnTitle: 'Interview Loops',
  },
  Offer: {
    label: 'Offer Received 🎉',
    bgColor: 'bg-emerald-50 dark:bg-emerald-500/15',
    textColor: 'text-emerald-800 dark:text-emerald-300',
    borderColor: 'border-emerald-300 dark:border-emerald-500/30',
    dotColor: 'bg-emerald-500 dark:bg-emerald-400',
    columnTitle: 'Offer Received',
  },
  Rejected: {
    label: 'Not Selected',
    bgColor: 'bg-rose-50 dark:bg-rose-500/15',
    textColor: 'text-rose-700 dark:text-rose-300',
    borderColor: 'border-rose-300 dark:border-rose-500/30',
    dotColor: 'bg-rose-500 dark:bg-rose-400',
    columnTitle: 'Archived / Rejected',
  },
  Withdrawn: {
    label: 'Withdrawn',
    bgColor: 'bg-slate-100 dark:bg-slate-800/40',
    textColor: 'text-slate-600 dark:text-slate-400',
    borderColor: 'border-slate-300 dark:border-slate-700/40',
    dotColor: 'bg-slate-400 dark:bg-slate-500',
    columnTitle: 'Withdrawn',
  },
};
