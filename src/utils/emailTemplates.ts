import { JobApplication } from '../types';

export type JobDomain =
  | 'engineering-tech'
  | 'marketing-comms'
  | 'sales-bd'
  | 'operations-logistics'
  | 'finance-accounting'
  | 'human-resources'
  | 'healthcare-clinical'
  | 'customer-success'
  | 'product-strategy'
  | 'design-creative'
  | 'legal-compliance'
  | 'education-training'
  | 'general-professional';

export type FollowUpObjective =
  | 'role-requirements'
  | 'multi-role-company'
  | 'multi-role-transparent'
  | 'concise-direct'
  | 'post-interview-thankyou'
  | 'timeline-inquiry'
  | 'value-add-insight';

export type EmailTone =
  | 'professional-value'
  | 'warm-conversational'
  | 'concise-direct'
  | 'strategic-executive';

export interface EmailTemplate {
  id: string;
  name: string;
  category: FollowUpObjective;
  subject: string;
  body: string;
  description: string;
  domainLabel: string;
  badge?: string;
  isMultiRoleSpecific?: boolean;
}

export interface EmailGenerationOptions {
  domain?: JobDomain;
  selectedObjective?: FollowUpObjective;
  tone?: EmailTone;
  requirementsToHighlight?: string[];
  isMultiRoleAtCompany?: boolean;
  otherRolesAtCompany?: string[];
  customTalkingPoint?: string;
  candidateName?: string;
}

/**
 * Detect the professional domain/industry based on job title, notes, and description.
 * Prevents non-tech roles from being treated like software engineering jobs.
 */
export function detectJobDomain(
  roleStr: string = '',
  descriptionStr: string = '',
  notesStr: string = ''
): JobDomain {
  const combined = `${roleStr} ${descriptionStr} ${notesStr}`.toLowerCase();

  // Healthcare & Clinical
  if (
    /\b(nurse|nursing|registered nurse|rn|np|physician|doctor|clinical|medical|patient|hospital|clinic|healthcare|health|pharmacy|therapist|therapy|dental|pathology)\b/i.test(
      combined
    )
  ) {
    return 'healthcare-clinical';
  }

  // Sales & Business Development
  if (
    /\b(sales|account executive|bdr|sdr|business development|account manager|commercial|quota|territory|closing|outbound sales|client acquisition)\b/i.test(
      combined
    )
  ) {
    return 'sales-bd';
  }

  // Marketing, Communications & PR
  if (
    /\b(marketing|growth|content|copywriter|seo|sem|social media|brand|communications|public relations|pr|campaign|event marketing|lifecycle marketing)\b/i.test(
      combined
    )
  ) {
    return 'marketing-comms';
  }

  // Finance, Accounting & Economics
  if (
    /\b(finance|financial|accountant|accounting|audit|controller|tax|payroll|fp&a|treasury|banking|bookkeeper|economics|valuation)\b/i.test(
      combined
    )
  ) {
    return 'finance-accounting';
  }

  // Operations, Supply Chain & Logistics
  if (
    /\b(operations|supply chain|logistics|procurement|warehouse|inventory|fulfillment|facilities|plant manager|operational|vendor management)\b/i.test(
      combined
    )
  ) {
    return 'operations-logistics';
  }

  // Human Resources, People & Talent
  if (
    /\b(hr|human resources|people ops|talent|recruiter|recruiting|talent acquisition|people partner|onboarding|benefits specialist|employee relations)\b/i.test(
      combined
    )
  ) {
    return 'human-resources';
  }

  // Customer Success & Client Support
  if (
    /\b(customer success|csm|client success|customer support|client services|customer care|help desk|support specialist|technical support specialist)\b/i.test(
      combined
    )
  ) {
    return 'customer-success';
  }

  // Legal, Risk & Compliance
  if (
    /\b(legal|counsel|attorney|lawyer|paralegal|compliance|regulatory|contracts|contract manager|risk management|privacy officer)\b/i.test(
      combined
    )
  ) {
    return 'legal-compliance';
  }

  // Product Management & Strategy
  if (
    /\b(product manager|group product manager|principal product|product lead|product owner|technical product|strategy|program manager|business operations)\b/i.test(
      combined
    )
  ) {
    return 'product-strategy';
  }

  // Design, UX/UI & Creative
  if (
    /\b(designer|design|ui|ux|ui\/ux|graphic design|visual designer|art director|creative director|illustrator|motion design|user experience)\b/i.test(
      combined
    )
  ) {
    return 'design-creative';
  }

  // Education, Training & Non-profit
  if (
    /\b(teacher|educator|instructor|curriculum|training specialist|learning and development|l&d|tutor|faculty|professor|non-profit|community manager)\b/i.test(
      combined
    )
  ) {
    return 'education-training';
  }

  // Engineering, IT & Technology
  if (
    /\b(software|developer|engineer|frontend|front-end|backend|back-end|fullstack|full-stack|devops|sre|platform engineer|data engineer|data scientist|machine learning|ai|qa engineer|sysadmin|systems engineer|cloud architect|network engineer|mobile developer|ios|android|react|node|python|java|golang|typescript)\b/i.test(
      combined
    )
  ) {
    return 'engineering-tech';
  }

  return 'general-professional';
}

export function getDomainLabel(domain: JobDomain): string {
  switch (domain) {
    case 'engineering-tech':
      return 'Engineering & Technology';
    case 'marketing-comms':
      return 'Marketing & Communications';
    case 'sales-bd':
      return 'Sales & Business Development';
    case 'operations-logistics':
      return 'Operations & Supply Chain';
    case 'finance-accounting':
      return 'Finance & Accounting';
    case 'human-resources':
      return 'Human Resources & People';
    case 'healthcare-clinical':
      return 'Healthcare & Clinical';
    case 'customer-success':
      return 'Customer Success & Support';
    case 'product-strategy':
      return 'Product Management & Strategy';
    case 'design-creative':
      return 'Design & Creative';
    case 'legal-compliance':
      return 'Legal & Compliance';
    case 'education-training':
      return 'Education & Training';
    case 'general-professional':
    default:
      return 'Professional & Cross-Functional';
  }
}

/**
 * Domain-specific vocabulary, phrasing, and typical work artifacts.
 * Completely replaces generic "tech stack" or "portfolio links" across non-tech careers.
 */
interface DomainTerminology {
  valueProposition: string;
  supportingMaterials: string;
  impactMetrics: string;
  sampleRequirements: string[];
}

const DOMAIN_TERMS: Record<JobDomain, DomainTerminology> = {
  'marketing-comms': {
    valueProposition:
      'driving measurable multi-channel engagement, brand storytelling, and campaign ROI',
    supportingMaterials:
      'campaign performance case studies, content samples, or strategic briefs',
    impactMetrics: 'customer acquisition metrics and brand resonance',
    sampleRequirements: [
      'Multi-channel campaign strategy & execution',
      'Audience segmentation & performance tracking',
      'Cross-functional content production & brand messaging',
    ],
  },
  'sales-bd': {
    valueProposition:
      'qualifying strategic opportunities, consultative relationship building, and exceeding revenue targets',
    supportingMaterials:
      'recent quota achievement milestones, pipeline management approaches, or territory plan outlines',
    impactMetrics: 'revenue growth and client retention',
    sampleRequirements: [
      'Consultative enterprise closing & pipeline management',
      'Territory prospecting & stakeholder relationship building',
      'Consistent quota attainment & deal negotiation',
    ],
  },
  'finance-accounting': {
    valueProposition:
      'rigorous financial modeling, budget stewardship, and audit-ready fiscal reporting',
    supportingMaterials:
      'analytical frameworks, variance analysis summaries, or professional credentials',
    impactMetrics: 'forecast accuracy, cost optimization, and fiscal governance',
    sampleRequirements: [
      'Financial planning & analysis (FP&A) / Budget forecasting',
      'Variance reporting & cash flow modeling',
      'Regulatory compliance & internal audit readiness',
    ],
  },
  'operations-logistics': {
    valueProposition:
      'streamlining complex workflows, mitigating supply friction, and driving operational excellence',
    supportingMaterials:
      'process optimization case studies, vendor scorecard frameworks, or workflow audit examples',
    impactMetrics: 'operational throughput, SLA adherence, and cost reduction',
    sampleRequirements: [
      'End-to-end workflow optimization & process mapping',
      'Vendor management & supply chain reliability',
      'Cross-departmental coordination & SLA governance',
    ],
  },
  'human-resources': {
    valueProposition:
      'fostering high-performance team culture, championing employee experience, and building reliable talent pipelines',
    supportingMaterials:
      'talent onboarding frameworks, employee engagement initiatives, or people ops playbooks',
    impactMetrics: 'time-to-hire, employee retention, and organizational alignment',
    sampleRequirements: [
      'Full-lifecycle talent acquisition & candidate experience',
      'Employee engagement & performance management systems',
      'HR compliance, onboarding workflows, & workplace culture',
    ],
  },
  'healthcare-clinical': {
    valueProposition:
      'delivering compassionate, evidence-based patient care while upholding stringent clinical safety standards',
    supportingMaterials:
      'verified clinical certifications, licensure documentation, or professional references',
    impactMetrics: 'patient safety outcomes, clinical protocol adherence, and care coordination',
    sampleRequirements: [
      'Patient assessment, triage, & individualized care planning',
      'Interdisciplinary collaboration & clinical protocol adherence',
      'EHR/EMR documentation & healthcare compliance standards',
    ],
  },
  'customer-success': {
    valueProposition:
      'proactively driving client adoption, safeguarding renewals, and elevating customer lifetime value',
    supportingMaterials:
      'customer onboarding roadmaps, retention playbooks, or client health score frameworks',
    impactMetrics: 'net retention, customer satisfaction (CSAT), and time-to-value',
    sampleRequirements: [
      'Proactive account health monitoring & renewal retention',
      'Structured client onboarding & adoption milestones',
      'Stakeholder escalation management & advocacy',
    ],
  },
  'product-strategy': {
    valueProposition:
      'synthesizing user insights into actionable roadmaps, aligning cross-functional teams, and delivering measurable product outcomes',
    supportingMaterials:
      'product case studies, roadmap prioritization methodologies, or user journey analyses',
    impactMetrics: 'feature adoption, customer retention, and strategic KPI delivery',
    sampleRequirements: [
      'User research synthesis & product roadmap prioritization',
      'Cross-functional execution across engineering, design, & business',
      'Data-driven feature scoping & KPI performance tracking',
    ],
  },
  'design-creative': {
    valueProposition:
      'crafting intuitive user experiences, elevating visual craft, and designing cohesive, accessible design systems',
    supportingMaterials:
      'case studies, design systems walkthroughs, or interactive prototype demonstrations',
    impactMetrics: 'task completion rates, user delight, and design-system consistency',
    sampleRequirements: [
      'End-to-end UX research & responsive UI craftsmanship',
      'Design token systems & scalable component libraries',
      'Interactive prototyping & usability testing validation',
    ],
  },
  'legal-compliance': {
    valueProposition:
      'meticulous contract analysis, regulatory risk mitigation, and protecting organizational interests with sound judgment',
    supportingMaterials:
      'legal research briefs, contract review frameworks, or professional credentials',
    impactMetrics: 'risk reduction, contract turnaround speed, and regulatory compliance',
    sampleRequirements: [
      'Commercial contract review, drafting, & risk negotiation',
      'Regulatory compliance oversight & policy formulation',
      'Due diligence investigations & dispute resolution support',
    ],
  },
  'education-training': {
    valueProposition:
      'designing engaging learning experiences, facilitating skill mastery, and measuring instructional outcomes',
    supportingMaterials:
      'curriculum unit plans, instructional modules, or learner feedback evaluations',
    impactMetrics: 'learner engagement, curriculum comprehension, and skill adoption',
    sampleRequirements: [
      'Instructional curriculum design & interactive delivery',
      'Learner assessment & measurable outcome tracking',
      'Inclusive classroom / workshop facilitation & stakeholder communication',
    ],
  },
  'engineering-tech': {
    valueProposition:
      'building scalable systems, writing maintainable code, and partnering with product teams to ship reliable software',
    supportingMaterials:
      'architecture diagrams, code samples, open-source repositories, or technical project overviews',
    impactMetrics: 'system reliability, delivery velocity, and clean execution',
    sampleRequirements: [
      'Scalable architecture & clean, testable code implementation',
      'System performance profiling & API design',
      'Collaborative CI/CD delivery & agile sprint execution',
    ],
  },
  'general-professional': {
    valueProposition:
      'driving operational rigor, managing stakeholder expectations, and delivering high-impact business outcomes',
    supportingMaterials:
      'project deliverables, work samples, executive summaries, or professional references',
    impactMetrics: 'milestone completion, stakeholder satisfaction, and process efficiency',
    sampleRequirements: [
      'Cross-functional project execution & stakeholder alignment',
      'Strategic problem-solving & operational delivery',
      'Clear executive communication & milestone ownership',
    ],
  },
};

/**
 * Extract suggested key requirements to highlight from the job object.
 * Checks matched keywords from resume tailor data, job description text, or falls back to domain standards.
 */
export function extractSuggestedRequirements(
  job: JobApplication,
  domainOverride?: JobDomain
): string[] {
  const domain = domainOverride || detectJobDomain(job.role, job.jobDescription, job.notes);
  const found: string[] = [];

  // 1. Check tailored resume matched keywords if available
  if (job.tailoredResumeData?.matchedKeywords && job.tailoredResumeData.matchedKeywords.length > 0) {
    job.tailoredResumeData.matchedKeywords.slice(0, 5).forEach((kw) => {
      const trimmed = kw.trim();
      if (trimmed && !found.includes(trimmed)) found.push(trimmed);
    });
  }

  // 2. Parse bullet-like points from jobDescription if present
  if (job.jobDescription && found.length < 3) {
    const lines = job.jobDescription.split('\n');
    for (const line of lines) {
      const clean = line.replace(/^[\s*•\-–—\d.)]+/, '').trim();
      if (
        clean.length > 15 &&
        clean.length < 80 &&
        !clean.toLowerCase().includes('equal opportunity') &&
        !clean.toLowerCase().includes('benefits') &&
        !clean.toLowerCase().includes('salary')
      ) {
        if (!found.includes(clean)) {
          found.push(clean);
          if (found.length >= 4) break;
        }
      }
    }
  }

  // 3. Parse notes if present
  if (job.notes && found.length < 3) {
    const notesSnippets = job.notes.split(/[.;]/);
    for (const snip of notesSnippets) {
      const clean = snip.trim();
      if (clean.length > 12 && clean.length < 60 && !found.includes(clean)) {
        found.push(clean);
        if (found.length >= 3) break;
      }
    }
  }

  // 4. If still under 3, supplement with domain-tailored requirements
  const domainDefaults = DOMAIN_TERMS[domain]?.sampleRequirements || [];
  for (const def of domainDefaults) {
    if (found.length >= 3) break;
    if (!found.includes(def)) {
      found.push(def);
    }
  }

  return found.slice(0, 5);
}

/**
 * Generate human-sounding, job-specific email templates.
 * Intentionally handles:
 *  - Non-tech domains (Sales, Healthcare, Finance, Marketing, Operations, etc.)
 *  - Specific job requirements highlighted in body
 *  - Multi-role application differentiation when applying to multiple jobs at the same company
 */
export function generateTemplatesForJob(
  job: JobApplication,
  options: EmailGenerationOptions = {}
): EmailTemplate[] {
  const company = job.company?.trim() || '[Company Name]';
  const role = job.role?.trim() || '[Position Title]';
  const contact = job.contactName?.trim() || 'Hiring Team';
  const appliedDate = job.appliedDate?.trim() || 'recently';
  const candidateName = options.candidateName || '[Your Name]';

  const domain = options.domain || detectJobDomain(job.role, job.jobDescription, job.notes);
  const domainTerms = DOMAIN_TERMS[domain] || DOMAIN_TERMS['general-professional'];
  const domainLabel = getDomainLabel(domain);

  // Determine requirements list
  const activeRequirements =
    options.requirementsToHighlight && options.requirementsToHighlight.length > 0
      ? options.requirementsToHighlight
      : extractSuggestedRequirements(job, domain);

  const req1 = activeRequirements[0] || `${role} responsibilities`;
  const req2 = activeRequirements[1] || `${company}'s current initiatives`;
  const req3 = activeRequirements[2] || 'delivering measurable value';

  const otherRolesList = options.otherRolesAtCompany || [];
  const hasMultipleRoles = Boolean(
    options.isMultiRoleAtCompany || otherRolesList.length > 0
  );
  const otherRolesFormatted =
    otherRolesList.length > 0 ? otherRolesList.join(', ') : 'other open positions';

  const templates: EmailTemplate[] = [
    // 1. Role & Requirements Focused Follow-Up
    {
      id: 'app-followup-value',
      name: 'Role & Requirements Alignment Follow-Up',
      category: 'role-requirements',
      domainLabel,
      badge: 'Job-Specific',
      description: `Tailored specifically for ${role} with focus on ${domainLabel} requirements.`,
      subject: `Following up: ${role} Application - ${candidateName}`,
      body: `Hi ${contact},

I hope you are having a wonderful week.

I recently submitted my application for the ${role} opening at ${company} (applied ${appliedDate}). Knowing how carefully you evaluate candidates for this team, I wanted to follow up directly to reiterate my strong interest in this specific position.

What particularly drew me to this role is how directly my background aligns with your core requirements:
• ${req1}: Hands-on track record of execution and tangible outcomes.
• ${req2}: Deep experience navigating the operational and strategic nuances of this work.
${activeRequirements[2] ? `• ${req3}: Demonstrated ability to collaborate cross-functionally and uphold high standards.\n` : ''}
Given ${company}'s current trajectory, I am confident I can step into the ${role} position and make an immediate, positive contribution to your team's objectives.

${domainTerms.supportingMaterials ? `Please let me know if I can provide any ${domainTerms.supportingMaterials}, references, or additional background to support your review.` : 'Please let me know if I can provide any additional materials or references to support your review.'}

Thank you for your time and consideration.

Best regards,
${candidateName}
[Your Phone Number]
[Your LinkedIn or Portfolio Link]`,
    },

    // 2. Multi-Role at Same Company: Specialized Alignment (Differentiating this specific role)
    {
      id: 'app-followup-multi-role',
      name: 'Multi-Application: Role-Specific Differentiation',
      category: 'multi-role-company',
      domainLabel,
      badge: 'Multi-Role at Company',
      isMultiRoleSpecific: true,
      description: `Specifically designed when applying to multiple jobs at ${company} to avoid looking like a copy-paste email.`,
      subject: `Application Note: ${role} Requisition - ${candidateName}`,
      body: `Hi ${contact},

I hope this note finds you well.

I recently applied for the ${role} position at ${company}. Because I hold ${company}'s organization and mission in such high regard, you may notice that I have also submitted an application for ${otherRolesFormatted}. 

I wanted to reach out specifically regarding the ${role} requisition, as this role represents my primary functional focus and passion. 

My specific qualifications for the ${role} opening are distinct:
• Targeted Expertise: I bring specialized experience in ${req1}, which directly matches this team's day-to-day demands.
• Core Competencies: My background in ${req2} prepares me to tackle the specific challenges and priorities of this position immediately.
• Team Alignment: Rather than taking a generalist approach, I am specifically excited by the scope and responsibilities outlined for this particular role.

I wanted to provide this context so your hiring team has complete clarity on my targeted interest in ${role}. ${domainTerms.supportingMaterials ? `I would be thrilled to share relevant ${domainTerms.supportingMaterials} or discuss how my background fits this opening.` : 'I would welcome the chance to discuss how my background fits this opening.'}

Thank you very much for your time and guidance.

Warm regards,
${candidateName}
[Your Phone Number]
[Your LinkedIn Profile]`,
    },

    // 3. Multi-Role at Same Company: Transparent & Collaborative Inquiry
    {
      id: 'app-followup-multi-role-transparent',
      name: 'Multi-Application: Collaborative Cross-Role Inquiry',
      category: 'multi-role-transparent',
      domainLabel,
      badge: 'Multi-Role at Company',
      isMultiRoleSpecific: true,
      description: `Polite, transparent follow-up clarifying where your skill set can best serve ${company}.`,
      subject: `Application Inquiries & Focus on ${role} - ${candidateName}`,
      body: `Hi ${contact},

I hope your week is off to a great start.

I am writing to check in on my recent application for the ${role} position at ${company}. Given my genuine enthusiasm for ${company}'s work, I have also expressed interest in ${otherRolesFormatted}.

I wanted to touch base directly with your team to clarify that my strongest alignment is with the ${role} opportunity. In evaluating the requirements for this role—specifically the need for strength in ${req1} and ${req2}—I see an ideal match with my practical background and accomplishments.

If the hiring team feels another requisition at ${company} is an even stronger fit, I remain very open to that guidance. However, I wanted to highlight my specific readiness to hit the ground running in the ${role} capacity.

Thank you again for reviewing my materials. I look forward to hearing about next steps in the process.

Best regards,
${candidateName}
[Your Phone Number]`,
    },

    // 4. Concise / Executive Direct Check-In
    {
      id: 'app-followup-concise',
      name: 'Concise / Executive Direct Check-In',
      category: 'concise-direct',
      domainLabel,
      badge: 'High Response Rate',
      description: 'Short 3-4 sentence punchy follow-up for busy recruiters and hiring managers.',
      subject: `Check-in regarding ${role} application - ${candidateName}`,
      body: `Hi ${contact},

I hope you are having a productive week.

I am writing to briefly confirm receipt of my application for the ${role} opening at ${company}, submitted on ${appliedDate}. 

With a strong track record in ${req1} and ${req2}, I am eager to contribute to ${company}'s continued success in this capacity.

Please let me know if there are any additional details or references I can share at this stage. I appreciate your time and consideration.

Best regards,
${candidateName}
[Your Phone Number]`,
    },

    // 5. Post-Interview Thank You (Grounded in Role Discussion)
    {
      id: 'post-interview-thankyou',
      name: 'Post-Interview Thank You (Role Discussion)',
      category: 'post-interview-thankyou',
      domainLabel,
      badge: 'Post-Interview',
      description: 'References specific conversation points and role objectives rather than generic tech stubs.',
      subject: `Thank you - ${role} Conversation - ${candidateName}`,
      body: `Hi ${contact},

Thank you very much for taking the time to speak with me today about the ${role} position at ${company}.

I truly enjoyed our discussion regarding the team's current focus, particularly around [insert specific project or priority discussed, e.g. ${req1}]. Our conversation reinforced my enthusiasm for the role and confirmed that my background in ${req2} would allow me to make a meaningful, immediate contribution.

${hasMultipleRoles ? `I also appreciated the opportunity to discuss how this position uniquely positions me to support ${company}'s broader goals.\n\n` : ''}Please feel free to reach out if you need any follow-up information, documentation, or references from my side. I look forward to staying in touch as you finalize decisions for next steps.

Warm regards,
${candidateName}
[Your Phone Number]
[Your LinkedIn Profile]`,
    },

    // 6. Timeline & Status Inquiry
    {
      id: 'timeline-inquiry',
      name: 'Decision Timeline & Status Inquiry',
      category: 'timeline-inquiry',
      domainLabel,
      badge: 'Timeline Check',
      description: 'Respectful, professional check-in when estimated timeline has passed.',
      subject: `Update on ${role} candidacy - ${candidateName}`,
      body: `Hi ${contact},

I hope you are having a great week.

I am following up regarding my candidacy for the ${role} position at ${company}. During our previous exchange, you mentioned the team might have an update around this timeframe, so I wanted to gently check in on how the search is progressing.

I remain very interested in the opportunity to partner with your team on ${req1} and bring my background in ${req2} to ${company}.

I understand you may still be evaluating candidates, and I truly appreciate your continued consideration.

Best regards,
${candidateName}
[Your Phone Number]`,
    },

    // 7. Value-Add / Solution Perspective
    {
      id: 'value-add-insight',
      name: 'Value-Add Insight & Industry Perspective',
      category: 'value-add-insight',
      domainLabel,
      badge: 'Stand-Out Angle',
      description: 'Follows up by offering a thoughtful perspective or work artifact relevant to the role.',
      subject: `Idea & Follow-up for ${company} ${role} - ${candidateName}`,
      body: `Hi ${contact},

I hope all is well.

Since submitting my application for the ${role} position at ${company}, I have been reflecting on your team's goals around ${req1}. 

In my previous work addressing similar challenges, I found that focusing on [insert brief 1-sentence insight or proven approach, e.g. streamlined ${req2}] delivered significant improvements in ${domainTerms.impactMetrics}. I thought this perspective might be of interest to you and the team as you plan for the coming quarter.

I would welcome the opportunity to dive deeper into these ideas during an initial conversation. Thank you again for your time and consideration of my application.

Best regards,
${candidateName}
[Your Phone Number]`,
    },
  ];

  return templates;
}
