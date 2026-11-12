const dns = require("node:dns");

// MongoDB Atlas DNS resolution workaround
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const connectDB = require("./config/db");
const config = require("./config/env");
const { attachTranscriptionSocket } = require("./websocket/transcriptionSocket");

const app = express();

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory");
}

fs.mkdirSync(config.tempUploadDir, { recursive: true });
fs.mkdirSync(config.audioStorageDir, { recursive: true });

// CORS configuration
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.frontendOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin is not allowed by CORS"));
  }
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
const interviewRoutes = require("./routes/InterviewRoutes");
const feedbackRoutes = require("./routes/FeedbackRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const profileRoutes = require("./routes/profileRoutes");
const whisperRoutes = require("./routes/whisperRoutes");
const chatRoutes = require("./routes/chatRoutes");
const subscriberRoutes = require("./routes/subscriberRoutes");

// API endpoints
app.use("/api/interviews", interviewRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/whisper", whisperRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/subscribe", subscriberRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("API running...");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);

  res.status(500).json({
    message: "Something went wrong"
  });
});

// HTTP server
const httpServer = http.createServer(app);

// Attach WebSocket
attachTranscriptionSocket(httpServer);

// Start server only after successful database connection
const startServer = async () => {
  try {
    console.log("Connecting to MongoDB...");

    await connectDB();

    console.log("MongoDB connection established.");

    httpServer.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });

  } catch (error) {
    console.error("Application startup failed:", error);
    process.exit(1);
  }
};

startServer();