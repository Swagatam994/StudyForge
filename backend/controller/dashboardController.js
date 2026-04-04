import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/quizAttempt.js";
import Report from "../models/report.js";
import ReviewSchedule from "../models/ReviewSchedule.js";

export const getUserDocuments = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ user: req.user.id }).sort({ createdAt: -1 });

    const documents = await Promise.all(
      quizzes.map(async (quiz) => {
        const latestAttempt = await QuizAttempt.findOne({
          user: req.user.id,
          quiz: quiz._id,
        }).sort({ submittedAt: -1 });

        const reviews = await ReviewSchedule.find({
          user: req.user.id,
          originalQuizId: quiz._id,
        }).select("status");

        const masteredCount = reviews.filter((review) => review.status === "mastered").length;

        return {
          quizId: String(quiz._id),
          pdfName: quiz.pdfName,
          createdAt: quiz.createdAt,
          totalQuestions: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
          attempted: Boolean(latestAttempt),
          latestAttemptId: latestAttempt ? String(latestAttempt._id) : undefined,
          latestScore: latestAttempt?.score,
          reviewCount: reviews.length,
          masteredCount,
        };
      }),
    );

    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDocumentDetail = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (String(quiz.user) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const attempts = await QuizAttempt.find({
      user: req.user.id,
      quiz: quiz._id,
    }).sort({ submittedAt: -1 });

    const latestAttempt = attempts[0] || null;
    let latestReport = null;

    if (latestAttempt) {
      latestReport = await Report.findOne({
        user: req.user.id,
        attempt: latestAttempt._id,
      }).select("learnerType strongTopics weakTopics topicScores videoRecommendations summary");
    }

    const reviews = await ReviewSchedule.find({
      user: req.user.id,
      originalQuizId: quiz._id,
    }).sort({ nextReviewDate: 1 });

    const response = {
      quiz: {
        quizId: String(quiz._id),
        pdfName: quiz.pdfName,
        createdAt: quiz.createdAt,
        questions: quiz.questions || [],
      },
      attempts: attempts.map((attempt) => ({
        attemptId: String(attempt._id),
        score: attempt.score,
        timeTaken: attempt.timeTaken,
        submittedAt: attempt.submittedAt,
      })),
      latestReport: latestReport
        ? {
            learnerType: latestReport.learnerType,
            strongTopics: latestReport.strongTopics || [],
            weakTopics: latestReport.weakTopics || [],
            topicScores: latestReport.topicScores || [],
            videoRecommendations: latestReport.videoRecommendations || [],
            summary: latestReport.summary || "",
          }
        : null,
      flashcards: (quiz.questions || []).map((question) => ({
        front: question.question,
        back: question.correctAnswer,
        topic: question.topic,
      })),
      reviews: reviews.map((review) => ({
        topic: review.topic,
        status: review.status,
        nextReviewDate: review.nextReviewDate,
        intervalIndex: review.intervalIndex,
        reviewHistory: review.reviewHistory || [],
      })),
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const [totalDocuments, totalAttempts, totalMastered, totalDueToday] = await Promise.all([
      Quiz.countDocuments({ user: userId }),
      QuizAttempt.countDocuments({ user: userId }),
      ReviewSchedule.countDocuments({ user: userId, status: "mastered" }),
      ReviewSchedule.countDocuments({
        user: userId,
        nextReviewDate: { $lte: now },
        status: { $ne: "mastered" },
      }),
    ]);

    const avgScoreResult = await QuizAttempt.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, averageScore: { $avg: "$score" } } },
    ]);

    const averageScore = avgScoreResult.length ? Number(avgScoreResult[0].averageScore.toFixed(2)) : 0;

    const reports = await Report.find({ user: userId }).select("learnerType");
    const learnerTypeBreakdown = {
      "Fast Learner": 0,
      "Average Learner": 0,
      "Slow Learner": 0,
      "Medium Learner": 0,
    };

    for (const report of reports) {
      if (report.learnerType in learnerTypeBreakdown) {
        learnerTypeBreakdown[report.learnerType] += 1;
      } else if (report.learnerType) {
        learnerTypeBreakdown[report.learnerType] = 1;
      }
    }

    const recentAttempts = await QuizAttempt.find({ user: userId })
      .populate("quiz", "pdfName")
      .sort({ submittedAt: -1 })
      .limit(5);

    const recentActivity = recentAttempts.map((attempt) => ({
      pdfName: attempt.quiz?.pdfName || "Unknown Document",
      score: attempt.score,
      submittedAt: attempt.submittedAt,
    }));

    res.json({
      totalDocuments,
      totalAttempts,
      averageScore,
      totalMastered,
      totalDueToday,
      learnerTypeBreakdown,
      recentActivity,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
