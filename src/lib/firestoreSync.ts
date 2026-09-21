import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { JobApplication } from '../types';

const JOBS_COLLECTION = 'jobApplications';
const RESUMES_COLLECTION = 'resumes';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Security: URL sanitizer to neutralize javascript:, data:, or malformed links
export function getSafeExternalLink(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Block script or data schemes
  if (/^(javascript:|data:|vbscript:|file:)/i.test(trimmed)) {
    return null;
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export interface CloudResume {
  id: string;
  userId: string;
  name: string;
  uploadedAt: string;
  textContent: string;
  fileSizeFormatted?: string;
  isDefault?: boolean;
  isTailored?: boolean;
  tailoredFor?: {
    company?: string;
    role?: string;
    jobUrl?: string;
    atsMatchScore?: number;
    matchedKeywords?: string[];
    missingKeywords?: string[];
    keyImprovements?: string[];
    baseResumeName?: string;
  };
}

// Subscribe to user's real-time job applications in Firestore
export function subscribeToUserJobs(
  userId: string,
  onUpdate: (jobs: JobApplication[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(
    collection(db, JOBS_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
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
          jobDescription: data.jobDescription || '',
          tailoredResumeId: data.tailoredResumeId || '',
          tailoredResumeData: data.tailoredResumeData || null,
          reminders: data.reminders || [],
          interviews: data.interviews || [],
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });
      onUpdate(items);
    },
    (err) => {
      console.error('Firestore jobs subscription error:', err);
      if (onError) onError(err);
      try {
        handleFirestoreError(err, OperationType.LIST, `${JOBS_COLLECTION}?userId=${userId}`);
      } catch (e) {
        // Logged standardized error
      }
    }
  );
}

// Save or Update single job in Firestore
export async function saveJobToCloud(userId: string, job: JobApplication): Promise<void> {
  const docRef = doc(db, JOBS_COLLECTION, job.id);
  try {
    await setDoc(
      docRef,
      {
        ...job,
        userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${JOBS_COLLECTION}/${job.id}`);
  }
}

// Delete a single job from Firestore
export async function deleteJobFromCloud(jobId: string): Promise<void> {
  const docRef = doc(db, JOBS_COLLECTION, jobId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${JOBS_COLLECTION}/${jobId}`);
  }
}

// Batch sync all local jobs to Cloud for a user
export async function syncLocalJobsToCloud(userId: string, localJobs: JobApplication[]): Promise<void> {
  if (!localJobs || localJobs.length === 0) return;
  const batch = writeBatch(db);
  localJobs.forEach((job) => {
    const docRef = doc(db, JOBS_COLLECTION, job.id);
    batch.set(
      docRef,
      {
        ...job,
        userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  });
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${JOBS_COLLECTION}/batch`);
  }
}

// Subscribe to user's saved resumes in Firestore
export function subscribeToUserResumes(
  userId: string,
  onUpdate: (resumes: CloudResume[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(
    collection(db, RESUMES_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: CloudResume[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId,
          name: data.name || 'Resume',
          uploadedAt: data.uploadedAt || '',
          textContent: data.textContent || '',
          fileSizeFormatted: data.fileSizeFormatted,
          isDefault: data.isDefault,
          isTailored: data.isTailored,
          tailoredFor: data.tailoredFor,
        });
      });
      onUpdate(items);
    },
    (err) => {
      console.error('Firestore resumes subscription error:', err);
      if (onError) onError(err);
      try {
        handleFirestoreError(err, OperationType.LIST, `${RESUMES_COLLECTION}?userId=${userId}`);
      } catch (e) {
        // Logged standardized error
      }
    }
  );
}

// Save or Update a resume in Firestore
export async function saveResumeToCloud(userId: string, resume: Omit<CloudResume, 'userId'>): Promise<void> {
  const docRef = doc(db, RESUMES_COLLECTION, resume.id);
  try {
    await setDoc(
      docRef,
      {
        ...resume,
        userId,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${RESUMES_COLLECTION}/${resume.id}`);
  }
}

// Delete resume from Firestore
export async function deleteResumeFromCloud(resumeId: string): Promise<void> {
  const docRef = doc(db, RESUMES_COLLECTION, resumeId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${RESUMES_COLLECTION}/${resumeId}`);
  }
}
