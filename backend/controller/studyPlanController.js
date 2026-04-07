import mongoose from "mongoose";
import Report from "../models/report.js";
import {
  createStudyPlan,
  markDayComplete,
  getUserStudyPlan,
} from "../services/studyPlanService.js";

export const generatePlan = async (req, res) => {
  try {
    const { reportId, examDate } = req.body;

    if (!examDate) {
      return res.status(400).json({ message: "examDate is required" });
    }

    const exam = new Date(examDate);
    if (Number.isNaN(exam.getTime()) || exam <= new Date()) {
      return res.status(400).json({ message: "Exam date must be in the future." });
    }

    let report = null;
    if (reportId && mongoose.Types.ObjectId.isValid(reportId)) {
      report = await Report.findById(reportId);
    }

    if (report && String(report.user) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!report) {
      report = await Report.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    }

    if (!report) {
      return res.status(400).json({ message: "No report found. Complete a quiz and generate a report first." });
    }

    const plan = await createStudyPlan(req.user.id, report._id, report, exam);
    return res.json({ plan });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getMyPlan = async (req, res) => {
  try {
    const plan = await getUserStudyPlan(req.user.id);
    return res.json({ plan });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const completeDay = async (req, res) => {
  try {
    const { planId, dayNumber } = req.body;

    if (!planId || typeof dayNumber !== "number") {
      return res.status(400).json({ message: "planId and numeric dayNumber are required" });
    }

    const plan = await markDayComplete(planId, dayNumber, req.user.id);
    return res.json({
      plan,
      message: `Day ${dayNumber} marked complete! Keep going 🎯`,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
