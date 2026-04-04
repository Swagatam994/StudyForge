import express from "express";
import protectRoute from "../middleware/authmiddleware.js";
import { generateReport, getMyReports } from "../controller/reportController.js";

const router = express.Router();

router.post("/generate/:attemptId", protectRoute, generateReport);
router.get("/my", protectRoute, getMyReports);

export default router;
