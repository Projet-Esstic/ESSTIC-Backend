import express from "express";
import http from "http";
import { Server } from "socket.io";
import "dotenv/config";
import cors from "cors";
import notFound from "./src/middlewares/notFound.middleware.js";
import connection from "./src/database/connection.database.mjs";
import departmentRoutes from "./src/routes/department.routes.js";
import courseRoutes from "./src/routes/course.routes.js";
import candidateRoutes from "./src/routes/candidate.routes.js";
import classRoutes from "./src/routes/class.routes.js";
import semesterRoutes from "./src/routes/semester.routes.js";
import studentRoutes from "./src/routes/student.routes.js";
import entranceExamRoutes from "./src/routes/entranceExam.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import personnelRoutes from "./src/routes/personnel.routes.js";
import settingRoutes from "./src/routes/settings.routes.js";
import "express-async-errors";
import requestRoutes from "./src/routes/request.routes.js";


// Create Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:8080",
      "http://localhost:8081",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Configure Express CORS middleware
app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://localhost:8081",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debugging: Log incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Register API routes
app.use("/api/departments", departmentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/entranceExams", entranceExamRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/personnel", personnelRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/requests", requestRoutes);
// Middleware for handling not found routes
app.use(notFound);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

// Global process-level handlers to avoid hard crashes
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection at:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

// Throttling utility
function throttle(func, delay) {
  let lastCall = 0;
  let timeout;
  return function (...args) {
    const now = Date.now();
    const remaining = delay - (now - lastCall);
    if (remaining <= 0) {
      clearTimeout(timeout);
      lastCall = now;
      func(...args);
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, remaining);
    }
  };
}

const throttledEmitters = {};
const throttleLimit = 1000;

function getThrottledEmitter(channel) {
  if (!throttledEmitters[channel]) {
    throttledEmitters[channel] = throttle((change) => {
      io.emit(channel, change);
    }, throttleLimit);
  }
  return throttledEmitters[channel];
}

// Function to watch MongoDB changes with retry logic
function watchChanges(db) {
  const pipeline = [{ $match: { operationType: { $in: ["insert", "update", "delete"] } } }];
  let changeStream = db.watch(pipeline);

  console.log("Started watching for changes...");

  changeStream.on("change", (change) => {
    console.log("Detected change:", change);
    const collectionName = change.ns?.coll;
    if (collectionName) {
      getThrottledEmitter(collectionName)(change);
    } else {
      io.emit("general", change);
    }
  });

  changeStream.on("error", (error) => {
    console.error("Change Stream error:", error);
    setTimeout(() => {
      console.log("Restarting Change Stream...");
      watchChanges(db);
    }, 5000); // Retry after 5 seconds
  });

  changeStream.on("close", () => {
    console.warn("Change Stream closed. Reopening...");
    setTimeout(() => {
      watchChanges(db);
    }, 5000); // Retry after 5 seconds
  });
}

// Connect to MongoDB and start watching
connection()
  .then((mongooseConnection) => {
    console.log("Connected to MongoDB via Mongoose");
    const db = mongooseConnection.db;
    watchChanges(db);

    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Could not connect to MongoDB:", err);
    process.exit(1);
  });

// Handle new Socket.io connections
io.on("connection", (socket) => {
  console.log("Client connected");
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
