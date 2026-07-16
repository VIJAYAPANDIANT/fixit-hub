export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'DEVELOPER';
}

export interface Organization {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  dsnKey: string;
  createdAt: string;
}

export type IssueStatus = 'UNRESOLVED' | 'RESOLVED' | 'IN_PROGRESS';
export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssueDifficulty = 'EASY' | 'MODERATE' | 'HARD';

export interface Issue {
  id: string;
  projectId: string;
  fingerprint: string;
  title: string;
  message: string;
  description?: string;
  stacktrace?: string;
  rootCause?: string;
  verifiedFix?: string;
  codeSnippet?: string;
  status: IssueStatus;
  severity: IssueSeverity;
  difficulty: IssueDifficulty;
  popularity: number;
  views: number;
  occurrencesCount: number;
  firstSeen: string;
  lastSeen: string;
  languageName?: string;
  languageSlug?: string;
  frameworkName?: string;
  frameworkSlug?: string;
  categoryName?: string;
  categorySlug?: string;
  tags: string[];
  assignedToUserId?: string;
  assignedToName?: string;
  aiAnalysis?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface EventLog {
  id: string;
  projectId: string;
  issueId: string;
  timestamp: string;
  environment: string;
  release: string;
  exceptionType: string;
  exceptionMessage: string;
  stacktrace: string;
  breadcrumbs: string;
  tags: Record<string, string>;
  userContext: string;
}

export interface AIAnalysis {
  title: string;
  explanation: string;
  rootCause: string;
  fixSteps: string;
  improvedCode?: string;
  bestPractices: string;
  confidenceScore: number;
}

export interface ScrapedFix {
  id: string;
  sourceName: string;
  sourceUrl: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface DashboardStats {
  totalErrors: number;
  resolvedErrors: number;
  unresolvedErrors: number;
  criticalErrorsCount: number;
  totalEventsProcessed: number;
  activeProjectsCount: number;
}
