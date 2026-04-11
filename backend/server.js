import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRouter from "./routes/authRouter.js";
import quizRouter from "./routes/quizRouter.js";
import reportRouter from "./routes/reportRouter.js";
import reviewRouter from "./routes/reviewRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
import cognitiveRouter from "./routes/cognitiveRoutes.js";
import studyPlanRouter from "./routes/studyPlanRoutes.js";

const app = express();

const PORT = process.env.PORT || 3000;
const dbPath = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/report", reportRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/cognitive", cognitiveRouter);
app.use("/api/studyplan", studyPlanRouter);
app.use((err, _req, res, _next) => {
  console.error("Unhandled API error:", err);
  res.status(err?.status || 500).json({
    message: err?.message || "Internal server error",
  });
});

mongoose
  .connect(dbPath)
  .then(async () => {
    await import("./cronJobs.js");
    console.log("Connected to mongo");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error ", err);
  });
