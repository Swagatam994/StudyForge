import QuizAttempt from "../models/quizAttempt.js";
import Report from "../models/report.js";
import { analyzeAttempt } from "../services/reportServices.js";
import { generateSummary } from "../services/aiServices.js";
import { getVideosForTopics } from "../services/youtubeServices.js";
import { scheduleTopicsAfterReport } from "../services/spacedRepetitionService.js";


// POST /api/report/generate/:attemptId
export const generateReport = async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.attemptId);
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (attempt.user.toString() !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    const { learnerType, strongTopics, weakTopics, topicScores } = analyzeAttempt(
      attempt.answers, attempt.score, attempt.timeTaken
    );

    // Fetch videos only for weak topics
    const videoRecommendations = await getVideosForTopics(weakTopics);

    // AI-generated summary
    const summary = await generateSummary({ score: attempt.score, strongTopics, weakTopics, learnerType });

    const report = await Report.create({
      user: req.user.id,
      attempt: attempt._id,
      learnerType,
      strongTopics,
      weakTopics,
      topicScores,
      videoRecommendations,
      summary,
    });

    await scheduleTopicsAfterReport(req.user.id, weakTopics, attempt.quiz);

    res.status(201).json(report);
  } catch (err) {
    console.error("generateReport failed:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/report/my  — all reports of logged-in user
export const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error("getMyReports failed:", err);
    res.status(500).json({ message: err.message });
  }
};
