const mongoose = require("mongoose");

const interviewSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userModel",
    required: true,
  },
  interviewType: {
    type: String,
    enum: ["behavioral", "technical", "hr", "general"],
    required: true,
  },
  status: {
    type: String,
    enum: [
      "initialized",
      "in_progress",
      "analysis_pending",
      "completed",
      "failed",
      "analysis_failed",
    ],
    default: "initialized",
  },
  vapiCallId: {
    type: String,
  },
  transcript: {
    type: String,
    default: "",
  },
  report: {
    overallScore: Number,
    feedback: String,
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    detailedAnalysis: mongoose.Schema.Types.Mixed,
  },
  metadata: {
    uploadedInfo: { type: String },
    role: { type: String },
    level: { type: String },
    agentName: { type: String, default: "Rohan" },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const InterviewSession = mongoose.model(
  "InterviewSession",
  interviewSessionSchema,
);

module.exports = InterviewSession;
