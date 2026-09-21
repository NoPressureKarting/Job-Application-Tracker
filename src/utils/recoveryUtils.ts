import { JobApplication } from '../types';
import { isSampleJob } from '../data/mockData';

export interface DataSnapshot {
  id: string;
  timestamp: string;
  formattedDate: string;
  jobCount: number;
  companyNames: string[];
  data: JobApplication[];
  triggerReason?: string;
  userId?: string;
  isSampleOnly?: boolean;
}

const MAX_SNAPSHOTS = 25;

function getSnapshotsKey(userId?: string | null): string {
  return userId ? `job_tracker_snapshots_${userId}` : 'job_tracker_snapshots_guest';
}

function getRecycleBinKey(userId?: string | null): string {
  return userId ? `job_tracker_recycle_bin_${userId}` : 'job_tracker_recycle_bin_guest';
}

function getSampleDismissedKey(userId?: string | null): string {
  return userId ? `job_tracker_dismissed_samples_${userId}` : 'job_tracker_dismissed_samples_guest';
}

// Check if user has explicitly dismissed sample data
export function isSampleDataDismissed(userId?: string | null): boolean {
  try {
    const key = getSampleDismissedKey(userId);
    const val = localStorage.getItem(key);
    if (val === 'true') return true;
    // Also check guest key if signed in or vice versa as a safety fallback
    return localStorage.getItem('job_tracker_dismissed_samples_guest') === 'true';
  } catch {
    return false;
  }
}

// Set or clear the sample data dismissed preference
export function setSampleDataDismissed(dismissed: boolean, userId?: string | null): void {
  try {
    const userKey = getSampleDismissedKey(userId);
    if (dismissed) {
      localStorage.setItem(userKey, 'true');
      localStorage.setItem('job_tracker_dismissed_samples_guest', 'true');
    } else {
      localStorage.removeItem(userKey);
      localStorage.removeItem('job_tracker_dismissed_samples_guest');
    }
  } catch (err) {
    console.error('Failed to set sample data dismissed preference:', err);
  }
}

// Check whether all applications in a snapshot are just mock/sample data
export function isSampleOnlySnapshot(snapshot: DataSnapshot): boolean {
  if (!snapshot || !snapshot.data || snapshot.data.length === 0) return false;
  return snapshot.data.every((j) => isSampleJob(j));
}

// Save a timestamped snapshot of jobs
export function saveSnapshot(
  jobs: JobApplication[],
  triggerReason: string = 'Auto-backup',
  userId?: string | null
): void {
  if (!jobs || jobs.length === 0) return;

  const isPureSampleData = jobs.every((j) => isSampleJob(j));

  // CRITICAL: Prevent pure sample data from repeatedly taking snapshots on startup/mount
  // and clogging the recovery vault, which pushes user's real snapshots off the max list!
  if (isPureSampleData && triggerReason === 'Automatic state update') {
    return;
  }

  try {
    const storageKey = getSnapshotsKey(userId);
    const existingStr = localStorage.getItem(storageKey);
    const existing: DataSnapshot[] = existingStr ? JSON.parse(existingStr) : [];

    // Don't save identical snapshot if the latest has the exact same jobs
    if (existing.length > 0) {
      const latest = existing[0];
      if (
        latest.jobCount === jobs.length &&
        JSON.stringify(latest.data) === JSON.stringify(jobs)
      ) {
        return;
      }
    }

    const now = new Date();
    const newSnapshot: DataSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: now.toISOString(),
      formattedDate: now.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      jobCount: jobs.length,
      companyNames: jobs.slice(0, 5).map((j) => j.company || 'Untitled'),
      data: JSON.parse(JSON.stringify(jobs)),
      triggerReason,
      userId: userId || undefined,
      isSampleOnly: isPureSampleData,
    };

    const updated = [newSnapshot, ...existing].slice(0, MAX_SNAPSHOTS);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save data snapshot:', err);
  }
}

// Retrieve all saved snapshots
export function getSavedSnapshots(userId?: string | null): DataSnapshot[] {
  try {
    const storageKey = getSnapshotsKey(userId);
    const existingStr = localStorage.getItem(storageKey);
    if (!existingStr) return [];
    const snapshots: DataSnapshot[] = JSON.parse(existingStr);
    return snapshots.map((s) => ({
      ...s,
      isSampleOnly: s.isSampleOnly ?? isSampleOnlySnapshot(s),
    }));
  } catch {
    return [];
  }
}

// Delete an individual snapshot by ID
export function deleteSnapshot(snapshotId: string, userId?: string | null): void {
  try {
    const storageKey = getSnapshotsKey(userId);
    const existingStr = localStorage.getItem(storageKey);
    if (!existingStr) return;
    const existing: DataSnapshot[] = JSON.parse(existingStr);
    const updated = existing.filter((s) => s.id !== snapshotId);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete snapshot:', err);
  }
}

// Purge all snapshots that ONLY contain mock/sample applications
export function purgeSampleSnapshots(userId?: string | null): number {
  try {
    const storageKey = getSnapshotsKey(userId);
    const existingStr = localStorage.getItem(storageKey);
    if (!existingStr) return 0;
    const existing: DataSnapshot[] = JSON.parse(existingStr);
    const filtered = existing.filter((s) => !isSampleOnlySnapshot(s));
    const removedCount = existing.length - filtered.length;
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    return removedCount;
  } catch (err) {
    console.error('Failed to purge sample snapshots:', err);
    return 0;
  }
}

// Clear all snapshots completely
export function clearAllSnapshots(userId?: string | null): void {
  try {
    const storageKey = getSnapshotsKey(userId);
    localStorage.removeItem(storageKey);
  } catch (err) {
    console.error('Failed to clear snapshots:', err);
  }
}

// Push to recycle bin when a job is deleted
export function recordDeletedJob(job: JobApplication, userId?: string | null): void {
  try {
    const storageKey = getRecycleBinKey(userId);
    const existingStr = localStorage.getItem(storageKey);
    const existing: JobApplication[] = existingStr ? JSON.parse(existingStr) : [];
    // Prepend and keep max 30 deleted items
    const updated = [job, ...existing.filter((j) => j.id !== job.id)].slice(0, 30);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to record deleted job to recycle bin:', err);
  }
}

// Retrieve recycle bin
export function getRecycleBinJobs(userId?: string | null): JobApplication[] {
  try {
    const storageKey = getRecycleBinKey(userId);
    const existingStr = localStorage.getItem(storageKey);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch {
    return [];
  }
}

// Remove from recycle bin
export function removeFromRecycleBin(jobId: string, userId?: string | null): void {
  try {
    const storageKey = getRecycleBinKey(userId);
    const existingStr = localStorage.getItem(storageKey);
    if (!existingStr) return;
    const existing: JobApplication[] = JSON.parse(existingStr);
    const updated = existing.filter((j) => j.id !== jobId);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (err) {
    console.error(err);
  }
}

// Smart merger: combines two sets of job applications by ID, keeping the latest updated
export function mergeJobDatasets(
  baseJobs: JobApplication[],
  incomingJobs: JobApplication[]
): JobApplication[] {
  const map = new Map<string, JobApplication>();

  // Add all base jobs
  baseJobs.forEach((job) => {
    map.set(job.id, job);
  });

  // Merge or add incoming jobs
  incomingJobs.forEach((incoming) => {
    const existing = map.get(incoming.id);
    if (!existing) {
      map.set(incoming.id, incoming);
    } else {
      // Pick the more recently updated version
      const existingDate = existing.updatedAt || existing.createdAt || '';
      const incomingDate = incoming.updatedAt || incoming.createdAt || '';
      if (incomingDate >= existingDate) {
        map.set(incoming.id, incoming);
      }
    }
  });

  return Array.from(map.values());
}
