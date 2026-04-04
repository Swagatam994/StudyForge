import express from "express";
import protectRoute from "../middleware/authmiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { generateQuizFromDocument, submitQuiz } from "../controller/quizController.js";

const router = express.Router();

router.post("/generate", protectRoute, upload.single("file"), generateQuizFromDocument);
router.post("/submit", protectRoute, submitQuiz);

export default router;
