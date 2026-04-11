import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  getCognitiveProfile,
  getIntervention,
  type CognitiveProfile,
  type Intervention,
} from "../api/aiApi";

type PatternKey =
  | "ILLUSION_OF_KNOWING"
  | "INTERFERENCE"
  | "ENCODING_FAILURE"
  | "RETRIEVAL_FAILURE"
  | "TRANSFER_FAILURE"
  | "COGNITIVE_OVERLOAD"
  | "STRONG";

const patternMeta: Record<PatternKey, { emoji: string; border: string; bg: string; badge: string; description: string }> = {
  ILLUSION_OF_KNOWING: {
    emoji: "🎭",
    border: "border-red-500",
    bg: "bg-red-950/60",
    badge: "bg-red-900 text-red-300",
    description: "High confidence but repeated wrong answers indicate false mastery.",
  },
  INTERFERENCE: {
    emoji: "🔀",
    border: "border-orange-500",
    bg: "bg-orange-950/60",
    badge: "bg-orange-900 text-orange-300",
    description: "Concepts are getting mixed with similar topics.",
  },
  ENCODING_FAILURE: {
    emoji: "❌",
    border: "border-red-500",
    bg: "bg-red-950/60",
    badge: "bg-red-900 text-red-300",
    description: "The concept was not encoded clearly during learning.",
  },
  RETRIEVAL_FAILURE: {
    emoji: "⏱️",
    border: "border-yellow-500",
    bg: "bg-yellow-950/60",
    badge: "bg-yellow-900 text-yellow-300",
    description: "Knowledge exists, but recall under pressure is weak.",
  },
  TRANSFER_FAILURE: {
    emoji: "🔄",
    border: "border-blue-500",
    bg: "bg-blue-950/60",
    badge: "bg-blue-900 text-blue-300",
    description: "Theory is known but applied scenarios are difficult.",
  },
  COGNITIVE_OVERLOAD: {
    emoji: "🌊",
    border: "border-purple-500",
    bg: "bg-purple-950/60",
    badge: "bg-purple-900 text-purple-300",
    description: "Too much information at once is reducing performance.",
  },
  STRONG: {
    emoji: "🏆",
    border: "border-green-500",
    bg: "bg-green-950/60",
    badge: "bg-green-900 text-green-300",
    description: "Consistent strong understanding and reliable performance.",
  },
};

const toPatternLabel = (pattern: string) => pattern.replaceAll("_", " ");

const confidenceColor = (value: number) => {
  if (value > 0.7) return "bg-green-500";
  if (value > 0.4) return "bg-yellow-500";
  return "bg-red-500";
};

export default function CognitivePage() {
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [interventionLoading, setInterventionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getCognitiveProfile();
        setProfile(result.profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load cognitive profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const dominantPattern = useMemo<PatternKey>(() => {
    if (!profile?.dominantPattern) return "STRONG";
    const key = profile.dominantPattern as PatternKey;
    return patternMeta[key] ? key : "STRONG";
  }, [profile]);

  const openIntervention = async (topic: string) => {
    try {
      setSelectedTopic(topic);
      setIntervention(null);
      setInterventionLoading(true);
      setError(null);
      const result = await getIntervention(topic);
      setIntervention(result.intervention);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load intervention");
    } finally {
      setInterventionLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedTopic(null);
    setIntervention(null);
    setInterventionLoading(false);
  };

  return (
    <div className="min-h-full bg-[#0f172a] p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link to="/dashboard" className="mb-2 inline-block text-indigo-400 hover:text-white transition-all duration-200">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold">🧠 Your Cognitive Learning Profile</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                <span className="rounded-full bg-purple-900 px-2 py-0.5 text-xs text-purple-300">AI Reasoning Model</span>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center rounded-xl border border-slate-700 bg-[#1e293b] p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-600 bg-red-950/40 p-4 text-red-200">{error}</div>
        )}

        {!loading && !profile && !error && (
          <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-12 text-center">
            <div className="text-5xl">🧠</div>
            <p className="mt-4 text-xl font-semibold text-white">No cognitive profile yet</p>
            <p className="mt-2 text-slate-400">Complete a quiz and generate a report to see your learning patterns</p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700"
            >
              Upload a PDF to start
            </Link>
          </div>
        )}

        {!loading && profile && (
          <>
            <div className={`rounded-xl border ${patternMeta[dominantPattern].border} ${patternMeta[dominantPattern].bg} p-5`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{patternMeta[dominantPattern].emoji}</div>
                  <div>
                    <p className="text-sm text-slate-300">Your Dominant Learning Pattern</p>
                    <p className="text-xl font-bold text-white">{toPatternLabel(dominantPattern)}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Last analyzed: {new Date(profile.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
              <button
                type="button"
                onClick={() => setLegendOpen((prev) => !prev)}
                className="text-sm text-slate-300 hover:text-white transition-all duration-200"
              >
                What do these patterns mean? {legendOpen ? "▲" : "▼"}
              </button>

              {legendOpen && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-slate-400">
                        <th className="py-2">Pattern</th>
                        <th className="py-2">Meaning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Object.keys(patternMeta) as PatternKey[]).map((key) => (
                        <tr key={key} className="border-t border-slate-700">
                          <td className="py-2 pr-3 text-slate-200">
                            {patternMeta[key].emoji} {toPatternLabel(key)}
                          </td>
                          <td className="py-2 text-slate-400">{patternMeta[key].description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">Topic Breakdown</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {profile.topicProfiles.map((topic) => {
                  const meta = patternMeta[(topic.failurePattern as PatternKey) || "STRONG"] || patternMeta.STRONG;
                  const confidencePercent = Math.max(0, Math.min(100, Math.round((topic.confidence || 0) * 100)));

                  return (
                    <div
                      key={`${topic.topic}-${topic.detectedAt}`}
                      className={`rounded-xl border-l-4 ${meta.border} bg-[#1e293b] p-5 transition-all duration-200 hover:bg-slate-700 cursor-pointer`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="font-medium text-white">{topic.topic}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${meta.badge}`}>
                          {toPatternLabel(topic.failurePattern)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400">AI Confidence</p>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-700">
                        <div
                          className={`h-1.5 rounded-full ${confidenceColor(topic.confidence || 0)}`}
                          style={{ width: `${confidencePercent}%` }}
                        />
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm text-slate-300">{topic.reason}</p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-xs text-slate-400">⏱️ Fix time: {topic.estimatedFixTime}</p>
                        <button
                          type="button"
                          onClick={() => openIntervention(topic.topic)}
                          className="text-sm text-indigo-400 hover:text-white transition-all duration-200"
                        >
                          Get Intervention →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {selectedTopic && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4">
            <div className="mx-auto mt-20 w-full max-w-2xl rounded-2xl border border-slate-600 bg-slate-800 p-8">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">🎯 Your Intervention</h3>
                  <p className="text-sm text-indigo-400">{selectedTopic}</p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-400 hover:text-white">✕</button>
              </div>

              {interventionLoading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                </div>
              )}

              {!interventionLoading && error && (
                <div className="rounded-xl border border-red-600 bg-red-950/40 p-4 text-sm text-red-200">{error}</div>
              )}

              {!interventionLoading && intervention && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">{intervention.title}</h4>

                  <div>
                    <p className="text-sm text-slate-300">📋 Instructions</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-300">{intervention.instructions}</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-300">✏️ Your Exercise</p>
                    <div className="mt-1 rounded-xl bg-slate-900 p-4 text-sm font-mono text-slate-200 whitespace-pre-line">
                      {intervention.exercise}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-slate-300">✅ Success Criteria</p>
                    <p className="mt-1 text-sm text-slate-300">{intervention.successCriteria}</p>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-400">🔄 Check again in: {intervention.followUpIn}</p>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 transition-all duration-200"
                    >
                      Got it! Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
