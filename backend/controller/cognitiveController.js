import { detectAndSaveProfile, getInterventionForTopic } from "../services/cognitiveService.js";
import CognitiveProfile from "../models/CognitiveProfile.js";
import Report from "../models/report.js";
import QuizAttempt from "../models/quizAttempt.js";

export const getMyProfile = async (req, res) => {
  try {
    let profile = await CognitiveProfile.findOne({ user: req.user.id }).sort({ createdAt: -1 });

    if (!profile) {
      const latestReport = await Report.findOne({ user: req.user.id }).sort({ createdAt: -1 });

      if (latestReport?.attempt) {
        const attempt = await QuizAttempt.findById(latestReport.attempt);
        if (attempt?.answers?.length) {
          await detectAndSaveProfile(req.user.id, latestReport._id, attempt.answers);
          profile = await CognitiveProfile.findOne({ user: req.user.id }).sort({ createdAt: -1 });
        }
      }
    }

    if (!profile) {
      return res.json({
        profile: null,
        message: "No cognitive profile yet. Complete a quiz first.",
      });
    }

    return res.json({ profile });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getIntervention = async (req, res) => {
  try {
    const intervention = await getInterventionForTopic(req.user.id, req.params.topic);
    return res.json({ intervention });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
