import express from 'express';
import { connection } from './database/connection.database.mjs';
import candidateRoutes from './routes/candidate.routes.js';
import semesterRoutes from './routes/semester.routes.js';
import courseRoutes from './routes/course.routes.js';
import studentRoutes from './routes/student.routes.js';
import entranceExamRoutes from './routes/entranceExam.routes.js';
import departmentRoutes from './routes/department.routes.js';

const app = express();

// Database connection
const DATABASE_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/yourDatabaseName';
connection(DATABASE_URL).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Could not connect to MongoDB:', err);
    process.exit(1);
});

app.use(express.json());

// Use routes
app.use('/candidates', candidateRoutes);
app.use('/semesters', semesterRoutes);
app.use('/courses', courseRoutes);
app.use('/students', studentRoutes);
app.use('/entranceExams', entranceExamRoutes);
app.use('/departments', departmentRoutes);

// Additional route groups can be added similarly

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 