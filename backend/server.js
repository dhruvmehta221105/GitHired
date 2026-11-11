const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const connectDB = require("./config/db");
const { attachTranscriptionSocket } = require("./websocket/transcriptionSocket");

dotenv.config();
const config = require("./config/env");
connectDB();

const app = express();

// 🟢 Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory");
}
fs.mkdirSync(config.tempUploadDir, { recursive: true });
fs.mkdirSync(config.audioStorageDir, { recursive: true });

// Allow browser requests only from configured frontend origins.
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.frontendOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin is not allowed by CORS"));
  }
}));

// 🟢 Body parser
app.use(express.json());
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 🟢 Routes
const interviewRoutes = require("./routes/InterviewRoutes");
const feedbackRoutes = require("./routes/FeedbackRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const profileRoutes = require("./routes/profileRoutes");
const whisperRoutes = require("./routes/whisperRoutes"); // ✅ added
const chatRoutes = require("./routes/chatRoutes"); // ✅ added
const subscriberRoutes = require("./routes/subscriberRoutes");

app.use("/api/interviews", interviewRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/whisper", whisperRoutes); // ✅ important
app.use("/api/chat", chatRoutes); // ✅ important
app.use("/api/subscribe", subscriberRoutes);

// 🟢 Test route
app.get("/", (req, res) => {
  res.send("API running...");
});

// 🟢 Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ message: "Something went wrong" });
});

const httpServer = http.createServer(app);
attachTranscriptionSocket(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});