import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Sparkles,
  LayoutGrid,
  ArchiveRestore,
  RotateCcw,
} from 'lucide-react';
import {
  JobApplication,
  JobStatus,
  WorkplaceType,
  ViewMode,
  FollowUpReminder,
} from './types';
import { Navbar } from './components/Navbar';
import { MetricsBar } from './components/MetricsBar';
import { ApplicationsTrendChart } from './components/ApplicationsTrendChart';
import { FilterToolbar, SortOption } from './components/FilterToolbar';
import { RemindersBanner } from './components/RemindersBanner';
import { JobCard } from './components/JobCard';
import { KanbanBoard } from './components/KanbanBoard';
import { JobTableView } from './components/JobTableView';
import { RemindersView } from './components/RemindersView';
import { JobModal } from './components/JobModal';
import { AddReminderModal } from './components/AddReminderModal';
import { EmailTemplateModal } from './components/EmailTemplateModal';
import { InterviewPrepModal } from './components/InterviewPrepModal';
import { ResumeHubModal } from './components/ResumeHubModal';
import { ResumeTailorModal } from './components/ResumeTailorModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { DataRecoveryModal } from './components/DataRecoveryModal';
import {
  getRelativeDayDifference,
  addDays,
  getTodayString,
} from './utils/dateUtils';
import { exportJobsToExcel } from './utils/excelExport';
import {
  saveSnapshot,
  recordDeletedJob,
  mergeJobDatasets,
  isSampleDataDismissed,
  setSampleDataDismissed,
  purgeSampleSnapshots,
} from './utils/recoveryUtils';
import { INITIAL_JOBS, isSampleJob } from './data/mockData';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  subscribeToUserJobs,
  saveJobToCloud,
  deleteJobFromCloud,
  syncLocalJobsToCloud,
} from './lib/firestoreSync';

const getStorageKey = (userId?: string | null) =>
  userId ? `job_tracker_applications_${userId}` : 'job_tracker_applications_guest';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);

  // Initialize jobs state from user-scoped localStorage or mock data
  const [jobs, setJobs] = useState<JobApplication[]>(() => {
    try {
      const uid = auth.currentUser?.uid;
      const dismissed = isSampleDataDismissed(uid);
      const key = getStorageKey(uid);
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = dismissed ? parsed.filter((j: JobApplication) => !isSampleJob(j)) : parsed;
          return filtered.map((j: JobApplication) =>
            j.status === 'Rejected' && j.reminders && j.reminders.length > 0
              ? { ...j, reminders: [] }
              : j
          );
        }
      }
      // If sample data has been explicitly removed, start with an empty clean slate
      if (dismissed) {
        return [];
      }
    } catch (e) {
      console.error('Failed to load jobs from localStorage', e);
    }
    return INITIAL_JOBS.map((j) =>
      j.status === 'Rejected' && j.reminders && j.reminders.length > 0
        ? { ...j, reminders: [] }
        : j
    );
  });

  // Track Firebase Auth state & live Firestore subscription with user privacy boundary
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      const dismissed = isSampleDataDismissed(user?.uid);
      try {
        const key = getStorageKey(user?.uid);
        const saved = localStorage.getItem(key);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const filtered = dismissed ? parsed.filter((j: JobApplication) => !isSampleJob(j)) : parsed;
            setJobs(
              filtered.map((j: JobApplication) =>
                j.status === 'Rejected' && j.reminders && j.reminders.length > 0
                  ? { ...j, reminders: [] }
                  : j
              )
            );
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load user-scoped jobs from localStorage', e);
      }

      // If user logged out or no saved data, check if sample data was dismissed
      if (dismissed) {
        setJobs([]);
      } else if (!user) {
        setJobs(
          INITIAL_JOBS.map((j) =>
            j.status === 'Rejected' && j.reminders && j.reminders.length > 0
              ? { ...j, reminders: [] }
              : j
          )
        );
      } else {
        setJobs([]);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const unsubFirestore = subscribeToUserJobs(currentUser.uid, (cloudJobs) => {
      if (cloudJobs) {
        const cleanedJobs = cloudJobs.map((j) =>
          j.status === 'Rejected' && j.reminders && j.reminders.length > 0
            ? { ...j, reminders: [] }
            : j
        );
        setJobs(cleanedJobs);
      }
    });

    return () => unsubFirestore();
  }, [currentUser]);

  // Save to user-scoped localStorage and auto-snapshot history
  useEffect(() => {
    try {
      const key = getStorageKey(currentUser?.uid);
      localStorage.setItem(key, JSON.stringify(jobs));
      if (jobs.length > 0) {
        saveSnapshot(jobs, 'Automatic state update', currentUser?.uid);
      }
    } catch (e) {
      console.error('Failed to save jobs to localStorage', e);
    }
  }, [jobs, currentUser]);

  // Cloud sync handler when user logs in - memoized to prevent re-triggering
  const handleSyncLocalData = useCallback(async (userId: string) => {
    const key = getStorageKey(userId);
    const localSaved = localStorage.getItem(key);
    let itemsToSync = jobs;
    if (localSaved) {
      try {
        const parsed = JSON.parse(localSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          itemsToSync = parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (itemsToSync && itemsToSync.length > 0) {
      await syncLocalJobsToCloud(userId, itemsToSync);
    }
  }, [jobs]);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Filter and Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');
  const [workplaceFilter, setWorkplaceFilter] = useState<WorkplaceType | 'ALL'>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<
    'ALL' | 'DUE_NOW' | 'OVERDUE' | 'UPCOMING'
  >('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('applied-desc');

  // Modals
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Partial<JobApplication> | null>(null);
  const [isResumeHubOpen, setIsResumeHubOpen] = useState(false);
  const [isDataRecoveryOpen, setIsDataRecoveryOpen] = useState(false);
  const [isTailorModalOpen, setIsTailorModalOpen] = useState(false);
  const [tailorTargetJob, setTailorTargetJob] = useState<JobApplication | null>(null);

  const [activeEmailJob, setActiveEmailJob] = useState<JobApplication | null>(null);
  const [activePrepJob, setActivePrepJob] = useState<JobApplication | null>(null);
  const [prepInitialPracticeMode, setPrepInitialPracticeMode] = useState(false);

  const [quickAddReminderJob, setQuickAddReminderJob] = useState<JobApplication | null>(
    null
  );

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    jobId?: string;
    isAll?: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenTailorForJob = (job: JobApplication) => {
    setTailorTargetJob(job);
    setIsTailorModalOpen(true);
  };

  const handleOpenGeneralTailor = () => {
    setTailorTargetJob(null);
    setIsTailorModalOpen(true);
  };

  const handleApplyTailoredResume = (
    resumeName: string,
    resumeId: string,
    metadata: any
  ) => {
    if (tailorTargetJob) {
      const updatedJob: JobApplication = {
        ...tailorTargetJob,
        resumeVersion: resumeName,
        tailoredResumeId: resumeId,
        tailoredResumeData: metadata,
        updatedAt: getTodayString(),
      };
      handleSaveJob(updatedJob);
      showToast(`Linked tailored resume "${resumeName}" to ${tailorTargetJob.company}`);
    } else {
      showToast(`Tailored resume "${resumeName}" saved to your Resume Hub`);
    }
  };

  // Urgent reminders calculation (excludes Rejected jobs)
  const urgentRemindersCount = useMemo(() => {
    let count = 0;
    jobs.forEach((j) => {
      if (j.status === 'Rejected') return;
      (j.reminders || []).forEach((r) => {
        if (!r.completed) {
          const diff = getRelativeDayDifference(r.dueDate);
          if (diff <= 0) count++;
        }
      });
    });
    return count;
  }, [jobs]);

  // Handler: Add or Update Job
  const handleSaveJob = (jobData: JobApplication) => {
    // If a status filter was active and this job has a different status, clear filter so user keeps seeing the saved job
    if (statusFilter !== 'ALL' && jobData.status !== statusFilter) {
      setStatusFilter('ALL');
    }

    // If job is marked as Rejected, remove any follow-up reminders since it is no longer an active option
    const processedJobData: JobApplication = {
      ...jobData,
      reminders: jobData.status === 'Rejected' ? [] : (jobData.reminders || []),
    };

    // If search was active and doesn't match new job, clear search so user sees it
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        processedJobData.company.toLowerCase().includes(q) ||
        processedJobData.role.toLowerCase().includes(q);
      if (!matches) {
        setSearchQuery('');
      }
    }

    setJobs((prev) => {
      const exists = prev.some((j) => j.id === processedJobData.id);
      if (exists) {
        return prev.map((j) => (j.id === processedJobData.id ? processedJobData : j));
      } else {
        return [processedJobData, ...prev];
      }
    });

    if (currentUser) {
      saveJobToCloud(currentUser.uid, processedJobData).catch((err) =>
        console.error('Failed to sync job save to cloud:', err)
      );
    }

    showToast(
      editingJob?.id
        ? processedJobData.status === 'Rejected'
          ? `Application at ${processedJobData.company} marked Rejected (Reminders removed)`
          : `Application at ${processedJobData.company} updated successfully`
        : `New application at ${processedJobData.company} tracked`
    );
  };

  // Handler: Change status
  const handleStatusChange = (jobId: string, newStatus: JobStatus) => {
    // If user has a status filter active and changes a job out of that status,
    // reset statusFilter to 'ALL' so the job never disappears unexpectedly!
    if (statusFilter !== 'ALL' && statusFilter !== newStatus) {
      setStatusFilter('ALL');
      if (newStatus === 'Rejected') {
        showToast(`Status updated to Rejected — all follow-up reminders removed`);
      } else {
        showToast(`Status updated to ${newStatus} (Filter cleared to keep job in view)`);
      }
    } else {
      if (newStatus === 'Rejected') {
        showToast(`Status updated to Rejected — all follow-up reminders removed`);
      } else {
        showToast(`Status moved to ${newStatus}`);
      }
    }

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          // When a job is updated as Rejected, remove any follow up reminders since that job is no longer an option
          const updated = {
            ...j,
            status: newStatus,
            reminders: newStatus === 'Rejected' ? [] : (j.reminders || []),
            updatedAt: getTodayString(),
          };
          if (currentUser) {
            saveJobToCloud(currentUser.uid, updated).catch((err) =>
              console.error('Failed to sync status change to cloud:', err)
            );
          }
          return updated;
        }
        return j;
      })
    );
  };

  // Handler: Toggle Reminder Done
  const handleToggleReminder = (jobId: string, reminderId: string) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        const currentReminders = j.reminders || [];
        const updated = {
          ...j,
          reminders: currentReminders.map((r) =>
            r.id === reminderId
              ? {
                  ...r,
                  completed: !r.completed,
                  completedAt: !r.completed ? getTodayString() : undefined,
                }
              : r
          ),
          updatedAt: getTodayString(),
        };
        if (currentUser) {
          saveJobToCloud(currentUser.uid, updated).catch((err) =>
            console.error('Failed to sync reminder toggle to cloud:', err)
          );
        }
        return updated;
      })
    );
  };

  // Handler: Snooze Reminder
  const handleSnoozeReminder = (jobId: string, reminderId: string, days: number) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        const currentReminders = j.reminders || [];
        const updated = {
          ...j,
          reminders: currentReminders.map((r) =>
            r.id === reminderId
              ? {
                  ...r,
                  dueDate: addDays(r.dueDate, days),
                }
              : r
          ),
          updatedAt: getTodayString(),
        };
        if (currentUser) {
          saveJobToCloud(currentUser.uid, updated).catch((err) =>
            console.error('Failed to sync snooze to cloud:', err)
          );
        }
        return updated;
      })
    );
    showToast(`Reminder postponed by ${days} days`);
  };

  // Handler: Save quick reminder
  const handleSaveQuickReminder = (jobId: string, reminder: FollowUpReminder) => {
    const targetJob = jobs.find((j) => j.id === jobId);
    if (targetJob?.status === 'Rejected') {
      showToast('Cannot add follow-up reminders to a Rejected application');
      return;
    }

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        const currentReminders = j.reminders || [];
        const updated = {
          ...j,
          reminders: [...currentReminders, reminder],
          updatedAt: getTodayString(),
        };
        if (currentUser) {
          saveJobToCloud(currentUser.uid, updated).catch((err) =>
            console.error('Failed to sync quick reminder to cloud:', err)
          );
        }
        return updated;
      })
    );
    showToast('Follow-up reminder scheduled');
  };

  // Handler: Delete single job
  const handleTriggerDeleteJob = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    setDeleteDialog({
      isOpen: true,
      jobId,
      isAll: false,
      title: `Delete ${job.company}?`,
      message: `Are you sure you want to remove the ${job.role} application at ${job.company}? You can restore it anytime from the Recovery Vault.`,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.isAll) {
      if (currentUser) {
        jobs.forEach((j) => deleteJobFromCloud(j.id).catch(console.error));
      }
      setJobs([]);
      showToast('All applications cleared (Snapshots saved in Recovery Vault)');
    } else if (deleteDialog.jobId) {
      const jobToDelete = jobs.find((j) => j.id === deleteDialog.jobId);
      if (jobToDelete) {
        recordDeletedJob(jobToDelete, currentUser?.uid);
      }
      if (currentUser) {
        deleteJobFromCloud(deleteDialog.jobId).catch(console.error);
      }
      setJobs((prev) => prev.filter((j) => j.id !== deleteDialog.jobId));
      showToast('Application deleted (Saved to Recovery Vault)');
    }
    setDeleteDialog({ isOpen: false, title: '', message: '' });
  };

  // Export Excel Spreadsheet (.xlsx)
  const handleExportExcel = () => {
    try {
      exportJobsToExcel(jobs);
      showToast(`Exported ${jobs.length} applications to Excel spreadsheet (.xlsx)`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate Excel file. Please try again.');
    }
  };

  // Export JSON Backup
  const handleExportData = () => {
    const dataStr = JSON.stringify(jobs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `job-applications-backup-${getTodayString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Job records exported successfully');
  };

  // Import JSON Backup
  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const imported = JSON.parse(text);
        if (Array.isArray(imported)) {
          const sanitized: JobApplication[] = imported.map((j: JobApplication) =>
            j.status === 'Rejected' ? { ...j, reminders: [] } : j
          );
          setJobs(sanitized);
          if (currentUser) {
            sanitized.forEach((j) =>
              saveJobToCloud(currentUser.uid, j).catch(console.error)
            );
          }
          showToast(`Imported ${sanitized.length} applications from backup`);
        } else {
          alert('Invalid backup format. Expected an array of job applications.');
        }
      } catch (err) {
        alert('Could not read the JSON file. Please check file validity.');
      }
    };
    reader.readAsText(file);
  };

  // Remove Sample Data
  const handleRemoveSampleData = () => {
    const sampleJobsToRemove = jobs.filter((j) => isSampleJob(j));
    const nonSampleJobs = jobs.filter((j) => !isSampleJob(j));

    // 1. Mark dismissed flag in localStorage for both user and guest
    setSampleDataDismissed(true, currentUser?.uid);
    setSampleDataDismissed(true, null);

    // 2. Remove sample jobs from cloud if user is authenticated
    if (currentUser && sampleJobsToRemove.length > 0) {
      sampleJobsToRemove.forEach((j) =>
        deleteJobFromCloud(j.id).catch(console.error)
      );
    }

    // 3. Update state and localStorage
    setJobs(nonSampleJobs);
    try {
      const key = getStorageKey(currentUser?.uid);
      localStorage.setItem(key, JSON.stringify(nonSampleJobs));
      localStorage.setItem(getStorageKey(null), JSON.stringify(nonSampleJobs));
    } catch (err) {
      console.error('Failed to save cleared sample data to localStorage:', err);
    }

    // 4. Purge all sample-only snapshots from the Recovery Vault so the user's real snapshots are accessible!
    const purgedUser = purgeSampleSnapshots(currentUser?.uid);
    const purgedGuest = purgeSampleSnapshots(null);
    const totalPurged = Math.max(purgedUser, purgedGuest);

    showToast(
      sampleJobsToRemove.length > 0
        ? `Removed ${sampleJobsToRemove.length} sample application${sampleJobsToRemove.length === 1 ? '' : 's'} & unclogged ${totalPurged} sample snapshot${totalPurged === 1 ? '' : 's'} from Recovery Vault`
        : `Sample data disabled & unclogged ${totalPurged} sample snapshot${totalPurged === 1 ? '' : 's'} from Recovery Vault`
    );
  };

  // Reset to Sample Jobs
  const handleResetSamples = () => {
    setSampleDataDismissed(false, currentUser?.uid);
    setSampleDataDismissed(false, null);
    const sanitized = INITIAL_JOBS.map((j) =>
      j.status === 'Rejected' ? { ...j, reminders: [] } : j
    );
    setJobs(sanitized);
    if (currentUser) {
      sanitized.forEach((j) =>
        saveJobToCloud(currentUser.uid, j).catch(console.error)
      );
    }
    showToast('Reset to realistic sample applications');
  };

  // Clear All
  const handleClearAll = () => {
    setDeleteDialog({
      isOpen: true,
      isAll: true,
      title: 'Clear All Applications?',
      message: 'This will remove all tracked job applications. A complete automatic backup snapshot is saved in your Recovery Vault so you can restore them whenever needed.',
    });
  };

  // Open Interview Prep Modal
  const handleOpenInterviewPrep = (job: JobApplication, practiceMode: boolean = false) => {
    setActivePrepJob(job);
    setPrepInitialPracticeMode(practiceMode);
  };

  // Add new with specific status (from Kanban column)
  const handleAddNewWithStatus = (initialStatus: JobStatus) => {
    setEditingJob({ status: initialStatus });
    setIsJobModalOpen(true);
  };

  // Filtered and Sorted Jobs
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        // 1. Search Query Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCompany = job.company.toLowerCase().includes(q);
          const matchRole = job.role.toLowerCase().includes(q);
          const matchLocation = job.location.toLowerCase().includes(q);
          const matchNotes = job.notes?.toLowerCase().includes(q);
          const matchContact = job.contactName?.toLowerCase().includes(q);
          if (!matchCompany && !matchRole && !matchLocation && !matchNotes && !matchContact) {
            return false;
          }
        }

        // 2. Status Filter
        if (statusFilter !== 'ALL' && job.status !== statusFilter) {
          return false;
        }

        // 3. Workplace Filter
        if (workplaceFilter !== 'ALL' && job.workplaceType !== workplaceFilter) {
          return false;
        }

        // 4. Urgency Filter
        if (urgencyFilter !== 'ALL') {
          if (job.status === 'Rejected') return false;
          const pending = (job.reminders || []).filter((r) => !r.completed);
          if (pending.length === 0) return false;

          const hasOverdue = pending.some((r) => getRelativeDayDifference(r.dueDate) < 0);
          const hasToday = pending.some((r) => getRelativeDayDifference(r.dueDate) === 0);
          const hasUpcoming = pending.some((r) => {
            const diff = getRelativeDayDifference(r.dueDate);
            return diff > 0 && diff <= 7;
          });

          if (urgencyFilter === 'DUE_NOW' && !hasOverdue && !hasToday) return false;
          if (urgencyFilter === 'OVERDUE' && !hasOverdue) return false;
          if (urgencyFilter === 'UPCOMING' && !hasUpcoming) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'applied-desc') {
          return (b.appliedDate || '').localeCompare(a.appliedDate || '');
        }
        if (sortBy === 'applied-asc') {
          return (a.appliedDate || '').localeCompare(b.appliedDate || '');
        }
        if (sortBy === 'company-asc') {
          return a.company.localeCompare(b.company);
        }
        if (sortBy === 'company-desc') {
          return b.company.localeCompare(a.company);
        }
        if (sortBy === 'reminder-soonest') {
          const aRem = a.status !== 'Rejected' ? (a.reminders || []).find((r) => !r.completed)?.dueDate || '9999' : '9999';
          const bRem = b.status !== 'Rejected' ? (b.reminders || []).find((r) => !r.completed)?.dueDate || '9999' : '9999';
          return aRem.localeCompare(bRem);
        }
        return 0;
      });
  }, [jobs, searchQuery, statusFilter, workplaceFilter, urgencyFilter, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setWorkplaceFilter('ALL');
    setUrgencyFilter('ALL');
    setSortBy('applied-desc');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddNew={() => {
          setEditingJob(null);
          setIsJobModalOpen(true);
        }}
        onOpenResumes={() => setIsResumeHubOpen(true)}
        onOpenTailor={handleOpenGeneralTailor}
        onOpenRecovery={() => setIsDataRecoveryOpen(true)}
        urgentRemindersCount={urgentRemindersCount}
        onExport={handleExportData}
        onExportExcel={handleExportExcel}
        onImport={handleImportData}
        onRemoveSampleData={handleRemoveSampleData}
        onResetSamples={handleResetSamples}
        onClearAll={handleClearAll}
        totalJobs={jobs.length}
        onSyncLocalData={handleSyncLocalData}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-5">
        {/* Urgent Follow-Up Alert Banner (if any overdue / due today) */}
        <RemindersBanner
          jobs={jobs}
          onViewReminders={() => setViewMode('reminders')}
        />

        {/* Pipeline Metrics Overview */}
        <MetricsBar
          jobs={jobs}
          selectedStatus={statusFilter}
          onSelectStatus={(st) => {
            setStatusFilter(st);
            if (viewMode === 'reminders') setViewMode('cards');
          }}
          selectedUrgency={urgencyFilter}
          onSelectUrgency={(urg) => {
            setUrgencyFilter(urg);
            if (viewMode === 'reminders') setViewMode('cards');
          }}
        />

        {/* 6-Month Applications Trend Line Chart */}
        <ApplicationsTrendChart jobs={jobs} />

        {/* Filter and Search Bar (shown for Cards, Board, Table views) */}
        {viewMode !== 'reminders' && (
          <FilterToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            workplaceFilter={workplaceFilter}
            onWorkplaceFilterChange={setWorkplaceFilter}
            urgencyFilter={urgencyFilter}
            onUrgencyFilterChange={setUrgencyFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            totalFiltered={filteredJobs.length}
            totalUnfiltered={jobs.length}
            onClearFilters={handleClearFilters}
            onOpenRecovery={() => setIsDataRecoveryOpen(true)}
          />
        )}

        {/* View Mode Switching Content */}
        {viewMode === 'cards' && (
          <div>
            {filteredJobs.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 mx-auto flex items-center justify-center">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    {jobs.length > 0
                      ? 'No applications match your active search or filters'
                      : 'No job applications recorded yet'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    {jobs.length > 0
                      ? `You have ${jobs.length} total applications stored safely. Clear the active filters or search terms to display them all.`
                      : 'You can track a new application, restore recent snapshots from the Recovery Vault, or load sample data.'}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {jobs.length > 0 ? (
                    <button
                      onClick={handleClearFilters}
                      className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Clear Filters (Show All {jobs.length} Jobs)
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingJob(null);
                          setIsJobModalOpen(true);
                        }}
                        className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        + Record New Job
                      </button>
                      <button
                        onClick={() => setIsDataRecoveryOpen(true)}
                        className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        Open Recovery Vault
                      </button>
                      <button
                        onClick={handleResetSamples}
                        className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                        Restore Sample Data
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onEdit={(j) => {
                      setEditingJob(j);
                      setIsJobModalOpen(true);
                    }}
                    onDelete={handleTriggerDeleteJob}
                    onStatusChange={handleStatusChange}
                    onToggleReminder={handleToggleReminder}
                    onSnoozeReminder={handleSnoozeReminder}
                    onOpenEmailTemplates={setActiveEmailJob}
                    onAddReminder={setQuickAddReminderJob}
                    onPracticeInterview={(j) => handleOpenInterviewPrep(j, false)}
                    onTailorResume={handleOpenTailorForJob}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'board' && (
          <KanbanBoard
            jobs={filteredJobs}
            onEdit={(j) => {
              setEditingJob(j);
              setIsJobModalOpen(true);
            }}
            onDelete={handleTriggerDeleteJob}
            onStatusChange={handleStatusChange}
            onAddNewWithStatus={handleAddNewWithStatus}
            onToggleReminder={handleToggleReminder}
            onAddReminder={(j) => setQuickAddReminderJob(j)}
            onOpenEmailTemplates={setActiveEmailJob}
            onPracticeInterview={(j) => handleOpenInterviewPrep(j, false)}
            statusFilter={statusFilter}
            onClearStatusFilter={() => setStatusFilter('ALL')}
            totalAllJobs={jobs.length}
          />
        )}

        {viewMode === 'table' && (
          <JobTableView
            jobs={filteredJobs}
            onEdit={(j) => {
              setEditingJob(j);
              setIsJobModalOpen(true);
            }}
            onDelete={handleTriggerDeleteJob}
            onStatusChange={handleStatusChange}
            onToggleReminder={handleToggleReminder}
            onAddReminder={(j) => setQuickAddReminderJob(j)}
            onOpenEmailTemplates={setActiveEmailJob}
            onPracticeInterview={(j) => handleOpenInterviewPrep(j, false)}
            onTailorResume={handleOpenTailorForJob}
          />
        )}

        {viewMode === 'reminders' && (
          <RemindersView
            jobs={jobs}
            onToggleReminder={handleToggleReminder}
            onSnoozeReminder={handleSnoozeReminder}
            onEditJob={(j) => {
              setEditingJob(j);
              setIsJobModalOpen(true);
            }}
            onOpenEmailTemplates={setActiveEmailJob}
            onAddNewReminderToJob={(j) => setQuickAddReminderJob(j)}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in border border-slate-800 dark:border-slate-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Create / Edit Job Modal */}
      <JobModal
        initialJob={editingJob}
        isOpen={isJobModalOpen}
        onClose={() => {
          setIsJobModalOpen(false);
          setEditingJob(null);
        }}
        onSave={handleSaveJob}
      />

      {/* Quick Add Reminder Modal */}
      {quickAddReminderJob && (
        <AddReminderModal
          job={quickAddReminderJob}
          isOpen={Boolean(quickAddReminderJob)}
          onClose={() => setQuickAddReminderJob(null)}
          onSave={handleSaveQuickReminder}
          onSaveReminder={handleSaveQuickReminder}
        />
      )}

      {/* Email Generator Modal */}
      {activeEmailJob && (
        <EmailTemplateModal
          job={activeEmailJob}
          allJobs={jobs}
          isOpen={Boolean(activeEmailJob)}
          onClose={() => setActiveEmailJob(null)}
          onSaveJob={handleSaveJob}
        />
      )}

      {/* Interview Prep & AI Simulator Modal */}
      {activePrepJob && (
        <InterviewPrepModal
          job={activePrepJob}
          isOpen={Boolean(activePrepJob)}
          onClose={() => setActivePrepJob(null)}
          initialPracticeMode={prepInitialPracticeMode}
        />
      )}

      {/* Resume Hub & Version Manager Modal */}
      <ResumeHubModal
        isOpen={isResumeHubOpen}
        onClose={() => setIsResumeHubOpen(false)}
        currentUser={currentUser}
      />

      {/* Data Recovery & History Vault Modal */}
      <DataRecoveryModal
        isOpen={isDataRecoveryOpen}
        onClose={() => setIsDataRecoveryOpen(false)}
        currentJobs={jobs}
        onRestoreJobs={(restored, msg) => {
          const sanitized = restored.map((j) =>
            j.status === 'Rejected' ? { ...j, reminders: [] } : j
          );
          setJobs(sanitized);
          if (currentUser) {
            sanitized.forEach((j) =>
              saveJobToCloud(currentUser.uid, j).catch(console.error)
            );
          }
          handleClearFilters();
          showToast(msg);
        }}
        currentUser={currentUser}
        onRemoveSampleData={handleRemoveSampleData}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteDialog.isOpen}
        title={deleteDialog.title}
        message={deleteDialog.message}
        onClose={() => setDeleteDialog({ isOpen: false, title: '', message: '' })}
        onConfirm={handleConfirmDelete}
      />

      {/* AI Resume Tailor Modal */}
      <ResumeTailorModal
        isOpen={isTailorModalOpen}
        onClose={() => {
          setIsTailorModalOpen(false);
          setTailorTargetJob(null);
        }}
        initialJobUrl={tailorTargetJob?.jobUrl || ''}
        initialCompany={tailorTargetJob?.company || ''}
        initialRole={tailorTargetJob?.role || ''}
        initialJobDescription={tailorTargetJob?.jobDescription || tailorTargetJob?.notes || ''}
        onApplyToJob={handleApplyTailoredResume}
      />
    </div>
  );
}
