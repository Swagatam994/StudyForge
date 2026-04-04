import ReviewSchedule from "../models/ReviewSchedule.js";

export const INTERVALS = [1, 3, 7, 16, 35];

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const tomorrow = () => new Date(Date.now() + DAY_IN_MS);

const dateAfterDays = (days) => new Date(Date.now() + days * DAY_IN_MS);

export const scheduleTopicsAfterReport = async (userId, weakTopics, quizId) => {
  if (!Array.isArray(weakTopics) || weakTopics.length === 0) {
    return [];
  }

  const schedules = [];

  for (const rawTopic of weakTopics) {
    const topic = String(rawTopic || "").trim();
    if (!topic) continue;

    const existing = await ReviewSchedule.findOne({ user: userId, topic });

    if (existing) {
      existing.originalQuizId = quizId || existing.originalQuizId;
      existing.intervalIndex = 0;
      existing.nextReviewDate = tomorrow();
      existing.status = "pending";
      existing.reviewHistory = [];
      await existing.save();
      schedules.push(existing);
    } else {
      const created = await ReviewSchedule.create({
        user: userId,
        topic,
        originalQuizId: quizId || null,
        intervalIndex: 0,
        nextReviewDate: tomorrow(),
        status: "pending",
        reviewHistory: [],
      });
      schedules.push(created);
    }
  }

  return schedules;
};

export const processReviewResult = async (scheduleId, passed, score = null) => {
  const schedule = await ReviewSchedule.findById(scheduleId);
  if (!schedule) {
    throw new Error("Review schedule not found");
  }

  if (passed) {
    const nextIndex = schedule.intervalIndex + 1;
    schedule.intervalIndex = nextIndex;

    if (nextIndex >= INTERVALS.length) {
      schedule.status = "mastered";
      schedule.nextReviewDate = null;
    } else {
      schedule.status = "pending";
      schedule.nextReviewDate = dateAfterDays(INTERVALS[nextIndex]);
    }
  } else {
    schedule.intervalIndex = 0;
    schedule.nextReviewDate = tomorrow();
    schedule.status = "pending";
  }

  schedule.reviewHistory.push({
    attemptedAt: new Date(),
    passed,
    score,
  });

  await schedule.save();
  return schedule;
};

export const getDueReviews = async (userId) => {
  return ReviewSchedule.find({
    user: userId,
    nextReviewDate: { $lte: new Date() },
    status: { $ne: "mastered" },
  }).sort({ nextReviewDate: 1 });
};
