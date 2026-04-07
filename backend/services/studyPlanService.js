import { generateStudyPlan } from "./aiServices.js";
import StudyPlan from "../models/StudyPlan.js";

export const createStudyPlan = async (userId, reportId, report, examDate) => {
  const generatedDays = await generateStudyPlan(report, examDate);

  const normalizedDays = generatedDays.map((day, index) => ({
    day: Number(day.day ?? index + 1),
    date: day.date ? new Date(day.date) : new Date(),
    type: ["study", "review", "rest"].includes(String(day.type).toLowerCase())
      ? String(day.type).toLowerCase()
      : "study",
    topic: String(day.topic || "General Review"),
    tasks: Array.isArray(day.tasks) ? day.tasks.map((task) => String(task)) : [],
    goal: String(day.goal || "Make progress in this topic"),
    estimatedHours: Number(day.estimatedHours || 2),
    completed: false,
  }));

  const plan = await StudyPlan.create({
    user: userId,
    report: reportId,
    examDate: new Date(examDate),
    days: normalizedDays,
    totalDays: normalizedDays.length,
    generatedVia: "nvidia-nemotron",
  });

  return plan;
};

export const markDayComplete = async (planId, dayNumber, userId) => {
  const plan = await StudyPlan.findById(planId);
  if (!plan) {
    throw new Error("Study plan not found");
  }

  if (String(plan.user) !== String(userId)) {
    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
  }

  const day = plan.days.find((item) => item.day === Number(dayNumber));
  if (!day) {
    throw new Error("Day not found in study plan");
  }

  day.completed = true;
  await plan.save();

  return plan;
};

export const getUserStudyPlan = async (userId) => {
  const plan = await StudyPlan.findOne({ user: userId }).sort({ createdAt: -1 });
  return plan || null;
};
