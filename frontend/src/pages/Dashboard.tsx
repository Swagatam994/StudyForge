import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  getDocumentDetail,
  getDocuments,
  getUserStats,
  type DocumentDetail,
  type DocumentSummary,
  type UserStats,
} from "../api/dashboardApi";

type TabKey = "analysis" | "flashcards" | "reviews" | "videos";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

const formatDateTime = (date: string) =>
  new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatTimeTaken = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const getScoreColor = (score: number) => {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
};

const getBarColor = (score: number) => {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
};

const getLearnerStyles = (learnerType: string) => {
  if (learnerType === "Fast Learner") {
    return {
      emoji: "🚀",
      wrapper: "bg-green-900/50 border-green-500 text-green-300",
    };
  }
  if (learnerType === "Slow Learner") {
    return {
      emoji: "🐢",
      wrapper: "bg-red-900/50 border-red-500 text-red-300",
    };
  }
  return {
    emoji: "📘",
    wrapper: "bg-yellow-900/50 border-yellow-500 text-yellow-300",
  };
};

export default function Dashboard() {
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("analysis");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoadingOverview(true);
        setOverviewError(null);
        const [docs, userStats] = await Promise.all([getDocuments(), getUserStats()]);
        setDocuments(docs);
        setStats(userStats);
      } catch (err) {
        setOverviewError(err instanceof Error ? err.message : "Failed to load dashboard overview");
      } finally {
        setLoadingOverview(false);
      }
    };

    loadOverview();
  }, []);

  const openDocumentDetail = async (quizId: string) => {
    try {
      setSelectedQuizId(quizId);
      setLoadingDetail(true);
      setDetailError(null);
      setDetail(null);
      setActiveTab("analysis");
      setCurrentIndex(0);
      setFlipped(false);
      const response = await getDocumentDetail(quizId);
      setDetail(response);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Failed to load document details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const goBack = () => {
    setSelectedQuizId(null);
    setDetail(null);
    setDetailError(null);
  };

  const flashcards = detail?.flashcards || [];
  const currentFlashcard = flashcards[currentIndex];

  const groupedReviews = useMemo(() => {
    const reviews = detail?.reviews || [];
    const now = new Date();
    const due = reviews.filter(
      (review) =>
        review.status === "due" ||
        (review.status !== "mastered" && review.nextReviewDate && new Date(review.nextReviewDate) <= now),
    );
    const upcoming = reviews.filter(
      (review) =>
        review.status !== "mastered" &&
        !(
          review.status === "due" ||
          (review.nextReviewDate && new Date(review.nextReviewDate) <= now)
        ),
    );
    const mastered = reviews.filter((review) => review.status === "mastered");
    return { due, upcoming, mastered };
  }, [detail]);

  if (!selectedQuizId) {
    return (
      <div className="min-h-full rounded-xl bg-[#0f172a] p-6 text-white shadow-lg">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-slate-300">Track your generated quizzes, scores, and learning progress.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/cognitive"
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 transition-all duration-200 hover:bg-slate-700 hover:text-white"
            >
              🧠 Cognitive Profile
            </Link>
            <Link
              to="/study-plan"
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 transition-all duration-200 hover:bg-slate-700 hover:text-white"
            >
              📅 Study Plan
            </Link>
          </div>
        </div>

        {loadingOverview && (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 text-slate-300">Loading dashboard...</div>
        )}

        {overviewError && (
          <div className="mb-4 rounded-xl border border-red-500 bg-red-900/30 p-4 text-red-200">{overviewError}</div>
        )}

        {stats && (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-slate-800 p-5 shadow-lg">
              <p className="text-sm text-slate-300">📄 Documents</p>
              <p className="mt-2 text-3xl font-bold">{stats.totalDocuments}</p>
            </div>
            <div className="rounded-xl bg-slate-800 p-5 shadow-lg">
              <p className="text-sm text-slate-300">🧠 Quizzes Taken</p>
              <p className="mt-2 text-3xl font-bold">{stats.totalAttempts}</p>
            </div>
            <div className="rounded-xl bg-slate-800 p-5 shadow-lg">
              <p className="text-sm text-slate-300">📊 Avg Score</p>
              <p className="mt-2 text-3xl font-bold">{stats.averageScore.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl bg-slate-800 p-5 shadow-lg">
              <p className="text-sm text-slate-300">✅ Topics Mastered</p>
              <p className="mt-2 text-3xl font-bold">{stats.totalMastered}</p>
            </div>
          </div>
        )}

        {stats && stats.totalDueToday > 0 && (
          <div className="mb-6 rounded-xl border border-indigo-500 bg-indigo-900/50 p-4 text-indigo-200">
            🔔 You have {stats.totalDueToday} topic(s) due for review today
          </div>
        )}

        <h2 className="mb-4 text-xl font-semibold">Your Documents</h2>

        {!loadingOverview && documents.length === 0 && (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-10 text-center text-slate-400">
            📭 No documents yet. Upload a PDF to get started.
          </div>
        )}

        <div className="space-y-4">
          {documents.map((doc) => (
            <button
              type="button"
              key={doc.quizId}
              onClick={() => openDocumentDetail(doc.quizId)}
              className="w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-800 p-5 text-left shadow-lg transition-all duration-200 hover:border-indigo-500 hover:bg-slate-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-medium text-white">📄 {doc.pdfName}</p>
                  <p className="mt-1 text-sm text-slate-400">{formatDate(doc.createdAt)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-300">
                      {doc.totalQuestions} Questions
                    </span>
                    {doc.attempted ? (
                      <span className="rounded-full bg-indigo-900 px-3 py-1 text-xs text-indigo-300">
                        Score: {doc.latestScore}%
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-400">Not attempted</span>
                    )}
                    <span className="rounded-full bg-green-900 px-3 py-1 text-xs text-green-300">
                      {doc.masteredCount}/{doc.reviewCount} Mastered
                    </span>
                  </div>
                </div>
                <span className="whitespace-nowrap text-sm text-indigo-400">View Details →</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full rounded-xl bg-[#0f172a] p-6 text-white shadow-lg">
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goBack}
          className="text-indigo-400 transition-all duration-200 hover:text-white"
        >
          ← Back
        </button>
        <h1 className="truncate text-2xl font-bold">{detail?.quiz.pdfName || "Document Details"}</h1>
      </div>

      <div className="mb-6 border-b border-slate-700">
        <div className="flex flex-wrap gap-6">
          {[
            { key: "analysis", label: "📊 Analysis" },
            { key: "flashcards", label: "🃏 Flashcards" },
            { key: "reviews", label: "🔁 Spaced Repetition" },
            { key: "videos", label: "🎬 Videos" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`pb-3 text-sm transition-all duration-200 ${
                activeTab === tab.key
                  ? "border-b-2 border-indigo-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loadingDetail && (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 text-slate-300">Loading document details...</div>
      )}

      {detailError && (
        <div className="rounded-xl border border-red-500 bg-red-900/30 p-4 text-red-200">{detailError}</div>
      )}

      {!loadingDetail && detail && activeTab === "analysis" && (
        <div className="space-y-6">
          {!detail.latestReport ? (
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-10 text-center text-slate-400">
              No quiz attempted yet. Take the quiz first.
            </div>
          ) : (
            <>
              <div
                className={`rounded-xl border p-5 ${getLearnerStyles(detail.latestReport.learnerType).wrapper}`}
              >
                <p className="text-2xl font-bold">
                  {getLearnerStyles(detail.latestReport.learnerType).emoji} {detail.latestReport.learnerType}
                </p>
                <p className="mt-3 text-sm leading-relaxed">{detail.latestReport.summary}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-800 p-5">
                  <h3 className="mb-3 text-lg font-semibold">💪 Strong Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {detail.latestReport.strongTopics.length ? (
                      detail.latestReport.strongTopics.map((topic) => (
                        <span key={topic} className="rounded-full bg-green-900 px-3 py-1 text-xs text-green-300">
                          {topic}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">No strong topics identified yet.</span>
                    )}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-800 p-5">
                  <h3 className="mb-3 text-lg font-semibold">⚠️ Weak Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {detail.latestReport.weakTopics.length ? (
                      detail.latestReport.weakTopics.map((topic) => (
                        <span key={topic} className="rounded-full bg-red-900 px-3 py-1 text-xs text-red-300">
                          {topic}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">No weak topics identified yet.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-800 p-5">
                <h3 className="mb-4 text-lg font-semibold">Topic Score Bars</h3>
                <div className="space-y-4">
                  {detail.latestReport.topicScores.map((item) => (
                    <div key={item.topic}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>{item.topic}</span>
                        <span>{item.score}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-700">
                        <div
                          className={`h-2 rounded-full ${getBarColor(item.score)}`}
                          style={{ width: `${Math.max(0, Math.min(item.score, 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="rounded-xl bg-slate-800 p-5">
            <h3 className="mb-4 text-lg font-semibold">Attempt History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-300">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">Time Taken</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.attempts.map((attempt, index) => (
                    <tr
                      key={attempt.attemptId}
                      className="border-t border-slate-700 transition-all duration-200 hover:bg-slate-700/50"
                    >
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2 text-slate-300">{formatDateTime(attempt.submittedAt)}</td>
                      <td className={`px-3 py-2 font-semibold ${getScoreColor(attempt.score)}`}>{attempt.score}%</td>
                      <td className="px-3 py-2 text-slate-300">{formatTimeTaken(attempt.timeTaken)}</td>
                    </tr>
                  ))}
                  {detail.attempts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                        No attempts yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loadingDetail && detail && activeTab === "flashcards" && (
        <div className="space-y-6">
          {flashcards.length === 0 ? (
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-10 text-center text-slate-400">
              No flashcards available.
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setFlipped((prev) => !prev)}
                className="mx-auto block h-48 w-full max-w-lg cursor-pointer rounded-xl border border-slate-600 bg-slate-800 p-6 text-left shadow-lg transition-all duration-200 hover:border-indigo-500"
              >
                {!flipped ? (
                  <div className="flex h-full flex-col justify-between">
                    <p className="text-lg font-medium">{currentFlashcard.front}</p>
                    <p className="text-xs text-slate-500">Click to reveal answer</p>
                  </div>
                ) : (
                  <div className="flex h-full flex-col justify-between">
                    <p className="text-lg font-medium text-indigo-300">{currentFlashcard.back}</p>
                    <span className="inline-block w-fit rounded-full bg-indigo-900 px-3 py-1 text-xs text-indigo-300">
                      {currentFlashcard.topic}
                    </span>
                  </div>
                )}
              </button>

              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentIndex((prev) => Math.max(prev - 1, 0));
                    setFlipped(false);
                  }}
                  disabled={currentIndex === 0}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white transition-all duration-200 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Prev
                </button>
                <p className="text-sm text-slate-400">
                  {currentIndex + 1} / {flashcards.length}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentIndex((prev) => Math.min(prev + 1, flashcards.length - 1));
                    setFlipped(false);
                  }}
                  disabled={currentIndex === flashcards.length - 1}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white transition-all duration-200 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {!loadingDetail && detail && activeTab === "reviews" && (
        <div className="space-y-6">
          {detail.reviews.length === 0 ? (
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-10 text-center text-slate-400">
              No topics scheduled yet. Complete a quiz to start tracking.
            </div>
          ) : (
            <>
              <section>
                <h3 className="mb-3 text-lg font-semibold">🔴 Due Today</h3>
                <div className="space-y-3">
                  {groupedReviews.due.length ? (
                    groupedReviews.due.map((review) => (
                      <div
                        key={`due-${review.topic}`}
                        className="rounded-xl border-l-4 border-red-500 bg-slate-800 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{review.topic}</p>
                          <button
                            type="button"
                            className="rounded-lg bg-indigo-600 px-3 py-1 text-xs text-white transition-all duration-200 hover:bg-indigo-500"
                          >
                            Review now
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No topics due today.</p>
                  )}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-lg font-semibold">🟡 Upcoming</h3>
                <div className="space-y-3">
                  {groupedReviews.upcoming.length ? (
                    groupedReviews.upcoming.map((review) => (
                      <div
                        key={`upcoming-${review.topic}`}
                        className="rounded-xl border-l-4 border-yellow-500 bg-slate-800 p-4"
                      >
                        <p className="font-medium">{review.topic}</p>
                        <p className="mt-1 text-sm text-slate-300">
                          Next review: {review.nextReviewDate ? formatDateTime(review.nextReviewDate) : "TBD"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {Math.min(review.intervalIndex, 5)}/5 reviews completed
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No upcoming scheduled topics.</p>
                  )}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-lg font-semibold">🟢 Mastered</h3>
                <div className="space-y-3">
                  {groupedReviews.mastered.length ? (
                    groupedReviews.mastered.map((review) => (
                      <div
                        key={`mastered-${review.topic}`}
                        className="rounded-xl border-l-4 border-green-500 bg-slate-800 p-4"
                      >
                        <p className="font-medium">{review.topic}</p>
                        <p className="mt-1 text-sm text-green-300">✅ Mastered</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No mastered topics yet.</p>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      )}

      {!loadingDetail && detail && activeTab === "videos" && (
        <div className="space-y-4">
          {!detail.latestReport?.videoRecommendations?.length ? (
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-10 text-center text-slate-400">
              No video recommendations yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {detail.latestReport.videoRecommendations.map((video, index) => (
                <div
                  key={`${video.url}-${index}`}
                  className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800 transition-all duration-200 hover:border-indigo-500"
                >
                  <img
                    src={
                      video.thumbnail ||
                      `https://placehold.co/640x360/1e293b/e2e8f0?text=${encodeURIComponent(video.topic)}`
                    }
                    alt={video.title}
                    className="h-36 w-full object-cover"
                  />
                  <div className="space-y-2 p-4">
                    <span className="inline-block rounded-full bg-indigo-900 px-3 py-1 text-xs text-indigo-300">
                      {video.topic}
                    </span>
                    <p className="text-sm text-white">{video.title}</p>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-xs text-indigo-400 transition-all duration-200 hover:text-indigo-300"
                    >
                      Watch on YouTube →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
