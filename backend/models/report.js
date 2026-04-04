import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  attempt: { type: mongoose.Schema.Types.ObjectId, ref: "QuizAttempt" },
  learnerType: {
    type: String,
    enum: ["Fast Learner", "Medium Learner", "Average Learner", "Slow Learner"],
  },
  strongTopics: [String],
  weakTopics: [String],
  topicScores: [{ topic: String, score: Number }], // percentage per topic
  videoRecommendations: [
    { topic: String, title: String, url: String, thumbnail: String },
  ],
  summary: String, // AI-generated summary paragraph
  createdAt: { type: Date, default: Date.now },
});
const Report = mongoose.model("Report", reportSchema);
export default Report;
