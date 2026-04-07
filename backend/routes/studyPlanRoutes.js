import express from "express";
import protectRoute from "../middleware/authmiddleware.js";
import { generatePlan, getMyPlan, completeDay } from "../controller/studyPlanController.js";

const router = express.Router();

router.post("/generate", protectRoute, generatePlan);
router.get("/my", protectRoute, getMyPlan);
router.post("/complete-day", protectRoute, completeDay);

export default router;
