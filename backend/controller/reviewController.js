import ReviewSchedule from "../models/ReviewSchedule.js";
import {
  getDueReviews,
  processReviewResult,
  INTERVALS,
} from "../services/spacedRepetitionService.js";

export const getMyDueReviews = async (req, res) => {
  try {
    const results = await getDueReviews(req.user.id);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyAllSchedules = async (req, res) => {
  try {
    const schedules = await ReviewSchedule.find({ user: req.user.id }).sort({ nextReviewDate: 1 });

    const grouped = {
      due: [],
      pending: [],
      mastered: [],
    };

    for (const schedule of schedules) {
      if (schedule.status === "due") grouped.due.push(schedule);
      else if (schedule.status === "mastered") grouped.mastered.push(schedule);
      else grouped.pending.push(schedule);
    }

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const submitReview = async (req, res) => {
  try {
    const { scheduleId, score } = req.body;

    if (!scheduleId || typeof score !== "number") {
      return res.status(400).json({ message: "scheduleId and numeric score are required" });
    }

    const schedule = await ReviewSchedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Review schedule not found" });
    }

    if (String(schedule.user) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const passed = score >= 60;
    const updated = await processReviewResult(scheduleId, passed, score);

    let message = "";
    if (passed && updated.status === "mastered") {
      message = "Topic mastered! No more reviews needed.";
    } else if (passed) {
      message = `Great job! Next review in ${INTERVALS[updated.intervalIndex]} days`;
    } else {
      message = "Keep practicing! We'll remind you again tomorrow.";
    }

    res.json({ schedule: updated, message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUpcomingReviews = async (req, res) => {
  try {
    const schedules = await ReviewSchedule.find({
      user: req.user.id,
      status: { $ne: "mastered" },
    }).sort({ nextReviewDate: 1 });

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const grouped = new Map();

    for (const schedule of schedules) {
      if (!schedule.nextReviewDate) continue;

      const date = new Date(schedule.nextReviewDate);
      if (date < now || date > nextWeek) continue;

      const dateKey = date.toISOString().slice(0, 10);
      if (!grouped.has(dateKey)) grouped.set(dateKey, []);
      grouped.get(dateKey).push(schedule.topic);
    }

    const results = [...grouped.entries()]
      .map(([date, topics]) => ({ date, topics }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
