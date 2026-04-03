import Quiz from '../models/Quiz'
import QuizAttempt from '../models/QuizAttempt';
import { extractTextFromUrl } from '../services/pdf';
import { generateQuiz } from '../services/aiServices';

// POST /api/quiz/generate  (multipart: PDF file)
export const generateQuizFromPDF = async (req, res) => {
  try {
    const pdfUrl = req.file.path;  // Cloudinary URL
    const text = await extractTextFromUrl(pdfUrl);
    const questions = await generateQuiz(text);

    const quiz = await Quiz.create({
      user: req.user.id,
      pdfName: req.file.originalname,
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
    // userAnswers: [{ question, topic, userAnswer, correctAnswer }]

    const answers = userAnswers.map(a => ({
      ...a,
      isCorrect: a.userAnswer === a.correctAnswer,
    }));

    const score = Math.round((answers.filter(a => a.isCorrect).length / answers.length) * 100);

    const attempt = await QuizAttempt.create({
      user: req.user.id,
      quiz: quizId,
      answers,
      score,
      timeTaken,
    });

    res.status(201).json({ attemptId: attempt._id, score });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};