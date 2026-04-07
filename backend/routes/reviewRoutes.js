import express from "express";
import protectRoute from "../middleware/authmiddleware.js";
import {
  getMyDueReviews,
  getMyAllSchedules,
  submitReview,
  getUpcomingReviews,
} from "../controller/reviewController.js";

const router = express.Router();

router.get("/due", protectRoute, getMyDueReviews);
router.get("/all", protectRoute, getMyAllSchedules);
router.get("/upcoming", protectRoute, getUpcomingReviews);
router.post("/submit", protectRoute, submitReview);

export default router;
