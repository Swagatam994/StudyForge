import mongoose from "mongoose";

const topicProfileSchema = new mongoose.Schema({
  topic: { type: String, default: "" },
  failurePattern: {
    type: String,
    enum: [
      "ILLUSION_OF_KNOWING",
      "INTERFERENCE",
      "ENCODING_FAILURE",
      "RETRIEVAL_FAILURE",
      "TRANSFER_FAILURE",
      "COGNITIVE_OVERLOAD",
      "STRONG",
    ],
    default: "STRONG",
  },
  confidence: { type: Number, default: 0 },
  reason: { type: String, default: "" },
  intervention: { type: String, default: "" },
  estimatedFixTime: { type: String, default: "" },
  detectedAt: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false },
});

const cognitiveProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    report: { type: mongoose.Schema.Types.ObjectId, ref: "Report" },
    topicProfiles: [topicProfileSchema],
    dominantPattern: { type: String, default: "STRONG" },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const CognitiveProfile = mongoose.model("CognitiveProfile", cognitiveProfileSchema);

export default CognitiveProfile;
