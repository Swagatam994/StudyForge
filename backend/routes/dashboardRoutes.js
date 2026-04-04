import express from "express";
import protectRoute from "../middleware/authmiddleware.js";
import {
  getUserDocuments,
  getDocumentDetail,
  getUserStats,
} from "../controller/dashboardController.js";

const router = express.Router();

router.get("/documents", protectRoute, getUserDocuments);
router.get("/documents/:quizId", protectRoute, getDocumentDetail);
router.get("/stats", protectRoute, getUserStats);

export default router;
