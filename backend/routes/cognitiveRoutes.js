import express from "express";
import protectRoute from "../middleware/authmiddleware.js";
import { getMyProfile, getIntervention } from "../controller/cognitiveController.js";

const router = express.Router();

router.get("/profile", protectRoute, getMyProfile);
router.get("/intervention/:topic", protectRoute, getIntervention);

export default router;
