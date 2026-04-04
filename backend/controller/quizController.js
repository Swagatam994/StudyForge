import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/quizAttempt.js";
import { extractTextFromUrl } from "../services/documentService.js";
import { generateQuiz } from "../services/aiServices.js";

// POST /api/quiz/generate  (multipart: PDF file)
export const generateQuizFromDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const fileUrl = req.file.path || req.file.secure_url;
    if (!fileUrl) {
      return res.status(400).json({ message: "Uploaded file URL is missing" });
    }

    const baseFileId = req.file.filename || req.file.public_id || req.file.asset_id || "upload";
    const fileId = `${baseFileId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const fileType = String(req.file.originalname || "").split(".").pop()?.toLowerCase() || "pdf";

    let text;
    try {
      text = await extractTextFromUrl(fileUrl, req.file.originalname);
    } catch (err) {
      return res.status(422).json({
        message: "Could not extract text from your file. If it's a scanned image, try a clearer scan. If it's an old .doc or .ppt format, try saving as .docx or .pptx first.",
        detail: err.message,
      });
    }

    const questions = await generateQuiz(text);

    const quiz = await Quiz.create({
      user: req.user.id,
      fileId,
      pdfName: req.file.originalname,
      fileType,
      questions,
    });

    res.status(201).json({
      quizId: quiz._id,
      fileId: quiz.fileId,
      pdfName: quiz.pdfName,
      fileType: quiz.fileType,
      questions: quiz.questions,
      sourceUrl: fileUrl,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/quiz/submit
export const submitQuiz = async (req, res) => {
  try {
    const { quizId, userAnswers, timeTaken } = req.body;
    if (!quizId || !Array.isArray(userAnswers) || !userAnswers.length) {
      return res.status(400).json({ message: "quizId and userAnswers are required" });
    }

    const answers = userAnswers.map((a) => ({
      ...a,
      isCorrect: a.userAnswer === a.correctAnswer,
    }));

    const score = Math.round((answers.filter((a) => a.isCorrect).length / answers.length) * 100);

    const attempt = await QuizAttempt.create({
      user: req.user.id,
      quiz: quizId,
      answers,
      score,
      timeTaken,
    });

    res.status(201).json({ attemptId: attempt._id, score, answers });
  } catch (err) {
    console.error("submitQuiz failed:", err);
    res.status(500).json({ message: err.message });
  }
};
