import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  question: String,
  topic: String,
  userAnswer: String,
  correctAnswer: String,
  isCorrect: Boolean,
});

const quizAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
  answers: [answerSchema],
  score: Number,              // percentage
  timeTaken: Number,          // in seconds
  submittedAt: { type: Date, default: Date.now },
});

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);
export default QuizAttempt;
