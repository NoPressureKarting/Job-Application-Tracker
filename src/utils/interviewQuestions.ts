import { JobApplication } from '../types';

export type QuestionCategory =
  | 'role-technical'
  | 'system-design'
  | 'behavioral-star'
  | 'company-culture'
  | 'questions-to-ask';

export interface InterviewQuestion {
  id: string;
  category: QuestionCategory;
  categoryLabel: string;
  question: string;
  difficulty: 'Standard' | 'Advanced' | 'Behavioral';
  contextTip?: string;
  keyPoints: string[];
  suggestedFramework?: string;
  sampleAnswerSummary?: string;
}

// Role-specific technical & conceptual question banks
const FRONTEND_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'fe-1',
    category: 'role-technical',
    categoryLabel: 'Technical & UI',
    question: 'How do you optimize rendering performance in a modern React application?',
    difficulty: 'Standard',
    contextTip: 'Focus on profiling, memoization, and avoiding unnecessary re-renders.',
    keyPoints: [
      'Use React DevTools Profiler to identify component render bottlenecks.',
      'Apply React.memo, useMemo, and useCallback intentionally, not prematurely.',
      'Code-split heavy bundles with React.lazy and dynamic imports.',
      'Optimize asset delivery (WebP images, SVG icons, font subsets).',
      'Virtualize large lists (e.g. TanStack Virtual) instead of rendering thousands of DOM nodes.',
    ],
    sampleAnswerSummary:
      'I start by profiling bottlenecks using Chrome DevTools and React Profiler rather than guessing. I then address state locality to prevent top-level re-renders, implement virtualization for large lists, and utilize code splitting for route/component lazy loading.',
  },
  {
    id: 'fe-2',
    category: 'role-technical',
    categoryLabel: 'Technical & UI',
    question: 'How do you manage client-side vs. server-side state in complex applications?',
    difficulty: 'Standard',
    contextTip: 'Contrast server cache tools (React Query/SWR) with client UI state (Zustand/Context).',
    keyPoints: [
      'Separate server cache (data from APIs) from client-only state (modals, active tabs, drafts).',
      'Use dedicated data-fetching tools for caching, optimistic updates, and background refetching.',
      'Keep state as local as possible; only lift state up when multiple sibling components depend on it.',
      'Structure state normalization for nested entities to prevent duplicated data.',
    ],
    sampleAnswerSummary:
      'I distinguish server state from client state. Server state is managed via query/caching libraries with stale-while-revalidate patterns, while local UI state is kept in component state or lightweight stores like Zustand.',
  },
  {
    id: 'fe-3',
    category: 'role-technical',
    categoryLabel: 'Technical & UI',
    question: 'Explain how you approach web accessibility (a11y) and keyboard navigation.',
    difficulty: 'Standard',
    contextTip: 'Mention semantic HTML, ARIA attributes, focus management, and color contrast.',
    keyPoints: [
      'Prioritize native HTML5 semantic tags (<button>, <nav>, <main>, <dialog>) over generic <div>s.',
      'Manage focus traps in modal dialogs and restore focus on dismiss.',
      'Ensure WCAG AA contrast ratio compliance (minimum 4.5:1 for body text).',
      'Support keyboard navigation (:focus-visible outlines, Tab, Enter, Space, Escape).',
      'Use automated audits (axe-core, Lighthouse) paired with manual screen reader testing.',
    ],
  },
  {
    id: 'fe-4',
    category: 'role-technical',
    categoryLabel: 'Technical & UI',
    question: 'How do you structure a scalable Design System and maintain component consistency?',
    difficulty: 'Advanced',
    contextTip: 'Talk about design tokens, component composability, and clear prop contracts.',
    keyPoints: [
      'Establish design tokens for colors, spacing, radius, and typography.',
      'Create primitive, unstyled or composable headless components with flexible variants.',
      'Document components with interactive storyboards and accessibility guidelines.',
      'Maintain strict linting and versioning to prevent breaking consumer applications.',
    ],
  },
  {
    id: 'fe-5',
    category: 'role-technical',
    categoryLabel: 'Technical & UI',
    question: 'How do you debug tricky asynchronous bugs or race conditions in frontend code?',
    difficulty: 'Advanced',
    contextTip: 'Discuss AbortController, cleanup functions, and debounced event streams.',
    keyPoints: [
      'Utilize AbortController signals to cancel stale in-flight HTTP requests.',
      'Ensure useEffect or lifecycle hooks have proper teardown cleanup logic.',
      'Debounce or throttle rapid user inputs (search bars, resize events).',
      'Check for stale closures and ensure dependencies in hooks are accurate.',
    ],
  },
];

const BACKEND_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'be-1',
    category: 'role-technical',
    categoryLabel: 'Backend & APIs',
    question: 'How do you design an idempotent RESTful API for payment or order creation?',
    difficulty: 'Standard',
    contextTip: 'Explain idempotency keys, atomic transactions, and distributed locks.',
    keyPoints: [
      'Require client-provided idempotency keys in request headers (e.g. Idempotency-Key).',
      'Store idempotency key and initial processing status in a fast key-value cache (Redis).',
      'Execute database mutations within atomic transactions.',
      'Return cached response if a duplicate request arrives with the same key.',
    ],
  },
  {
    id: 'be-2',
    category: 'role-technical',
    categoryLabel: 'Backend & APIs',
    question: 'How do you identify and resolve slow database queries in production?',
    difficulty: 'Standard',
    contextTip: 'Mention EXPLAIN ANALYZE, indexing strategies, and connection pooling.',
    keyPoints: [
      'Inspect query execution plans with EXPLAIN / EXPLAIN ANALYZE.',
      'Evaluate missing composite indexes or sequential table scans.',
      'Check for N+1 query patterns caused by ORM eager/lazy loading.',
      'Implement read replicas and caching layers for heavy read-throughput endpoints.',
    ],
  },
  {
    id: 'be-3',
    category: 'role-technical',
    categoryLabel: 'Backend & APIs',
    question: 'How do you secure APIs against unauthorized access, injection, and rate abuse?',
    difficulty: 'Standard',
    contextTip: 'Cover authentication tokens, input validation schemas, and rate limiting.',
    keyPoints: [
      'Validate and sanitize all incoming payloads with schema validators (Zod, Joi).',
      'Use parameterized queries to eliminate SQL/NoSQL injection vectors.',
      'Enforce token verification (JWT/OAuth) and role-based access control (RBAC).',
      'Implement sliding window or token bucket rate limiting per IP or user ID.',
    ],
  },
  {
    id: 'be-4',
    category: 'system-design',
    categoryLabel: 'Architecture',
    question: 'When would you choose synchronous REST/gRPC vs. asynchronous message queues (RabbitMQ/Kafka)?',
    difficulty: 'Advanced',
    contextTip: 'Contrast immediate client response requirements with decoupled background jobs.',
    keyPoints: [
      'Use REST/gRPC for operations requiring immediate user feedback.',
      'Use message queues for heavy batch workloads, email notifications, and webhook distribution.',
      'Emphasize fault tolerance, retry mechanisms, and dead-letter queues (DLQs).',
      'Explain backpressure handling when consumers are overloaded.',
    ],
  },
];

const FULLSTACK_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'fs-1',
    category: 'role-technical',
    categoryLabel: 'Full Stack Flow',
    question: 'Walk through how a request flows from a button click in the UI to database persistence and back.',
    difficulty: 'Standard',
    contextTip: 'Cover user event, client validation, network transport, server handler, DB commit, and UI update.',
    keyPoints: [
      'Client initiates action with optimistic feedback or loading state.',
      'Network request sent over HTTPS with auth headers and serialized payload.',
      'Server middleware verifies authentication, rate limits, and validates schema.',
      'Business logic layer queries DB with connection pool within a transaction.',
      'Response serialized and returned with appropriate HTTP status codes.',
      'Client handles success/error state and syncs local UI cache.',
    ],
  },
  {
    id: 'fs-2',
    category: 'role-technical',
    categoryLabel: 'Full Stack Flow',
    question: 'How do you prevent CORS errors and manage session state across client and server?',
    difficulty: 'Standard',
    contextTip: 'Explain CORS preflight OPTIONS, HttpOnly Secure cookies, and SameSite policies.',
    keyPoints: [
      'Configure allowed origins, headers, and methods on the server layer.',
      'Store sensitive session tokens in HttpOnly, Secure, SameSite=Lax cookies to mitigate XSS.',
      'Use CSRF protection tokens when relying on cookie-based authentication.',
    ],
  },
  {
    id: 'fs-3',
    category: 'system-design',
    categoryLabel: 'Architecture',
    question: 'How do you handle real-time updates (e.g. notifications or live chat) between client and server?',
    difficulty: 'Advanced',
    contextTip: 'Compare WebSockets, Server-Sent Events (SSE), and Short/Long Polling.',
    keyPoints: [
      'Use WebSockets for bidirectional real-time communication (e.g., collaborative editing, chat).',
      'Use SSE (Server-Sent Events) for unidirectional live updates (e.g., dashboard stats, progress bars).',
      'Fallback to polling if firewall or proxy constraints restrict persistent socket connections.',
      'Manage reconnection logic with exponential backoff on client disconnections.',
    ],
  },
];

const PRODUCT_DESIGN_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'pd-1',
    category: 'role-technical',
    categoryLabel: 'Product & UX',
    question: 'How do you prioritize competing feature requests when engineering resources are tight?',
    difficulty: 'Standard',
    contextTip: 'Mention frameworks like RICE (Reach, Impact, Confidence, Effort) or Value vs Effort matrix.',
    keyPoints: [
      'Align priorities with primary business OKRs and user pain points.',
      'Quantify impact using data (usage metrics, support tickets, user interviews).',
      'Score items using RICE framework or Impact/Effort matrix.',
      'Communicate transparent trade-offs with stakeholders early.',
    ],
  },
  {
    id: 'pd-2',
    category: 'role-technical',
    categoryLabel: 'Product & UX',
    question: 'How do you validate a new design or feature hypothesis before building the full solution?',
    difficulty: 'Standard',
    contextTip: 'Discuss wireframing, clickable prototypes, user interviews, and A/B testing.',
    keyPoints: [
      'Create low-fidelity wireframes and interactive prototypes for rapid testing.',
      'Run moderated usability sessions with 5-8 representative target users.',
      'Ship small MVPs or feature flags to measure initial adoption.',
      'Define clear leading and lagging success metrics before launch.',
    ],
  },
];

// Core Behavioral Questions (STAR Method: Situation, Task, Action, Result)
const BEHAVIORAL_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'beh-1',
    category: 'behavioral-star',
    categoryLabel: 'Behavioral & STAR',
    question: 'Tell me about a challenging technical bug or production issue you investigated and resolved.',
    difficulty: 'Behavioral',
    suggestedFramework: 'STAR (Situation, Task, Action, Result)',
    contextTip: 'Pick a real scenario. Highlight your methodical debugging process, root-cause analysis, and post-mortem.',
    keyPoints: [
      'Situation: Brief context on what went wrong and user impact.',
      'Task: Your direct responsibility in triaging and finding the solution.',
      'Action: Systematic debugging steps (logs, reproduction, unit tests, patch).',
      'Result: Resolution, downtime prevented, and automated tests or monitoring added to prevent recurrence.',
    ],
  },
  {
    id: 'beh-2',
    category: 'behavioral-star',
    categoryLabel: 'Behavioral & STAR',
    question: 'Describe a time you had a strong disagreement with a teammate or manager about technical direction.',
    difficulty: 'Behavioral',
    suggestedFramework: 'STAR (Situation, Task, Action, Result)',
    contextTip: 'Show empathy, data-driven reasoning, active listening, and commitment to the team decision.',
    keyPoints: [
      'Focus on the technical problem, not personal differences.',
      'Gather objective data or build a quick proof-of-concept to evaluate options.',
      'Listen to the alternative viewpoint and acknowledge valid concerns.',
      'Commit fully to the agreed path even if it differed from your initial proposal.',
    ],
  },
  {
    id: 'beh-3',
    category: 'behavioral-star',
    categoryLabel: 'Behavioral & STAR',
    question: 'Tell me about a project where the requirements were ambiguous or kept shifting.',
    difficulty: 'Behavioral',
    suggestedFramework: 'STAR (Situation, Task, Action, Result)',
    contextTip: 'Highlight how you took initiative, asked clarifying questions, broke down milestones, and drove clarity.',
    keyPoints: [
      'Proactively identified ambiguities and scheduled alignment syncs.',
      'Documented core assumptions and verified them with stakeholders.',
      'Delivered iterative increments for fast feedback loops.',
      'Maintained flexibility while shielding the team from scope churn.',
    ],
  },
  {
    id: 'beh-4',
    category: 'behavioral-star',
    categoryLabel: 'Behavioral & STAR',
    question: 'Tell me about a time you made a mistake or missed a deadline. How did you handle it?',
    difficulty: 'Behavioral',
    suggestedFramework: 'STAR (Situation, Task, Action, Result)',
    contextTip: 'Demonstrate accountability, proactive communication, and continuous learning.',
    keyPoints: [
      'Owned the mistake immediately without shifting blame.',
      'Communicated early with impacted stakeholders with remediation options.',
      'Executed the recovery plan decisively.',
      'Implemented safeguards (documentation, checklist, automated tests) so it won’t happen again.',
    ],
  },
];

// Company Culture & Motivation
const CULTURE_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'cul-1',
    category: 'company-culture',
    categoryLabel: 'Culture & Motivation',
    question: 'Why do you want to join our team specifically, and what excites you about our product?',
    difficulty: 'Standard',
    contextTip: 'Reference specific features of their product, recent company milestones, and their engineering culture.',
    keyPoints: [
      'Connect your technical interests to their core mission or user experience.',
      'Mention specific public blogs, tools, or open source projects they have contributed to.',
      'Explain how this role aligns with your long-term career growth.',
    ],
  },
  {
    id: 'cul-2',
    category: 'company-culture',
    categoryLabel: 'Culture & Motivation',
    question: 'How do you stay up-to-date with emerging technologies and continuous learning?',
    difficulty: 'Standard',
    contextTip: 'Share blogs, newsletters, GitHub projects, podcasts, or hands-on side experiments.',
    keyPoints: [
      'Mention trusted industry sources (newsletters, RFCs, official release notes).',
      'Share hands-on experimentation (building prototype tools, exploring new APIs).',
      'Discuss knowledge sharing with teammates (lightning talks, code reviews).',
    ],
  },
];

// High-Value Questions to Ask the Interviewer
const QUESTIONS_TO_ASK: InterviewQuestion[] = [
  {
    id: 'ask-1',
    category: 'questions-to-ask',
    categoryLabel: 'Questions to Ask Them',
    question: 'What does a typical day or sprint cycle look like for this team?',
    difficulty: 'Standard',
    contextTip: 'Helps you understand deployment cadence, meetings vs. deep work time, and agile practices.',
    keyPoints: [
      'Shows interest in daily workflow and team dynamics.',
      'Reveals whether the team protects engineer focus time.',
    ],
  },
  {
    id: 'ask-2',
    category: 'questions-to-ask',
    categoryLabel: 'Questions to Ask Them',
    question: 'What is the biggest technical or operational challenge currently facing this team over the next 6 months?',
    difficulty: 'Standard',
    contextTip: 'Gives insight into technical debt, scaling pains, or upcoming flagship migrations.',
    keyPoints: [
      'Shows forward-thinking perspective and problem-solving mindset.',
      'Helps you gauge where you can make an immediate high-impact contribution.',
    ],
  },
  {
    id: 'ask-3',
    category: 'questions-to-ask',
    categoryLabel: 'Questions to Ask Them',
    question: 'What does success look like in the first 90 days for someone in this role?',
    difficulty: 'Standard',
    contextTip: 'Clarifies expectations and shows you are focused on delivering tangible results early.',
    keyPoints: [
      'Directly aligns your onboarding goals with leadership expectations.',
      'Helps identify onboarding support and mentorship availability.',
    ],
  },
  {
    id: 'ask-4',
    category: 'questions-to-ask',
    categoryLabel: 'Questions to Ask Them',
    question: 'How does the engineering team approach technical debt and balance it against shipping new features?',
    difficulty: 'Standard',
    contextTip: 'Reveals the health of their codebase and engineering culture sustainability.',
    keyPoints: [
      'Shows maturity and awareness of long-term software maintainability.',
      'Demonstrates respect for code quality and test automation.',
    ],
  },
];

/**
 * Returns role-tailored interview questions based on the job application's title and company.
 */
export function getInterviewQuestionsForJob(job: JobApplication): {
  roleQuestions: InterviewQuestion[];
  behavioralQuestions: InterviewQuestion[];
  cultureQuestions: InterviewQuestion[];
  questionsToAsk: InterviewQuestion[];
  allQuestions: InterviewQuestion[];
} {
  const roleLower = (job.role || '').toLowerCase();
  const notesLower = (job.notes || '').toLowerCase();
  const combinedText = `${roleLower} ${notesLower}`;

  let roleSpecific: InterviewQuestion[] = [];

  // Categorize role heuristics
  const isFrontend =
    combinedText.includes('front') ||
    combinedText.includes('ui') ||
    combinedText.includes('react') ||
    combinedText.includes('web') ||
    combinedText.includes('client') ||
    combinedText.includes('css') ||
    combinedText.includes('javascript') ||
    combinedText.includes('typescript');

  const isBackend =
    combinedText.includes('backend') ||
    combinedText.includes('back-end') ||
    combinedText.includes('api') ||
    combinedText.includes('cloud') ||
    combinedText.includes('devops') ||
    combinedText.includes('infrastructure') ||
    combinedText.includes('platform') ||
    combinedText.includes('system');

  const isProductOrDesign =
    combinedText.includes('product') ||
    combinedText.includes('design') ||
    combinedText.includes('ux') ||
    combinedText.includes('pm') ||
    combinedText.includes('manager');

  const isFullStack =
    combinedText.includes('full stack') ||
    combinedText.includes('fullstack') ||
    (isFrontend && isBackend);

  if (isFullStack) {
    roleSpecific = [...FULLSTACK_QUESTIONS, ...FRONTEND_QUESTIONS.slice(0, 2), ...BACKEND_QUESTIONS.slice(0, 2)];
  } else if (isFrontend) {
    roleSpecific = [...FRONTEND_QUESTIONS, ...FULLSTACK_QUESTIONS.slice(0, 1)];
  } else if (isBackend) {
    roleSpecific = [...BACKEND_QUESTIONS, ...FULLSTACK_QUESTIONS.slice(0, 1)];
  } else if (isProductOrDesign) {
    roleSpecific = [...PRODUCT_DESIGN_QUESTIONS, ...FRONTEND_QUESTIONS.slice(0, 2)];
  } else {
    // Default general engineering / web questions
    roleSpecific = [...FRONTEND_QUESTIONS.slice(0, 2), ...BACKEND_QUESTIONS.slice(0, 2), ...FULLSTACK_QUESTIONS.slice(0, 1)];
  }

  // Customize company question with the actual company name
  const companyName = job.company || 'the company';
  const customizedCultureQuestions = CULTURE_QUESTIONS.map((q) => {
    if (q.id === 'cul-1') {
      return {
        ...q,
        question: `Why do you want to join ${companyName} specifically, and what excites you about the ${job.role || 'team'} role?`,
      };
    }
    return q;
  });

  const all = [
    ...roleSpecific,
    ...BEHAVIORAL_QUESTIONS,
    ...customizedCultureQuestions,
    ...QUESTIONS_TO_ASK,
  ];

  return {
    roleQuestions: roleSpecific,
    behavioralQuestions: BEHAVIORAL_QUESTIONS,
    cultureQuestions: customizedCultureQuestions,
    questionsToAsk: QUESTIONS_TO_ASK,
    allQuestions: all,
  };
}
