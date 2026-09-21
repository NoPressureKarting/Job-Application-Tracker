import React from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  X,
  AlertCircle,
  MapPin,
  Eye,
  Sparkles,
} from 'lucide-react';
import { JobStatus, WorkplaceType } from '../types';

export type SortOption =
  | 'applied-desc'
  | 'applied-asc'
  | 'reminder-soonest'
  | 'company-asc'
  | 'company-desc';

interface FilterToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: JobStatus | 'ALL';
  onStatusFilterChange: (status: JobStatus | 'ALL') => void;
  workplaceFilter: WorkplaceType | 'ALL';
  onWorkplaceFilterChange: (type: WorkplaceType | 'ALL') => void;
  urgencyFilter: 'ALL' | 'DUE_NOW' | 'OVERDUE' | 'UPCOMING';
  onUrgencyFilterChange: (urgency: 'ALL' | 'DUE_NOW' | 'OVERDUE' | 'UPCOMING') => void;
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
  totalFiltered: number;
  totalUnfiltered: number;
  onClearFilters: () => void;
  onOpenRecovery?: () => void;
}

const STATUS_LIST: (JobStatus | 'ALL')[] = [
  'ALL',
  'Saved',
  'Applied',
  'Screening',
  'Assessment',
  'Interviewing',
  'Offer',
  'Rejected',
  'Withdrawn',
];

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  workplaceFilter,
  onWorkplaceFilterChange,
  urgencyFilter,
  onUrgencyFilterChange,
  sortBy,
  onSortByChange,
  totalFiltered,
  totalUnfiltered,
  onClearFilters,
  onOpenRecovery,
}) => {
  const isFiltered =
    searchQuery.trim() !== '' ||
    statusFilter !== 'ALL' ||
    workplaceFilter !== 'ALL' ||
    urgencyFilter !== 'ALL';

  const hiddenCount = Math.max(0, totalUnfiltered - totalFiltered);

  return (
    <div className="space-y-2">
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-3.5 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="job-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search company, job role, contact person, or notes..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 border border-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800/80 dark:focus:bg-slate-900 dark:border-slate-700/60 rounded-xl transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Workplace Filter */}
            <div className="relative min-w-[130px] flex-1 sm:flex-none">
              <select
                id="workplace-filter-select"
                value={workplaceFilter}
                onChange={(e) =>
                  onWorkplaceFilterChange(e.target.value as WorkplaceType | 'ALL')
                }
                className="w-full appearance-none pl-8 pr-7 py-2 text-xs font-medium bg-slate-50 hover:bg-slate-100/80 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/60 dark:hover:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-300 cursor-pointer focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Workplaces</option>
                <option value="Remote">Remote Only</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
              <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Follow-up Urgency Filter */}
            <div className="relative min-w-[145px] flex-1 sm:flex-none">
              <select
                id="urgency-filter-select"
                value={urgencyFilter}
                onChange={(e) =>
                  onUrgencyFilterChange(
                    e.target.value as 'ALL' | 'DUE_NOW' | 'OVERDUE' | 'UPCOMING'
                  )
                }
                className={`w-full appearance-none pl-8 pr-7 py-2 text-xs font-medium border rounded-xl cursor-pointer focus:outline-none focus:border-indigo-500 ${
                  urgencyFilter !== 'ALL'
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300'
                }`}
              >
                <option value="ALL">All Reminders</option>
                <option value="DUE_NOW">Due Now / Overdue</option>
                <option value="OVERDUE">Overdue Only</option>
                <option value="UPCOMING">Upcoming (7 days)</option>
              </select>
              <AlertCircle
                className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  urgencyFilter !== 'ALL' ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
                }`}
              />
            </div>

            {/* Sort By Dropdown */}
            <div className="relative min-w-[155px] flex-1 sm:flex-none">
              <select
                id="sort-by-select"
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value as SortOption)}
                className="w-full appearance-none pl-8 pr-7 py-2 text-xs font-medium bg-slate-50 hover:bg-slate-100/80 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/60 dark:hover:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-300 cursor-pointer focus:outline-none focus:border-indigo-500"
              >
                <option value="applied-desc">Applied: Newest First</option>
                <option value="applied-asc">Applied: Oldest First</option>
                <option value="reminder-soonest">Reminder: Soonest Due</option>
                <option value="company-asc">Company: A to Z</option>
                <option value="company-desc">Company: Z to A</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Clear Filters Button */}
            {isFiltered && (
              <button
                id="clear-all-filters-btn"
                onClick={onClearFilters}
                className="px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs"
                title="Clear all active filters and show all applications"
              >
                <X className="w-3.5 h-3.5" />
                <span>Show All ({totalUnfiltered})</span>
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Status Chips Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1.5 border-t border-slate-200 dark:border-slate-800/80 text-xs">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" /> Status:
          </span>
          {STATUS_LIST.map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => {
                  // Toggle status filter off if clicked again
                  if (status !== 'ALL' && statusFilter === status) {
                    onStatusFilterChange('ALL');
                  } else {
                    onStatusFilterChange(status);
                  }
                }}
                className={`px-3 py-1 rounded-full font-semibold transition-all shrink-0 whitespace-nowrap border text-xs cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border-slate-200 dark:bg-slate-800/40 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-700/50'
                }`}
              >
                {status === 'ALL' ? 'All Statuses' : status}
              </button>
            );
          })}

          <div className="ml-auto pl-2 text-slate-500 dark:text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-2">
            <span>
              Showing {totalFiltered} of {totalUnfiltered}
            </span>
          </div>
        </div>
      </div>

      {/* Prominent Active Filter Banner when filter is active */}
      {isFiltered && (
        <div className="px-4 py-2.5 bg-indigo-50/90 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs animate-fade-in">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
            <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              Active Filter: Showing <strong>{totalFiltered}</strong> of <strong>{totalUnfiltered}</strong> total applications
              {hiddenCount > 0 ? ` (${hiddenCount} hidden by filter)` : ''}
              {statusFilter !== 'ALL' && ` • Status: "${statusFilter}"`}
              {searchQuery && ` • Search: "${searchQuery}"`}
              {workplaceFilter !== 'ALL' && ` • Workplace: "${workplaceFilter}"`}
              {urgencyFilter !== 'ALL' && ` • Reminders: "${urgencyFilter}"`}
            </span>
          </div>

          <button
            onClick={onClearFilters}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-slate-800 font-semibold transition-all text-[11px] shadow-xs cursor-pointer shrink-0"
          >
            Clear Filter (Show All {totalUnfiltered})
          </button>
        </div>
      )}
    </div>
  );
};
