import mongoose from "mongoose";

const reviewHistorySchema = new mongoose.Schema(
  {
    attemptedAt: { type: Date, default: Date.now },
    passed: { type: Boolean, required: true },
    score: { type: Number, default: null },
  },
  { _id: false },
);

const reviewScheduleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: String, required: true, trim: true },
    originalQuizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
    intervalIndex: { type: Number, default: 0 },
    nextReviewDate: {
      type: Date,
      required: function requiredNextReviewDate() {
        return this.status !== "mastered";
      },
    },
    status: { type: String, enum: ["pending", "due", "mastered"],default: "pending" },
    reviewHistory: [reviewHistorySchema],
  },
  { timestamps: true },
);

reviewScheduleSchema.index({ user: 1, topic: 1 }, { unique: true });

const ReviewSchedule = mongoose.model("ReviewSchedule", reviewScheduleSchema);

export default ReviewSchedule;
