import React, { useState, useEffect } from 'react';
import {
  History,
  RotateCcw,
  Trash2,
  CloudDownload,
  Check,
  AlertCircle,
  X,
  Layers,
  Sparkles,
  ArchiveRestore,
  Calendar,
  Building2,
  Eraser,
} from 'lucide-react';
import { JobApplication } from '../types';
import {
  DataSnapshot,
  getSavedSnapshots,
  getRecycleBinJobs,
  removeFromRecycleBin,
  mergeJobDatasets,
  deleteSnapshot,
  purgeSampleSnapshots,
} from '../utils/recoveryUtils';
import { INITIAL_JOBS } from '../data/mockData';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface DataRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentJobs: JobApplication[];
  onRestoreJobs: (jobs: JobApplication[], message: string) => void;
  currentUser: User | null;
  onRemoveSampleData?: () => void;
}

export const DataRecoveryModal: React.FC<DataRecoveryModalProps> = ({
  isOpen,
  onClose,
  currentJobs,
  onRestoreJobs,
  currentUser,
  onRemoveSampleData,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'snapshots' | 'recycle' | 'cloud'>('snapshots');
  const [snapshots, setSnapshots] = useState<DataSnapshot[]>([]);
  const [recycleBin, setRecycleBin] = useState<JobApplication[]>([]);
  const [isFetchingCloud, setIsFetchingCloud] = useState(false);
  const [cloudJobsCount, setCloudJobsCount] = useState<number | null>(null);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [purgeFeedback, setPurgeFeedback] = useState<string | null>(null);

  useEffect(() => {
    setSnapshots(getSavedSnapshots(currentUser?.uid));
    setRecycleBin(getRecycleBinJobs(currentUser?.uid));
  }, [isOpen, currentUser]);

  const handleDeleteSnapshot = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    deleteSnapshot(id, currentUser?.uid);
    setSnapshots(getSavedSnapshots(currentUser?.uid));
  };

  const handlePurgeSampleSnapshots = () => {
    const count = purgeSampleSnapshots(currentUser?.uid);
    setSnapshots(getSavedSnapshots(currentUser?.uid));
    setPurgeFeedback(`Purged ${count} sample snapshot${count === 1 ? '' : 's'} from vault`);
    setTimeout(() => setPurgeFeedback(null), 3500);
  };

  const sampleSnapshotsCount = snapshots.filter((s) => s.isSampleOnly).length;

  const handleRestoreSnapshot = (snapshot: DataSnapshot, merge: boolean = false) => {
    if (merge) {
      const merged = mergeJobDatasets(currentJobs, snapshot.data);
      onRestoreJobs(merged, `Merged ${snapshot.data.length} records from ${snapshot.formattedDate}`);
    } else {
      onRestoreJobs(snapshot.data, `Restored ${snapshot.data.length} applications from ${snapshot.formattedDate}`);
    }
    onClose();
  };

  const handleRestoreFromRecycleBin = (job: JobApplication) => {
    const updated = [job, ...currentJobs.filter((j) => j.id !== job.id)];
    removeFromRecycleBin(job.id, currentUser?.uid);
    setRecycleBin(getRecycleBinJobs(currentUser?.uid));
    onRestoreJobs(updated, `Restored "${job.company} - ${job.role}" back to your tracker`);
  };

  const handleFetchCloudJobs = async () => {
    if (!currentUser) {
      setCloudError('Please sign in with Google in the top bar to fetch from Cloud.');
      return;
    }

    setIsFetchingCloud(true);
    setCloudError(null);
    try {
      const q = query(
        collection(db, 'jobApplications'),
        where('userId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const items: JobApplication[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          company: data.company || '',
          role: data.role || '',
          status: data.status || 'Applied',
          location: data.location || '',
          workplaceType: data.workplaceType || 'Remote',
          employmentType: data.employmentType || 'Full-time',
          salary: data.salary || '',
          salaryRange: data.salaryRange || '',
          offerDetails: data.offerDetails || '',
          appliedDate: data.appliedDate || '',
          jobUrl: data.jobUrl || '',
          contactName: data.contactName || '',
          contactEmail: data.contactEmail || '',
          contactRole: data.contactRole || '',
          notes: data.notes || '',
          resumeVersion: data.resumeVersion || '',
          reminders: data.reminders || [],
          interviews: data.interviews || [],
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });

      setCloudJobsCount(items.length);
      if (items.length > 0) {
        const merged = mergeJobDatasets(currentJobs, items);
        onRestoreJobs(merged, `Successfully recovered and merged ${items.length} records from Cloud Firestore`);
        onClose();
      } else {
        setCloudError('No applications were found under your cloud account yet.');
      }
    } catch (err: any) {
      console.error('Cloud fetch error:', err);
      setCloudError(err.message || 'Failed to fetch from Firestore cloud database');
    } finally {
      setIsFetchingCloud(false);
    }
  };

  const handleRestoreSampleData = () => {
    const merged = mergeJobDatasets(currentJobs, INITIAL_JOBS);
    onRestoreJobs(merged, 'Restored sample job applications');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 animate-fade-in">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ArchiveRestore className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                Data Recovery & History Vault
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Recover previous snapshots, recently deleted applications, or pull records from Cloud.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 bg-slate-50/50 dark:bg-slate-900/40 gap-2">
          <button
            onClick={() => setActiveTab('snapshots')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'snapshots'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Automatic Snapshots ({snapshots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('recycle')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'recycle'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Recently Deleted ({recycleBin.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cloud')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'cloud'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CloudDownload className="w-3.5 h-3.5" />
            <span>Cloud Firestore Fetch</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Snapshots tab */}
          {activeTab === 'snapshots' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pb-1">
                <span>Timestamped Auto-backups created during usage:</span>
                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                  Current Tracker: {currentJobs.length} records
                </span>
              </div>

              {/* Purge feedback notification */}
              {purgeFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between gap-2 animate-fade-in">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{purgeFeedback}</span>
                  </div>
                </div>
              )}

              {/* Sample snapshots clutter notice & quick-purge action */}
              {sampleSnapshotsCount > 0 && (
                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                      <Eraser className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{sampleSnapshotsCount} Sample Data snapshot{sampleSnapshotsCount === 1 ? '' : 's'} clogging vault</span>
                    </div>
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                      Purging these will unclog your history and restore quick visibility of your real applications.
                    </p>
                  </div>
                  <button
                    onClick={handlePurgeSampleSnapshots}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shrink-0 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    title="Remove snapshots containing only sample mock applications"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Purge Sample Snapshots</span>
                  </button>
                </div>
              )}

              {snapshots.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <History className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No snapshots recorded yet
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Snapshots are automatically taken every time you make changes to your applications.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                        snap.isSampleOnly
                          ? 'bg-amber-50/30 dark:bg-amber-950/15 border-amber-200/80 dark:border-amber-800/40 hover:border-amber-300'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-750 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {snap.formattedDate}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800">
                            {snap.jobCount} {snap.jobCount === 1 ? 'application' : 'applications'}
                          </span>
                          {snap.isSampleOnly ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium">
                              Sample Data
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-medium">
                              Your Workspace
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                          Includes: {snap.companyNames.join(', ')}
                          {snap.jobCount > snap.companyNames.length ? '...' : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => handleRestoreSnapshot(snap, true)}
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-650 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                          title="Combine these records with whatever is currently in your tracker"
                        >
                          Merge In
                        </button>
                        <button
                          onClick={() => handleRestoreSnapshot(snap, false)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          title="Replace entire tracker with this snapshot"
                        >
                          Restore
                        </button>
                        <button
                          onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete snapshot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sample data actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {onRemoveSampleData && (
                    <button
                      onClick={() => {
                        onRemoveSampleData();
                        setSnapshots(getSavedSnapshots(currentUser?.uid));
                      }}
                      className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                      title="Remove sample applications from workspace & purge sample snapshots"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      Remove Sample Data
                    </button>
                  )}
                </div>
                <button
                  onClick={handleRestoreSampleData}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore Sample Applications
                </button>
              </div>
            </div>
          )}

          {/* Recycle bin tab */}
          {activeTab === 'recycle' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Recently deleted applications can be restored back to your pipeline at any time:
              </p>

              {recycleBin.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <Trash2 className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Recycle bin is empty
                  </p>
                  <p className="text-xs text-slate-500">
                    When you delete individual applications, a copy is kept here in case you need to undo.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recycleBin.map((job) => (
                    <div
                      key={job.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {job.company} <span className="font-normal text-slate-500">• {job.role}</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Status was: {job.status} • {job.location || 'Remote'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRestoreFromRecycleBin(job)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs shrink-0"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore Job
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cloud fetch tab */}
          {activeTab === 'cloud' && (
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CloudDownload className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Query Firebase Cloud Database
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    If you were using another device or publishing URL and signed in with your Google Account ({currentUser?.email || 'Not signed in'}), this will pull all applications stored in your Firestore cloud database and merge them seamlessly into your workspace.
                  </p>
                </div>
              </div>

              {cloudError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cloudError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleFetchCloudJobs}
                  disabled={isFetchingCloud || !currentUser}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-all ${
                    isFetchingCloud || !currentUser
                      ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'
                  }`}
                >
                  <CloudDownload className="w-4 h-4" />
                  <span>{isFetchingCloud ? 'Querying Firestore...' : 'Pull & Merge Cloud Records'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
