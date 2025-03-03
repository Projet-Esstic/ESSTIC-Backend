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
import "express-async-errors";

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:8080",
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

// Middleware for handling not found routes
app.use(notFound);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

// Throttling utility: Ensures the function is called at most once per "delay" ms.
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

// Create a map to hold throttled emitters per channel (collection)
const throttledEmitters = {};
const throttleLimit = 1000; // milliseconds

function getThrottledEmitter(channel) {
  if (!throttledEmitters[channel]) {
    throttledEmitters[channel] = throttle((change) => {
      io.emit(channel, change);
    }, throttleLimit);
  }
  return throttledEmitters[channel];
}

// Connect to MongoDB and set up change stream
connection()
  .then((mongooseConnection) => {
    console.log("Connected to MongoDB via Mongoose");
    const db = mongooseConnection.db; // Access the underlying MongoDB database

    // Watch only for insert, update, and delete events
    const pipeline = [{ $match: { operationType: { $in: ["insert", "update", "delete"] } } }];
    const changeStream = db.watch(pipeline);

    changeStream.on("change", (change) => {
      console.log("Detected change:", change);
      const collectionName = change.ns?.coll;
      console.log("Collection:", collectionName);
      if (collectionName) {
        getThrottledEmitter(collectionName)(change);
      } else {
        io.emit("general", change);
      }
    });

    // Start the HTTP & Socket.io server after the database connection is established
    const port = process.env.PORT || 5000; // Updated to match the error message
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