import mongoose from "mongoose";

const daySchema = new mongoose.Schema({
  day: Number,
  date: Date,
  type: { type: String, enum: ["study", "review", "rest"] },
  topic: String,
  tasks: [String],
  goal: String,
  estimatedHours: Number,
  completed: { type: Boolean, default: false },
});

const studyPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    report: { type: mongoose.Schema.Types.ObjectId, ref: "Report" },
    examDate: Date,
    days: [daySchema],
    totalDays: Number,
    generatedVia: { type: String, default: "nvidia-nemotron" },
  },
  { timestamps: true },
);

const StudyPlan = mongoose.model("StudyPlan", studyPlanSchema);

export default StudyPlan;
