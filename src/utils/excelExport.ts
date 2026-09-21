import * as XLSX from 'xlsx';
import { JobApplication } from '../types';

/**
 * Generates and downloads an Excel workbook (.xlsx) containing all job applications,
 * follow-up reminders, and interview schedules.
 */
export function exportJobsToExcel(jobs: JobApplication[], fileName?: string): void {
  const wb = XLSX.utils.book_new();

  // 1. Applications Sheet
  const applicationsData = jobs.map((job) => {
    const pendingReminders = job.reminders.filter((r) => !r.completed).length;
    const completedReminders = job.reminders.filter((r) => r.completed).length;

    return {
      Company: job.company,
      Role: job.role,
      Status: job.status,
      Location: job.location || 'N/A',
      'Workplace Type': job.workplaceType || 'N/A',
      'Employment Type': job.employmentType || 'N/A',
      'Salary / Compensation': job.salary || job.salaryRange || 'N/A',
      'Offer Package Details': job.offerDetails || '',
      'Date Applied': job.appliedDate || 'N/A',
      'Resume Version': job.resumeVersion || '',
      'Contact Person': job.contactName
        ? `${job.contactName}${job.contactRole ? ` (${job.contactRole})` : ''}`
        : '',
      'Contact Email': job.contactEmail || '',
      'Job Posting URL': job.jobUrl || '',
      'Pending Follow-ups': pendingReminders,
      'Completed Follow-ups': completedReminders,
      'Interview Rounds': job.interviews.length,
      Notes: job.notes || '',
      'Created Date': job.createdAt || '',
      'Last Updated': job.updatedAt || '',
    };
  });

  const wsApplications = XLSX.utils.json_to_sheet(applicationsData);

  // Set nice column widths for Applications sheet
  wsApplications['!cols'] = [
    { wch: 20 }, // Company
    { wch: 25 }, // Role
    { wch: 14 }, // Status
    { wch: 18 }, // Location
    { wch: 15 }, // Workplace Type
    { wch: 16 }, // Employment Type
    { wch: 22 }, // Salary
    { wch: 26 }, // Offer Details
    { wch: 14 }, // Date Applied
    { wch: 18 }, // Resume Version
    { wch: 24 }, // Contact Person
    { wch: 24 }, // Contact Email
    { wch: 30 }, // Job URL
    { wch: 18 }, // Pending Follow-ups
    { wch: 18 }, // Completed Follow-ups
    { wch: 16 }, // Interview Rounds
    { wch: 35 }, // Notes
    { wch: 14 }, // Created Date
    { wch: 14 }, // Last Updated
  ];

  XLSX.utils.book_append_sheet(wb, wsApplications, 'Job Applications');

  // 2. Follow-Up Reminders Sheet
  const remindersData: Record<string, any>[] = [];
  jobs.forEach((job) => {
    job.reminders.forEach((r) => {
      remindersData.push({
        Company: job.company,
        Role: job.role,
        'Reminder Title': r.title,
        'Reminder Type': r.type,
        'Due Date': r.dueDate,
        Status: r.completed ? 'Completed' : 'Pending',
        'Completed Date': r.completedAt || 'N/A',
        Notes: r.notes || '',
      });
    });
  });

  if (remindersData.length > 0) {
    const wsReminders = XLSX.utils.json_to_sheet(remindersData);
    wsReminders['!cols'] = [
      { wch: 20 }, // Company
      { wch: 24 }, // Role
      { wch: 32 }, // Reminder Title
      { wch: 22 }, // Type
      { wch: 14 }, // Due Date
      { wch: 14 }, // Status
      { wch: 16 }, // Completed Date
      { wch: 30 }, // Notes
    ];
    XLSX.utils.book_append_sheet(wb, wsReminders, 'Follow-up Reminders');
  }

  // 3. Interview Rounds & Logs Sheet
  const interviewsData: Record<string, any>[] = [];
  jobs.forEach((job) => {
    job.interviews.forEach((interview) => {
      interviewsData.push({
        Company: job.company,
        Role: job.role,
        'Interview Round': interview.roundName,
        Date: interview.date,
        Time: interview.time || 'N/A',
        Interviewer: interview.interviewer || 'N/A',
        Status: interview.completed ? 'Completed' : 'Scheduled',
        Notes: interview.notes || '',
      });
    });
  });

  if (interviewsData.length > 0) {
    const wsInterviews = XLSX.utils.json_to_sheet(interviewsData);
    wsInterviews['!cols'] = [
      { wch: 20 }, // Company
      { wch: 24 }, // Role
      { wch: 24 }, // Round Name
      { wch: 14 }, // Date
      { wch: 10 }, // Time
      { wch: 20 }, // Interviewer
      { wch: 14 }, // Status
      { wch: 35 }, // Notes
    ];
    XLSX.utils.book_append_sheet(wb, wsInterviews, 'Interview Schedule');
  }

  // Download the file
  const todayStr = new Date().toISOString().split('T')[0];
  const outputFileName = fileName || `JobTrack-Applications-${todayStr}.xlsx`;
  XLSX.writeFile(wb, outputFileName);
}
