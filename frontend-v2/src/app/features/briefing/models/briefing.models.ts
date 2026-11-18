// Field names mirror the FastAPI backend (main.py) exactly.

export type BriefSubjectType = 'COMPANY' | 'PERSON';

export type BriefStatus =
  | 'QUEUED' | 'COLLECTING_SOURCES' | 'ANALYZING' | 'VERIFYING_CLAIMS' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export type SearchDepth = 'basic' | 'advanced' | 'fast' | 'ultra-fast';

export interface CreateBriefRequest {
  subjectType: BriefSubjectType;
  subjectName: string;
  meetingTime: string;
  meetingPurpose: string;
  lookbackDays: number;
  region: string;
  country: string | null;
  language: string;
  includeDomains: string[];
  excludeDomains: string[];
  searchDepth: SearchDepth;
  includeImages: boolean;
  documentIds: string[];
}

export interface CreateBriefResponse {
  briefId: string;
  status: BriefStatus;
  createdAt: string;
}

export interface BriefStatusResponse {
  briefId: string;
  status: BriefStatus;
  progressPercentage: number;
  currentStage: string;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

export interface BriefClaim {
  id: string;
  text: string;
  citationIds: string[];
}

export interface OpenQuestion {
  id: string;
  question: string;
  answer: string;
  reason: string;
  citationIds: string[];
}

export interface BriefSource {
  id: string;
  url: string;
  title: string;
  publisher: string;
  publishedAt: string | null;
  excerpt: string;
  sourceType: 'WEB' | 'DOCUMENT' | string;
  score: number | null;
  categories?: string[];
}

export interface BriefImage {
  url: string;
  title: string;
  description: string;
  sourceId: string | null;
  sourceTitle: string | null;
  sourceUrl: string | null;
}

export interface MeetingBrief {
  briefId: string;
  status: BriefStatus;
  subject: { type: BriefSubjectType; name: string };
  meetingTime: string;
  meetingPurpose: string;
  generatedAt: string;
  coverage: { from: string; to: string };
  executiveSummary: BriefClaim[];
  recentNews: BriefClaim[];
  hires: BriefClaim[];
  launches: BriefClaim[];
  businessSignals: BriefClaim[];
  openQuestions: OpenQuestion[];
  sources: BriefSource[];
  images: BriefImage[];
  research?: { searchDepth: string; model: string; agentFramework: string; embeddingModel: string };
}

export interface BriefSummary {
  briefId: string;
  subjectType: BriefSubjectType | null;
  subjectName: string;
  meetingTime: string | null;
  status: BriefStatus;
  generatedAt: string | null;
  sourceCount: number;
}

export interface UploadedDocument {
  documentId: string;
  filename: string;
  contentType: string;
  pageCount: number;
  chunkCount: number;
  createdAt: string;
}
