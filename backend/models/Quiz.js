import  mongoose from ("mongoose");

const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],          // 4 options
  correctAnswer: String,
  topic: String,              // e.g. "Sorting Algorithms"
});

const quizSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  pdfName: String,
  questions: [questionSchema],
  createdAt: { type: Date, default: Date.now },
});

const Quiz=module.exports("Quiz", quizSchema);
export default Quiz;