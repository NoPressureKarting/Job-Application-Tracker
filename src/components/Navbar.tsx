import React, { useState, useRef } from 'react';
import {
  LayoutGrid,
  Kanban,
  Table,
  CalendarClock,
  Plus,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Settings,
  Sun,
  Moon,
  FileSpreadsheet,
  FileText,
  ArchiveRestore,
  History,
  Sparkles,
  Eraser,
} from 'lucide-react';
import { ViewMode } from '../types';
import { useTheme } from '../context/ThemeContext';
import { AuthStatusBadge } from './AuthStatusBadge';
import { AppLogo } from './AppLogo';

interface NavbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onAddNew: () => void;
  onOpenResumes?: () => void;
  onOpenTailor?: () => void;
  onOpenRecovery?: () => void;
  urgentRemindersCount: number;
  onExport: () => void;
  onExportExcel?: () => void;
  onImport: (file: File) => void;
  onRemoveSampleData: () => void;
  onResetSamples: () => void;
  onClearAll: () => void;
  totalJobs: number;
  onSyncLocalData?: (userId: string) => Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  onViewModeChange,
  onAddNew,
  onOpenResumes,
  onOpenTailor,
  onOpenRecovery,
  urgentRemindersCount,
  onExport,
  onExportExcel,
  onImport,
  onRemoveSampleData,
  onResetSamples,
  onClearAll,
  totalJobs,
  onSyncLocalData,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 min-w-max">
            <AppLogo className="w-10 h-10 rounded-xl shadow-lg shadow-indigo-500/25 hover:scale-105 transition-transform duration-200 cursor-pointer" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                  JobTrack
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-800">
                  {totalJobs} {totalJobs === 1 ? 'job' : 'jobs'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Application Pipeline & Follow-Up Manager
              </p>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="hidden md:flex items-center p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              id="view-cards-btn"
              onClick={() => onViewModeChange('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards
            </button>
            <button
              id="view-board-btn"
              onClick={() => onViewModeChange('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Pipeline Board
            </button>
            <button
              id="view-table-btn"
              onClick={() => onViewModeChange('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Table
            </button>
            <button
              id="view-reminders-btn"
              onClick={() => onViewModeChange('reminders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap relative ${
                viewMode === 'reminders'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              Reminders
              {urgentRemindersCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 animate-pulse ml-0.5" />
              )}
            </button>
          </div>

          {/* Right Action Icons & Primary CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* AI Resume Tailor Button */}
            {onOpenTailor && (
              <button
                id="navbar-tailor-resume-btn"
                onClick={onOpenTailor}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white hover:border-indigo-400 transition-all shadow-xs cursor-pointer"
                title="Tailor your base resume specifically for a job link using AI"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                <span>Tailor Resume</span>
              </button>
            )}

            {/* Resume Hub Button */}
            {onOpenResumes && (
              <button
                id="navbar-resume-hub-btn"
                onClick={onOpenResumes}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-colors shadow-xs"
                title="Manage Resumes & CV Versions"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Resumes</span>
              </button>
            )}

            {/* Data Recovery & History Vault Button */}
            {onOpenRecovery && (
              <button
                id="navbar-recovery-vault-btn"
                onClick={onOpenRecovery}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-colors shadow-xs"
                title="Recover previous data snapshots or recently deleted applications"
              >
                <ArchiveRestore className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Recovery Vault</span>
              </button>
            )}

            {/* Cloud Sync & Auth Badge */}
            <AuthStatusBadge onSyncLocalData={onSyncLocalData} />

            {/* Add Job Application Primary Button */}
            <button
              id="navbar-add-job-btn"
              onClick={onAddNew}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Record Application</span>
              <span className="sm:hidden">Add</span>
            </button>

            {/* Settings / Backup Dropdown */}
            <div className="relative">
              <button
                id="app-settings-menu-btn"
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Data & Backup Options"
              >
                <Settings className="w-4 h-4" />
              </button>

              {showSettingsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSettingsMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs animate-fade-in">
                    <div className="px-3 py-1.5 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                      Theme & Display
                    </div>
                    <button
                      id="theme-dropdown-toggle-btn"
                      onClick={() => {
                        toggleTheme();
                        setShowSettingsMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {isDark ? (
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Moon className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                        <span>Theme Mode</span>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {isDark ? 'Dark' : 'Light'}
                      </span>
                    </button>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    <div className="px-3 py-1.5 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                      Data Protection & Recovery
                    </div>
                    {onOpenTailor && (
                      <button
                        onClick={() => {
                          onOpenTailor();
                          setShowSettingsMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50 font-semibold text-left transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>AI Resume Tailor</span>
                      </button>
                    )}
                    {onOpenRecovery && (
                      <button
                        id="recovery-vault-menu-btn"
                        onClick={() => {
                          onOpenRecovery();
                          setShowSettingsMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50 font-semibold text-left transition-colors cursor-pointer"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Data Recovery & History</span>
                      </button>
                    )}
                    <button
                      id="export-data-excel-btn"
                      onClick={() => {
                        onExportExcel?.();
                        setShowSettingsMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white text-left transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Export to Excel (.xlsx)</span>
                    </button>
                    <button
                      id="export-data-json-btn"
                      onClick={() => {
                        onExport();
                        setShowSettingsMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white text-left transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>Export Data (JSON)</span>
                    </button>
                    <label
                      htmlFor="import-data-file"
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer text-left transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-400" />
                      Import Backup (JSON)
                      <input
                        id="import-data-file"
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          handleFileChange(e);
                          setShowSettingsMenu(false);
                        }}
                        className="hidden"
                      />
                    </label>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <div className="px-3 py-1 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                      Sample Data & Reset
                    </div>
                    <button
                      id="remove-sample-jobs-btn"
                      onClick={() => {
                        onRemoveSampleData();
                        setShowSettingsMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-left transition-colors cursor-pointer font-medium"
                      title="Remove sample applications, disable sample re-injection, and purge sample snapshots from Recovery Vault"
                    >
                      <div className="flex items-center gap-2">
                        <Eraser className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Remove Sample Data</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium">
                        Unclog
                      </span>
                    </button>
                    <button
                      id="reset-sample-jobs-btn"
                      onClick={() => {
                        onResetSamples();
                        setShowSettingsMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300 text-left transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      Reset to Sample Data
                    </button>
                    <button
                      id="clear-all-jobs-btn"
                      onClick={() => {
                        onClearAll();
                        setShowSettingsMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-left transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      Clear All Applications
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile View Switcher */}
        <div className="flex md:hidden items-center justify-between pb-3 pt-1 border-t border-slate-200 dark:border-slate-800 overflow-x-auto gap-1">
          <button
            onClick={() => onViewModeChange('cards')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              viewMode === 'cards'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Cards
          </button>
          <button
            onClick={() => onViewModeChange('board')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              viewMode === 'board'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            Board
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              viewMode === 'table'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Table
          </button>
          <button
            onClick={() => onViewModeChange('reminders')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap relative transition-colors ${
              viewMode === 'reminders'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            Reminders
            {urgentRemindersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 animate-pulse ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
