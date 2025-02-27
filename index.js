import express from "express";
import "dotenv/config";
import cors from 'cors';
import notFound from './src/middlewares/notFound.middleware.js';
import connection  from "./src/database/connection.database.mjs";
import candidateRoutes from './src/routes/candidate.routes.js';
import semesterRoutes from './src/routes/semester.routes.js';
import courseRoutes from './src/routes/course.routes.js';
import studentRoutes from './src/routes/student.routes.js';
import entranceExamRoutes from './src/routes/entranceExam.routes.js';
import departmentRoutes from './src/routes/department.routes.js';
import "express-async-errors";

const app = express();

// Configure CORS
app.use(cors({
  origin: 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Use routes
app.use('/candidates', candidateRoutes);
app.use('/semesters', semesterRoutes);
app.use('/courses', courseRoutes);
app.use('/students', studentRoutes);
app.use('/entranceExams', entranceExamRoutes);
app.use('/departments', departmentRoutes);

// Middleware for handling not found routes
app.use(notFound);


const port = process.env.PORT || 3000;


const start = async () => {
    try {
        app.listen(port, () => {
            console.log(`Server listening at http://localhost:${port}`);
        });
    } catch (error) {
        console.log(error);
    }
};
// Database connection
connection().then(() => {
    start();
}).catch(err => {
    console.error('Could not connect to MongoDB:', err);
    process.exit(1);
});

