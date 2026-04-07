import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/quizAttempt.js";
import { extractTextFromUrl } from "../services/documentService.js";
import { processExtractedText } from "../services/textCleaningService.js";
import { generateQuiz, generateDocumentSummary, generateFlashcards } from "../services/aiServices.js";

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

    const filename = req.file.originalname;

    let rawText;
    try {
      rawText = await extractTextFromUrl(fileUrl, filename);
    } catch (err) {
      return res.status(422).json({
        message: err.message,
        stage: "extraction",
      });
    }

    let cleanedText;
    try {
      cleanedText = await processExtractedText(rawText, filename);
    } catch (err) {
      return res.status(422).json({
        message: err.message,
        stage: "validation",
      });
    }

    let questions;
    try {
      questions = await generateQuiz(cleanedText);
    } catch (err) {
      return res.status(422).json({
        message: err.message,
        stage: "generation",
      });
    }

    const baseFileId = req.file.filename || req.file.public_id || req.file.asset_id || "upload";
    const fileId = `${baseFileId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const fileType = String(filename || "").split(".").pop()?.toLowerCase() || "pdf";

    let aiSummary = "";
    let aiFlashcards = [];
    try {
      [aiSummary, aiFlashcards] = await Promise.all([
        generateDocumentSummary(cleanedText, filename),
        generateFlashcards(cleanedText),
      ]);
    } catch (err) {
      console.warn("AI summary/flashcards generation skipped:", err.message);
    }

    const quiz = await Quiz.create({
      user: req.user.id,
      fileId,
      pdfName: filename,
      fileType,
      aiSummary,
      aiFlashcards,
      questions,
    });

    res.status(201).json({ quizId: quiz._id, questions: quiz.questions });
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
