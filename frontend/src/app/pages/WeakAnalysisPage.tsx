import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { TrendingDown, TrendingUp, Play, BookOpen, Target, Zap, BarChart3, Brain } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from "recharts";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import {
  API_BASE_URL,
  getAuthToken,
  loadAttemptIdFromSession,
  loadReportFromSession,
  saveReportToSession,
  type ReportPayload,
} from "../lib/session";

const getLearnerDescription = (learnerType: string) => {
  if (learnerType === "Fast Learner") {
    return "You grasp concepts quickly. Focus on advanced application and challenge problems.";
  }
  if (learnerType === "Medium Learner" || learnerType === "Average Learner") {
    return "You are progressing steadily. Revision and targeted practice will boost consistency.";
  }
  return "Take smaller learning steps with repeated practice and guided examples.";
};

export function WeakAnalysisPage() {
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportPayload | null>(loadReportFromSession());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      const token = getAuthToken();
      if (!token) {
        setError("Please sign in to view your weak-topic analysis.");
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await axios.get<ReportPayload[]>(`${API_BASE_URL}/api/report/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (Array.isArray(data) && data.length > 0) {
          setReport(data[0]);
          saveReportToSession(data[0]);
          setError(null);
          return;
        }

        const attemptId = loadAttemptIdFromSession();
        if (attemptId) {
          const generated = await axios.post<ReportPayload>(
            `${API_BASE_URL}/api/report/generate/${attemptId}`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          setReport(generated.data);
          saveReportToSession(generated.data);
          setError(null);
          toast.success("Weak-topic analysis generated from your latest quiz.");
          return;
        }

        setError("No quiz analysis found yet. Complete a quiz first.");
      } catch (err) {
        const message =
          err instanceof AxiosError
            ? ((err.response?.data as { message?: string } | undefined)?.message ?? "Failed to load analysis")
            : "Failed to load analysis";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, []);

  const performanceData = useMemo(() => {
    if (!report) return [];
    return report.topicScores.map((item) => ({
      topic: item.topic,
      score: item.score,
      total: 100,
    }));
  }, [report]);

  const radarData = useMemo(() => {
    if (!report) return [];
    return report.topicScores.slice(0, 6).map((item) => ({
      subject: item.topic,
      score: item.score,
    }));
  }, [report]);

  const averageScore = useMemo(() => {
    if (!performanceData.length) return 0;
    return performanceData.reduce((acc, item) => acc + item.score, 0) / performanceData.length;
  }, [performanceData]);

  const weakTopicCards = useMemo(() => {
    if (!report) return [];

    return report.weakTopics.map((topic) => {
      const topicScore = report.topicScores.find((score) => score.topic === topic)?.score ?? 0;
      const videos = report.videoRecommendations.filter((video) => video.topic === topic);
      return { topic, score: topicScore, videos };
    });
  }, [report]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="p-8 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm">
          Loading weak-topic analysis...
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="p-8 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm text-center">
          <h1 className="text-2xl font-semibold mb-3">Weak Analysis Unavailable</h1>
          <p className="text-muted-foreground mb-6">{error || "No analysis found."}</p>
          <button
            onClick={() => navigate("/quiz")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white font-semibold"
          >
            Go to Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-[#6366f1]" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent">
              Weak Topic Analysis
            </h1>
          </div>
          <p className="text-muted-foreground text-lg ml-[52px]">
            Personalized performance insights, learner classification, and video recommendations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Average Score</span>
              <Target className="w-5 h-5 text-[#6366f1]" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-[#6366f1] to-[#3b82f6] bg-clip-text text-transparent">
              {Math.round(averageScore)}%
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Learner Type</span>
              <Brain className="w-5 h-5 text-[#6366f1]" />
            </div>
            <div className="text-xl font-semibold">{report.learnerType}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Strong Topics</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-500">{report.strongTopics.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Needs Work</span>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-500">{report.weakTopics.length}</div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm mb-8"
        >
          <h3 className="text-xl font-semibold mb-2">Learner Analysis</h3>
          <p className="text-muted-foreground mb-3">{getLearnerDescription(report.learnerType)}</p>
          <p className="text-sm text-muted-foreground">{report.summary}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm"
          >
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#6366f1]" />
              </div>
              Performance by Topic
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="topic" tick={{ fill: "#71717a", fontSize: 12 }} angle={-45} textAnchor="end" height={100} />
                <YAxis tick={{ fill: "#71717a" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141419",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#e4e4e7",
                  }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {performanceData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.topic}-${index}`}
                      fill={entry.score >= 70 ? "#10b981" : entry.score >= 50 ? "#f59e0b" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm"
          >
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#6366f1]" />
              </div>
              Skills Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#71717a", fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#71717a" }} />
                <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-6"
        >
          <h3 className="text-2xl font-semibold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-[#6366f1]" />
            </div>
            Topics That Need Attention
          </h3>

          {weakTopicCards.length === 0 && (
            <div className="p-8 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm">
              Great work. No weak topics detected in this report.
            </div>
          )}

          {weakTopicCards.map((topicData, index) => (
            <motion.div
              key={topicData.topic}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="p-8 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h4 className="text-xl font-semibold mb-2">{topicData.topic}</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden max-w-xs">
                      <motion.div
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${topicData.score}%` }}
                        transition={{ duration: 1, delay: 0.9 + index * 0.1 }}
                      />
                    </div>
                    <span className="text-sm font-medium text-red-500">{topicData.score}%</span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                  Recommended Learning Videos
                </h5>
                <div className="space-y-3">
                  {(topicData.videos.length ? topicData.videos : [{
                    topic: topicData.topic,
                    title: `${topicData.topic} tutorial`,
                    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topicData.topic} tutorial`)}`,
                    thumbnail: "",
                  }]).map((video, videoIndex) => (
                    <motion.a
                      key={`${video.url}-${videoIndex}`}
                      href={video.url}
                      target="_blank"
                      rel="noreferrer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + index * 0.1 + videoIndex * 0.05 }}
                      className="w-full p-4 rounded-xl bg-background/50 border border-border/50 hover:border-[#6366f1]/50 hover:bg-accent transition-all duration-200 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <Play className="w-5 h-5 text-[#6366f1]" />
                        </div>
                        <span className="font-medium">{video.title}</span>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-8"
        >
          <button
            onClick={() => navigate("/quiz")}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white font-semibold hover:shadow-2xl hover:shadow-[#6366f1]/30 transition-all duration-300 flex items-center justify-center gap-3 text-lg"
          >
            <BookOpen className="w-6 h-6" />
            Take Another Quiz to Improve
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
