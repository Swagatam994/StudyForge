import { analyzeCognitiveFailure, generateIntervention } from "./aiServices.js";
import CognitiveProfile from "../models/CognitiveProfile.js";

const ALLOWED_PATTERNS = new Set([
  "ILLUSION_OF_KNOWING",
  "INTERFERENCE",
  "ENCODING_FAILURE",
  "RETRIEVAL_FAILURE",
  "TRANSFER_FAILURE",
  "COGNITIVE_OVERLOAD",
  "STRONG",
]);

export const detectAndSaveProfile = async (userId, reportId, answers) => {
  try {
    const groupedByTopic = new Map();

    for (const answer of answers || []) {
      const topic = (answer?.topic || "General").trim() || "General";
      if (!groupedByTopic.has(topic)) {
        groupedByTopic.set(topic, []);
      }
      groupedByTopic.get(topic).push(answer);
    }

    const topicProfiles = [];

    for (const [topic, topicAnswers] of groupedByTopic.entries()) {
      const weakAnswers = topicAnswers.filter((item) => item?.isCorrect === false);

      if (!weakAnswers.length) {
        topicProfiles.push({
          topic,
          failurePattern: "STRONG",
          confidence: 0.95,
          reason: "Consistent correct performance in this topic.",
          intervention: "Maintain with a short periodic review.",
          estimatedFixTime: "No major fix needed",
          detectedAt: new Date(),
          resolved: true,
        });
        continue;
      }

      let analysis;
      try {
        analysis = await analyzeCognitiveFailure(weakAnswers, topic);
      } catch (analysisErr) {
        console.error(`Cognitive analysis failed for topic "${topic}":`, analysisErr.message);
        analysis = {
          pattern: "ENCODING_FAILURE",
          confidence: 0.5,
          reason:
            "AI reasoning was unavailable for this topic, so a conservative fallback pattern was assigned.",
          intervention:
            "Revisit core concepts for this topic and do 5 targeted practice questions before re-attempting.",
          estimatedFixTime: "2-3 focused study sessions",
        };
      }

      const normalizedPattern = ALLOWED_PATTERNS.has(String(analysis.pattern))
        ? String(analysis.pattern)
        : "ENCODING_FAILURE";

      topicProfiles.push({
        topic,
        failurePattern: normalizedPattern,
        confidence: Number(analysis.confidence || 0),
        reason: analysis.reason,
        intervention: analysis.intervention,
        estimatedFixTime: analysis.estimatedFixTime || "2-3 focused study sessions",
        detectedAt: new Date(),
        resolved: false,
      });
    }

    const patternCounts = {};
    for (const profile of topicProfiles) {
      if (!profile.failurePattern || profile.failurePattern === "STRONG") continue;
      patternCounts[profile.failurePattern] = (patternCounts[profile.failurePattern] || 0) + 1;
    }

    const dominantPattern =
      Object.entries(patternCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "STRONG";

    const savedProfile = await CognitiveProfile.findOneAndUpdate(
      { user: userId, report: reportId },
      {
        user: userId,
        report: reportId,
        topicProfiles,
        dominantPattern,
        lastUpdated: new Date(),
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    console.log(`💾 Cognitive profile saved for user ${userId}`);
    return savedProfile;
  } catch (err) {
    console.error("detectAndSaveProfile failed:", err.message);
    return null;
  }
};

export const getInterventionForTopic = async (userId, topic) => {
  const profile = await CognitiveProfile.findOne({ user: userId }).sort({ createdAt: -1 });
  if (!profile) {
    throw new Error("No cognitive profile found for this topic");
  }

  const topicProfile = (profile.topicProfiles || []).find(
    (item) => item.topic?.toLowerCase() === String(topic || "").toLowerCase(),
  );

  if (!topicProfile) {
    throw new Error("No cognitive profile found for this topic");
  }

  const generated = await generateIntervention(topicProfile.failurePattern, topicProfile.topic, []);

  return {
    pattern: topicProfile.failurePattern,
    confidence: topicProfile.confidence,
    reason: topicProfile.reason,
    estimatedFixTime: topicProfile.estimatedFixTime,
    ...generated,
  };
};
