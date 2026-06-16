const express = require("express");
const vapiInterviewRouter = express.Router();
const {
  startInterview,
  getInterviewReport,
  generateReportFromTranscript,
  getUserInterviews,
  retryAnalysis,
} = require("../controllers/vapiInterviewController");
const auth = require("../middleware/auth"); // Corrected middleware name

vapiInterviewRouter.post("/start", auth, startInterview);
vapiInterviewRouter.get("/report/:sessionId", getInterviewReport);
vapiInterviewRouter.post(
  "/report-from-transcript",
  auth,
  generateReportFromTranscript,
);
vapiInterviewRouter.post("/retry-analysis", auth, retryAnalysis);
vapiInterviewRouter.get("/user", auth, getUserInterviews);

module.exports = vapiInterviewRouter;
