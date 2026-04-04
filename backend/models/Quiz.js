import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],          // 4 options
  correctAnswer: String,
  topic: String,              // e.g. "Sorting Algorithms"
});

const quizSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fileId: { type: String, required: true, index: true },
  pdfName: String,
  fileType: {
    type: String,
    enum: ["pdf", "txt", "doc", "docx", "ppt", "pptx"],
    default: "pdf",
  },
  questions: [questionSchema],
  createdAt: { type: Date, default: Date.now },
});

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;
