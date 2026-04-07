import axios, { AxiosError } from "axios";

const rawBase =
  ((import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
    "http://localhost:3000");

const normalizedBase = rawBase.replace(/\/+$/, "");
const BASE = normalizedBase.endsWith("/api") ? normalizedBase : `${normalizedBase}/api`;

const authHeader = (): Record<string, string> => {
  const directToken = localStorage.getItem("token");

  if (directToken) {
    return { Authorization: `Bearer ${directToken}` };
  }

  const authRaw = localStorage.getItem("studyforge_auth");
  if (authRaw) {
    try {
      const parsed = JSON.parse(authRaw) as { token?: string };
      if (parsed.token) {
        return { Authorization: `Bearer ${parsed.token}` };
      }
    } catch {
      // ignore malformed stored auth
    }
  }

  return {};
};

const apiError = (error: unknown): Error => {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    return new Error(message || "Request failed. Please try again.");
  }

  return error instanceof Error ? error : new Error("Unexpected error occurred");
};

export interface TopicProfile {
  topic: string;
  failurePattern:
    | "ILLUSION_OF_KNOWING"
    | "INTERFERENCE"
    | "ENCODING_FAILURE"
    | "RETRIEVAL_FAILURE"
    | "TRANSFER_FAILURE"
    | "COGNITIVE_OVERLOAD"
    | "STRONG";
  confidence: number;
  reason: string;
  intervention: string;
  estimatedFixTime: string;
  detectedAt: string;
  resolved: boolean;
}

export interface CognitiveProfile {
  topicProfiles: TopicProfile[];
  dominantPattern: string;
  lastUpdated: string;
}

export interface StudyDay {
  day: number;
  date: string;
  type: "study" | "review" | "rest";
  topic: string;
  tasks: string[];
  goal: string;
  estimatedHours: number;
  completed: boolean;
}

export interface StudyPlan {
  _id: string;
  examDate: string;
  days: StudyDay[];
  totalDays: number;
  generatedVia: string;
}

export interface Intervention {
  title: string;
  instructions: string;
  exercise: string;
  successCriteria: string;
  followUpIn: string;
}

export interface ReportLite {
  _id: string;
  createdAt: string;
}

export const getCognitiveProfile = async (): Promise<{ profile: CognitiveProfile | null; message?: string }> => {
  try {
    const { data } = await axios.get<{ profile: CognitiveProfile | null; message?: string }>(`${BASE}/cognitive/profile`, {
      headers: authHeader(),
    });
    return data;
  } catch (error) {
    throw apiError(error);
  }
};

export const getIntervention = async (topic: string): Promise<{ intervention: Intervention }> => {
  try {
    const { data } = await axios.get<{ intervention: Intervention }>(
      `${BASE}/cognitive/intervention/${encodeURIComponent(topic)}`,
      {
        headers: authHeader(),
      },
    );
    return data;
  } catch (error) {
    throw apiError(error);
  }
};

export const generateStudyPlan = async (reportId: string, examDate: string): Promise<{ plan: StudyPlan }> => {
  try {
    const { data } = await axios.post<{ plan: StudyPlan }>(
      `${BASE}/studyplan/generate`,
      { reportId, examDate },
      { headers: authHeader() },
    );
    return data;
  } catch (error) {
    throw apiError(error);
  }
};

export const getMyStudyPlan = async (): Promise<{ plan: StudyPlan | null }> => {
  try {
    const { data } = await axios.get<{ plan: StudyPlan | null }>(`${BASE}/studyplan/my`, {
      headers: authHeader(),
    });
    return data;
  } catch (error) {
    throw apiError(error);
  }
};

export const completeDay = async (
  planId: string,
  dayNumber: number,
): Promise<{ plan: StudyPlan; message: string }> => {
  try {
    const { data } = await axios.post<{ plan: StudyPlan; message: string }>(
      `${BASE}/studyplan/complete-day`,
      { planId, dayNumber },
      { headers: authHeader() },
    );
    return data;
  } catch (error) {
    throw apiError(error);
  }
};

export const getMyReports = async (): Promise<ReportLite[]> => {
  try {
    const { data } = await axios.get<ReportLite[]>(`${BASE}/report/my`, {
      headers: authHeader(),
    });
    return data;
  } catch (error) {
    throw apiError(error);
  }
};
