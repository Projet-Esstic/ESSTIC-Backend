import AcademicDetail from '../models/AcademicDetail.js';
import mongoose from 'mongoose';

// Create a new academic detail record for a specific level and year
export const createAcademicDetail = async (req, res) => {
    try {
        const { level, year, courses = [], modules = [], semesters = [] } = req.body;
        const newAcademicDetail = new AcademicDetail({
            level,
            year,
            courses,
            modules,
            semesters,
        });

        await newAcademicDetail.save();
        res.status(201).json({ message: 'Academic detail created successfully', newAcademicDetail });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all academic details, possibly filtered by level and year
export const getAllAcademicDetails = async (req, res) => {
    try {
        const { level, year } = req.body;

        const filters = {};
        if (level) filters.level = level;
        if (year) filters.year = year;

        const academicDetails = await AcademicDetail.find(filters);
        res.status(200).json(academicDetails);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Retrieve academic details by level and year
export const getAcademicDetailById = async (req, res) => {
    try {
        const { level, year } = req.params;
        const academicDetail = await AcademicDetail.findOne({ level, year });

        if (!academicDetail) {
            return res.status(404).json({ message: 'Academic detail not found' });
        }

        res.status(200).json(academicDetail);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


// Remove academic detail data for a specific year and level
export const deleteAcademicDetail = async (req, res) => {
    try {
        const { level, year } = req.params;
        const academicDetail = await AcademicDetail.findOneAndDelete({ level, year });

        if (!academicDetail) {
            return res.status(404).json({ message: 'Academic detail not found' });
        }

        res.status(200).json({ message: 'Academic detail deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Duplicate the last academic detail (create a new academic detail based on the last one)
export const duplicateLastAcademicDetail = async (req, res) => {
    try {
        // Get the most recent academic detail
        const { level, year } = req.params;
        const lastAcademicDetail = await AcademicDetail.findOne({ level, year }).sort({ createdAt: -1 });

        if (!lastAcademicDetail) {
            return res.status(404).json({ message: 'No academic details found to duplicate' });
        }
        console.log(lastAcademicDetail.year)
        // Create a new academic detail based on the last one
        const newAcademicDetail = new AcademicDetail({
            level: lastAcademicDetail.level, // Keep the level
            year: (parseInt(lastAcademicDetail.year.split('-')[0]) + 1) + '-' + (parseInt(lastAcademicDetail.year.split('-')[1]) + 1), // Increment the year
            courses: lastAcademicDetail.courses,
            modules: lastAcademicDetail.modules,
            semesters: lastAcademicDetail.semesters,
        });

        await newAcademicDetail.save();
        res.status(201).json({ message: 'Academic detail duplicated successfully', newAcademicDetail });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Semester
export const createSemester = async (req, res) => {
    try {
        const { level, year } = req.params;
        const semesterData = req.body;

        const academicDetail = await AcademicDetail.findOne({ level, year });
        if (!academicDetail) {
            return res.status(404).json({ error: 'Academic Detail not found for given level and year' });
        }

        academicDetail.semesters.push(semesterData);
        await academicDetail.save();

        res.status(201).json({ message: 'Semester added successfully', semester: semesterData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getSemesters = async (req, res) => {
    try {
        const { level, year } = req.params;

        const academicDetail = await AcademicDetail.findOne({ level, year });
        if (!academicDetail) {
            return res.status(404).json({ error: 'No semesters found for given level and year' });
        }

        res.json(academicDetail.semesters);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getSemesterById = async (req, res) => {
    try {
        const { level, year, semesterId } = req.params;

        const academicDetail = await AcademicDetail.findOne({ level, year }).populate('semesters.createdBy');
        if (!academicDetail) {
            return res.status(404).json({ error: 'Academic Detail not found' });
        }

        const semester = academicDetail.semesters.id(semesterId);
        if (!semester) {
            return res.status(404).json({ error: 'Semester not found' });
        }

        res.json(semester);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateSemester = async (req, res) => {
    try {
        const { level, year, semesterId } = req.params;
        const updateData = req.body;

        const academicDetail = await AcademicDetail.findOne({ level, year });
        if (!academicDetail) {
            return res.status(404).json({ error: 'Academic Detail not found' });
        }

        const semester = academicDetail.semesters.id(semesterId);
        if (!semester) {
            return res.status(404).json({ error: 'Semester not found' });
        }

        Object.assign(semester, updateData);
        await academicDetail.save();

        res.json({ message: 'Semester updated successfully', semester });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteSemester = async (req, res) => {
    try {
        const { level, year, semesterId } = req.params;

        const academicDetail = await AcademicDetail.findOne({ level, year });
        if (!academicDetail) {
            return res.status(404).json({ error: 'Academic Detail not found' });
        }

        const semesterIndex = academicDetail.semesters.findIndex(s => s._id.toString() === semesterId);
        if (semesterIndex === -1) {
            return res.status(404).json({ error: 'Semester not found' });
        }

        academicDetail.semesters.splice(semesterIndex, 1);
        await academicDetail.save();

        res.json({ message: 'Semester deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// module in a given year and level
export const createModule = async (req, res) => {
    try {
        const { level, year } = req.params;
        const { moduleCode, moduleUnit, description, isActive, semester, department } = req.body;
        const academicDetail = await AcademicDetail.findOne({ level, year });
        if (!academicDetail) {
            return res.status(404).json({ message: 'Academic year and level not found' });
        }

        const newModule = {
            moduleCode,
            moduleUnit,
            description,
            isActive,
            semester: semester,
            department: department.map(dep => ({
                departmentInfo: new mongoose.Types.ObjectId(dep.departmentInfo),
                credit: dep.credit
            }))
        };

        academicDetail.modules.push(newModule);
        await academicDetail.save();

        res.status(201).json({ message: 'Module created successfully', module: newModule });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all modules for a given year and level
export const getModules = async (req, res) => {
    try {
        const { level, year } = req.params;

        const academicDetail = await AcademicDetail.findOne({ level, year }).populate('modules.semester').populate('modules.department.departmentInfo');
        if (!academicDetail) {
            return res.status(404).json({ message: 'Academic year and level not found' });
        }

        res.status(200).json(academicDetail.modules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a specific module by ID within a given year and level
export const getModuleById = async (req, res) => {
    try {
        const { level, year, moduleId } = req.params;

        const academicDetail = await AcademicDetail.findOne({ level, year });
        if (!academicDetail) {
            return res.status(404).json({ message: 'Academic year and level not found' });
        }

        const module = academicDetail.modules.id(moduleId);
        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        res.status(200).json(module);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a module by ID within a given year and level
export const updateModule = async (req, res) => {
    try {
        const { level, year, moduleId } = req.params;
        const updateData = req.body;

        const academicDetail = await AcademicDetail.findOne({ level, year });
        if (!academicDetail) {
            return res.status(404).json({ message: 'Academic year and level not found' });
        }

        const module = academicDetail.modules.id(moduleId);
        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        Object.assign(module, updateData);
        await academicDetail.save();

        res.status(200).json({ message: 'Module updated successfully', module });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a module by ID within a given year and level
export const deleteModule = async (req, res) => {
    try {
        const { level, year, moduleId } = req.params;

        const academicDetail = await AcademicDetail.findOne({ level, year });
        if (!academicDetail) {
            return res.status(404).json({ message: 'Academic year and level not found' });
        }

        const moduleIndex = academicDetail.modules.findIndex(m => m._id.toString() === moduleId);
        if (moduleIndex === -1) {
            return res.status(404).json({ message: 'Module not found' });
        }

        academicDetail.modules.splice(moduleIndex, 1);
        await academicDetail.save();

        res.status(200).json({ message: 'Module deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Courses
export const createCourse = async (req, res) => {
    const { level, year } = req.params; // From route params
    const { courseCode, courseName, description, isEntranceExam, department, module, instructors } = req.body;

    try {
        // Find the academic detail by level and year
        const academicDetail = await AcademicDetail.findOne({ level, year });
        if (!academicDetail) {
            return res.status(404).json({ message: 'Academic Detail not found for this level and year' });
        }

        // Create the new course object
        const newCourse = {
            courseCode,
            courseName,
            description,
            isEntranceExam,
            department,
            module,
            instructors
        };

        // Push the new course to the courses array of the academic detail
        academicDetail.courses.push(newCourse);
        await academicDetail.save();

        res.status(201).json({ message: 'Course created successfully', course: newCourse });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllCourses = async (req, res) => {
    const { level, year } = req.params;

    try {
        // Find the academic detail by level and year
        const academicDetail = await AcademicDetail.findOne({ level, year }).populate('courses.department.departmentInfo')
        .populate('courses.instructors');
        if (!academicDetail) {
            return res.status(404).json({ message: 'Academic Detail not found' });
        }

        res.status(200).json({ courses: academicDetail.courses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCourseByCode = async (req, res) => {
    const { level, year, courseCode } = req.params;

    try {
        // Find the academic detail by level and year
        const academicDetail = await AcademicDetail.findOne({ level, year }).populate('courses');
        if (!academicDetail) {
            return res.status(404).json({ message: 'Academic Detail not found' });
        }

        // Find the course by course code
        const course = academicDetail.courses.find(course => course.courseCode === courseCode);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.status(200).json({ course });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCourse = async (req, res) => {
    const { level, year, courseCode } = req.params;
    const { courseName, description, isEntranceExam, department, module, instructors } = req.body;

    try {
        // Find the academic detail by level and year
        const academicDetail = await AcademicDetail.findOne({ level, year }).populate('courses');
        if (!academicDetail) {
            return res.status(404).json({ message: 'Academic Detail not found' });
        }

        // Find the course by course code
        const courseIndex = academicDetail.courses.findIndex(course => course.courseCode === courseCode);
        if (courseIndex === -1) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Update the course details
        academicDetail.courses[courseIndex] = {
            ...academicDetail.courses[courseIndex],
            courseName,
            description,
            isEntranceExam,
            department,
            module,
            instructors
        };

        // Save the updated academic detail
        await academicDetail.save();

        res.status(200).json({ message: 'Course updated successfully', course: academicDetail.courses[courseIndex] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteCourse = async (req, res) => {
    const { level, year, courseCode } = req.params;

    try {
        // Find the academic detail by level and year
        const academicDetail = await AcademicDetail.findOne({ level, year });
        if (!academicDetail) {
            return res.status(404).json({ message: 'Academic Detail not found' });
        }

        // Remove the course from the courses array
        academicDetail.courses = academicDetail.courses.filter(course => course.courseCode !== courseCode);
        await academicDetail.save();

        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
