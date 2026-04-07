export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "http://localhost:3000";

export const AUTH_STORAGE_KEY = "studyforge_auth";
export const QUIZ_STORAGE_KEY = "studyforge_quiz";
export const REPORT_STORAGE_KEY = "studyforge_report";
export const ATTEMPT_STORAGE_KEY = "studyforge_attempt";

export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  topic: string;
  _id?: string;
};

export type QuizPayload = {
  quizId: string;
  pdfName?: string;
  questions: QuizQuestion[];
  sourceUrl?: string;
};

export type TopicScore = {
  topic: string;
  score: number;
};

export type VideoRecommendation = {
  topic: string;
  title: string;
  url: string;
  thumbnail?: string;
};

export type ReportPayload = {
  _id: string;
  user: string;
  attempt: string;
  learnerType: "Fast Learner" | "Medium Learner" | "Average Learner" | "Slow Learner";
  strongTopics: string[];
  weakTopics: string[];
  topicScores: TopicScore[];
  videoRecommendations: VideoRecommendation[];
  summary: string;
  createdAt: string;
};

type AuthPayload = {
  token?: string;
};

export const getAuthToken = (): string | null => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthPayload;
    return parsed.token || null;
  } catch {
    return null;
  }
};

export const saveQuizToSession = (quiz: QuizPayload) => {
  sessionStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(quiz));
};

export const loadQuizFromSession = (): QuizPayload | null => {
  const raw = sessionStorage.getItem(QUIZ_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as QuizPayload;
  } catch {
    return null;
  }
};

export const saveReportToSession = (report: ReportPayload) => {
  sessionStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
};

export const loadReportFromSession = (): ReportPayload | null => {
  const raw = sessionStorage.getItem(REPORT_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ReportPayload;
  } catch {
    return null;
  }
};

export const saveAttemptIdToSession = (attemptId: string) => {
  sessionStorage.setItem(ATTEMPT_STORAGE_KEY, attemptId);
};

export const loadAttemptIdFromSession = (): string | null => {
  return sessionStorage.getItem(ATTEMPT_STORAGE_KEY);
};
