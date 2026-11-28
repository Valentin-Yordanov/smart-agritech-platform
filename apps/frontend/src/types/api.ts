export type UserRole = 'USER' | 'AGRONOMIST' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  message?: string;
}

export interface RawDetection {
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  confidence: number;
  class_name?: string;
  species?: string;
  disease?: string;
  is_healthy?: boolean;
}

export type DiagnosisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Diagnosis {
  id: string;
  userId: string;
  status: DiagnosisStatus;
  imageUrl: string;
  speciesName: string | null;
  diseaseName: string | null;
  confidence: number | null;
  isHealthy: boolean | null;
  rawDetections: RawDetection[] | null;
  latitude: number | null;
  longitude: number | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatThread {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export interface ChatAttachment {
  key: string;
  name: string;
  mime: string;
  size: number;
  kind: 'image' | 'document';
  status: 'pending' | 'readable' | 'unreadable';
  summary: string;
  // Short-lived signed URL, only returned to the thread owner
  url?: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: ChatAttachment[] | null;
  createdAt: string;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  sources: string[];
}

export interface PostAuthor {
  id: string;
  fullName: string;
  role: UserRole;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: PostAuthor;
}

export interface Post {
  id: string;
  authorId: string;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: PostAuthor;
  comments?: Comment[];
  _count?: {
    comments: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}