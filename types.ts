
export enum ReportStatus {
  DONE = 'DONE',
  PENDING = 'PENDING',
  BLOCKED = 'BLOCKED',
  IN_PROGRESS = 'IN_PROGRESS'
}

export interface BreakInterval {
  id: string;
  start: string;
  end: string;
}

export interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
  department: string;
  mbti?: string;
  email: string;
}

export interface Report {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userMbti?: string;
  timestamp: string;
  status: ReportStatus;
  content: string;
  blockers?: string;
  planForTomorrow?: string;
  breaks?: BreakInterval[];
  files?: { name: string; type: string }[];
  links?: string[];
  department: string;
  date: string;
  workHours: {
    start: string;
    end: string;
  };
  optimizedSummary?: string;
  isDraft?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
}

export type ViewType = 'SIGN_IN' | 'SIGN_UP' | 'HOME' | 'STATS' | 'CREATE' | 'EXPORT' | 'SETTINGS' | 'HISTORY' | 'TRASH';
