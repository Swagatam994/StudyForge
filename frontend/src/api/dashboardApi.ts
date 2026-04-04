import axios from "axios";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "http://localhost:3000";

interface AuthPayload {
  token?: string;
}

const getToken = (): string | null => {
  const directToken = localStorage.getItem("token");
  if (directToken) return directToken;

  const raw = localStorage.getItem("studyforge_auth");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthPayload;
    return parsed.token || null;
  } catch {
    return null;
  }
};

const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface DocumentSummary {
  quizId: string;
  pdfName: string;
  createdAt: string;
  totalQuestions: number;
  attempted: boolean;
  latestAttemptId?: string;
  latestScore?: number;
  reviewCount: number;
  masteredCount: number;
}

export interface DocumentDetail {
  quiz: { quizId: string; pdfName: string; createdAt: string; questions: any[] };
  attempts: { attemptId: string; score: number; timeTaken: number; submittedAt: string }[];
  latestReport: {
    learnerType: string;
    strongTopics: string[];
    weakTopics: string[];
    topicScores: { topic: string; score: number }[];
    videoRecommendations: { topic: string; title: string; url: string; thumbnail: string }[];
    summary: string;
  } | null;
  flashcards: { front: string; back: string; topic: string }[];
  reviews: { topic: string; status: string; nextReviewDate: string; intervalIndex: number }[];
}

export interface UserStats {
  totalDocuments: number;
  totalAttempts: number;
  averageScore: number;
  totalMastered: number;
  totalDueToday: number;
  learnerTypeBreakdown: Record<string, number>;
  recentActivity: { pdfName: string; score: number; submittedAt: string }[];
}

export const getDocuments = async (): Promise<DocumentSummary[]> => {
  const { data } = await axios.get<DocumentSummary[]>(`${API_BASE_URL}/api/dashboard/documents`, {
    headers: getAuthHeaders(),
  });
  return data;
};

export const getDocumentDetail = async (quizId: string): Promise<DocumentDetail> => {
  const { data } = await axios.get<DocumentDetail>(`${API_BASE_URL}/api/dashboard/documents/${quizId}`, {
    headers: getAuthHeaders(),
  });
  return data;
};

export const getUserStats = async (): Promise<UserStats> => {
  const { data } = await axios.get<UserStats>(`${API_BASE_URL}/api/dashboard/stats`, {
    headers: getAuthHeaders(),
  });
  return data;
};
