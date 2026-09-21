import React from 'react';
import {
  Briefcase,
  Layers,
  Award,
  Bell,
  TrendingUp,
} from 'lucide-react';
import { JobApplication, JobStatus } from '../types';
import { getRelativeDayDifference } from '../utils/dateUtils';

interface MetricsBarProps {
  jobs: JobApplication[];
  selectedStatus: JobStatus | 'ALL';
  onSelectStatus: (status: JobStatus | 'ALL') => void;
  selectedUrgency: 'ALL' | 'DUE_NOW' | 'OVERDUE' | 'UPCOMING';
  onSelectUrgency: (urgency: 'ALL' | 'DUE_NOW' | 'OVERDUE' | 'UPCOMING') => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  jobs,
  selectedStatus,
  onSelectStatus,
  selectedUrgency,
  onSelectUrgency,
}) => {
  const total = jobs.length;
  const applied = jobs.filter((j) => j.status === 'Applied').length;
  const screening = jobs.filter((j) => j.status === 'Screening').length;
  const interviewing = jobs.filter((j) => j.status === 'Interviewing').length;
  const assessment = jobs.filter((j) => j.status === 'Assessment').length;
  const offers = jobs.filter((j) => j.status === 'Offer').length;

  const activePipelines = screening + interviewing + assessment;

  // Reminders metrics
  let overdueCount = 0;
  let dueTodayCount = 0;
  let upcomingCount = 0;

  jobs.forEach((j) => {
    j.reminders.forEach((r) => {
      if (!r.completed) {
        const diff = getRelativeDayDifference(r.dueDate);
        if (diff < 0) overdueCount++;
        else if (diff === 0) dueTodayCount++;
        else if (diff <= 7) upcomingCount++;
      }
    });
  });

  const urgentTotal = overdueCount + dueTodayCount;

  const responsiveCount = jobs.filter(
    (j) => j.status !== 'Saved' && j.status !== 'Applied'
  ).length;
  const submittedCount = jobs.filter((j) => j.status !== 'Saved').length;
  const responseRate =
    submittedCount > 0 ? Math.round((responsiveCount / submittedCount) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {/* 1. Total Applications */}
      <button
        id="metric-total-apps"
        onClick={() => {
          onSelectStatus('ALL');
          onSelectUrgency('ALL');
        }}
        className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group flex flex-col justify-between cursor-pointer ${
          selectedStatus === 'ALL' && selectedUrgency === 'ALL'
            ? 'bg-indigo-50/80 dark:bg-slate-900 border-indigo-500/80 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/50'
            : 'bg-white hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-900/80 border-slate-200/90 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
        }`}
        title="Show all applications"
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            Total Tracked
          </span>
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center">
            <Briefcase className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-light tracking-tight text-slate-900 dark:text-white">{total}</span>
          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            {applied} applied
          </span>
        </div>
      </button>

      {/* 2. Active Interviews & Stages */}
      <button
        id="metric-active-pipeline"
        onClick={() => {
          onSelectStatus(selectedStatus === 'Interviewing' ? 'ALL' : 'Interviewing');
          onSelectUrgency('ALL');
        }}
        className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
          selectedStatus === 'Interviewing'
            ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/50'
            : 'bg-white hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-900/80 border-slate-200/90 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
        }`}
        title={selectedStatus === 'Interviewing' ? 'Click to show all jobs' : 'Filter by interviewing jobs'}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            In Loops
          </span>
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-light tracking-tight text-indigo-600 dark:text-indigo-400">
            {activePipelines < 10 ? `0${activePipelines}` : activePipelines}
          </span>
          <span className="text-slate-500 dark:text-slate-400 text-xs">
            {interviewing} interviews
          </span>
        </div>
      </button>

      {/* 3. Follow-Ups Due (Urgent Action Required) */}
      <button
        id="metric-urgent-followups"
        onClick={() => {
          onSelectUrgency(selectedUrgency === 'DUE_NOW' ? 'ALL' : 'DUE_NOW');
        }}
        className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
          selectedUrgency === 'DUE_NOW'
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
            : urgentTotal > 0
            ? 'bg-amber-50/60 dark:bg-slate-900/60 border-amber-400/50 dark:border-amber-500/30 hover:border-amber-500 text-slate-900 dark:text-slate-100 shadow-xs'
            : 'bg-white hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-900/80 border-slate-200/90 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
        }`}
        title={selectedUrgency === 'DUE_NOW' ? 'Click to show all reminders' : 'Filter by due or overdue follow-ups'}
      >
        <div className="flex items-center justify-between w-full">
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              urgentTotal > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Pending Follow-Up
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
            <Bell
              className={`w-3.5 h-3.5 ${
                urgentTotal > 0 ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-slate-400'
              }`}
            />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={`text-3xl font-light tracking-tight ${
              urgentTotal > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {urgentTotal < 10 ? `0${urgentTotal}` : urgentTotal}
          </span>
          <span
            className={`text-xs font-medium ${
              urgentTotal > 0 ? 'text-amber-700 dark:text-amber-400/80' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {overdueCount > 0 ? `${overdueCount} overdue` : `${dueTodayCount} today`}
          </span>
        </div>
      </button>

      {/* 4. Offers Received */}
      <button
        id="metric-offers-received"
        onClick={() => {
          onSelectStatus(selectedStatus === 'Offer' ? 'ALL' : 'Offer');
          onSelectUrgency('ALL');
        }}
        className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
          selectedStatus === 'Offer'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/50'
            : offers > 0
            ? 'bg-emerald-50/60 dark:bg-slate-900/60 border-emerald-400/50 dark:border-emerald-500/30 hover:border-emerald-500 text-slate-900 dark:text-slate-100 shadow-xs'
            : 'bg-white hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-900/80 border-slate-200/90 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
        }`}
        title={selectedStatus === 'Offer' ? 'Click to show all jobs' : 'Filter by offers'}
      >
        <div className="flex items-center justify-between w-full">
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              offers > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Offers
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
            <Award
              className={`w-3.5 h-3.5 ${
                offers > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
              }`}
            />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={`text-3xl font-light tracking-tight ${
              offers > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {offers < 10 ? `0${offers}` : offers}
          </span>
          <span
            className={`text-xs font-medium ${
              offers > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {offers > 0 ? 'Reviewing' : '0 so far'}
          </span>
        </div>
      </button>

      {/* 5. Response Rate / Activity */}
      <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 col-span-2 sm:col-span-1 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Response Rate
          </span>
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-light tracking-tight text-slate-900 dark:text-white">
            {responseRate}%
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {responsiveCount}/{submittedCount} replied
          </span>
        </div>
      </div>
    </div>
  );
};
