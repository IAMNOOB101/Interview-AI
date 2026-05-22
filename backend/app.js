import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes         from "./routes/auth.routes.js";
import sessionRoutes      from "./routes/session.routes.js";
import historyRoutes      from "./routes/history.routes.js";
import interviewRoutes    from "./routes/interview.routes.js";
import interviewSetupRoutes from "./routes/interviewSetup.routes.js";
import adminRoutes        from "./routes/admin.routes.js";
import resumeRoutes       from "./routes/resume.routes.js";
import paymentRoutes      from "./routes/payment.routes.js";
import passwordRoutes     from "./routes/password.routes.js";
import { errorHandler }   from "./middleware/error.middleware.js";
import { logger }         from "./middleware/logger.middleware.js";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== "production") app.use(logger);

// Routes
app.use("/api/auth",      authRoutes);
app.use("/api/auth",      passwordRoutes);
app.use("/api/interview", sessionRoutes);      // /session/start, /session/submit, /sessions, /report/:id
app.use("/api/interview", historyRoutes);      // /history
app.use("/api/interview", interviewRoutes);    // /download/:id
app.use("/api/interview", interviewSetupRoutes); // /setup
app.use("/api/admin",     adminRoutes);
app.use("/api/resume",    resumeRoutes);
app.use("/api/payments",  paymentRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok", ts: new Date() }));
app.get("/",           (_, res) => res.send("InterviewAI ✓"));

app.use(errorHandler);
export default app;
