export type JobStatus =
  | 'Saved'
  | 'Applied'
  | 'Screening'
  | 'Interviewing'
  | 'Assessment'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn';

export type WorkplaceType = 'Remote' | 'Hybrid' | 'On-site';
export type EmploymentType = 'Full-time' | 'Contract' | 'Part-time' | 'Internship';

export type ReminderType =
  | 'application-followup'
  | 'post-interview-thank-you'
  | 'decision-check-in'
  | 'assessment-due'
  | 'offer-response'
  | 'custom';

export interface FollowUpReminder {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  type: ReminderType;
  notes?: string;
}

export interface InterviewEvent {
  id: string;
  roundName: string; // e.g. "Recruiter Screen", "Technical Round 1", "System Design"
  date: string; // YYYY-MM-DD
  time?: string; // e.g. "14:00"
  interviewer?: string;
  notes?: string;
  completed: boolean;
}

export interface TailoredResumeMetadata {
  atsMatchScore?: number;
  matchedKeywords?: string[];
  missingKeywords?: string[];
  keyImprovements?: string[];
  tailoredAt?: string;
  sourceBaseResumeId?: string;
  sourceBaseResumeName?: string;
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  location: string;
  workplaceType: WorkplaceType;
  employmentType: EmploymentType;
  salary?: string;
  salaryRange?: string; // Salary expectations or budget range (e.g. "$140,000 - $160,000")
  offerDetails?: string; // Offer package details, base, bonus, equity, or deadline
  appliedDate: string; // YYYY-MM-DD
  jobUrl?: string;
  jobDescription?: string; // Optional raw job description text
  contactName?: string;
  contactEmail?: string;
  contactRole?: string;
  notes?: string;
  resumeVersion?: string;
  tailoredResumeId?: string;
  tailoredResumeData?: TailoredResumeMetadata;
  reminders: FollowUpReminder[];
  interviews: InterviewEvent[];
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'cards' | 'board' | 'table' | 'reminders';
