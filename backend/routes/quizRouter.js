
import express from 'express'
import protectRoute from '../middleware/authmiddleware'
import { generateQuizFromPDF,submitQuiz } from '../controller/quizController';
const router= express.Router();
router.post("/generate", protectRoute, upload.single("pdf"), generateQuizFromPDF);
router.post("/submit", protectRoute, submitQuiz);

export default router;