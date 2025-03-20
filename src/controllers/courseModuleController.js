import CourseModule from '../models/CourseModule.js'; // Adjust the path as needed
import Course from '../models/Course.js'; // Assuming you have a `Course` model

// Create a new CourseModule
export const createCourseModule = async (req, res) => {
    try {
        delete req.body?._id
        const newModule = new CourseModule(req.body);
        console.log(req.body);
        await newModule.save();
        res.status(201).json(newModule);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all CourseModules
export const getAllCourseModules = async (req, res) => {
    try {
        const { level, year } = req.params;
        const modules = await CourseModule.find({ level, year })
            .populate('semester')
            .populate('department.departmentInfo');

        res.status(200).json(modules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get CourseModule by ID
export const getCourseModuleById = async (req, res) => {
    try {
        const module = await CourseModule.findById(req.params.id).populate('semester').populate('department.departmentInfo');
        if (!module) {
            return res.status(404).json({ message: 'CourseModule not found' });
        }
        res.status(200).json(module);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update CourseModule by ID
export const updateCourseModule = async (req, res) => {
    try {
        const updatedModule = await CourseModule.findOneAndUpdate( { _id: req.params.id }, req.body, { new: true });
        if (!updatedModule) {
            return res.status(404).json({ message: 'CourseModule not found' });
        }
        res.status(200).json(updatedModule);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete CourseModule by ID
export const deleteCourseModule = async (req, res) => {
    try {
        const deletedModule = await CourseModule.findOneAndDelete({ _id: req.params.id });
        if (!deletedModule) {
            return res.status(404).json({ message: 'CourseModule not found' });
        }
        res.status(200).json({ message: 'CourseModule deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Duplicate a module for the next academic year
export const duplicateModuleForNextYear = async (req, res) => {
    try {
        const { moduleCode, year } = req.body;  // You should pass `moduleCode` and `year` in the request body

        // Find the module for the given year
        const module = await CourseModule.findOne({ moduleCode, year });
        if (!module) {
            return res.status(404).json({ message: 'Module not found for the given year' });
        }

        // Duplicate the module and assign the next year
        const nextYear = (parseInt(year.split('-')[1]) + 1).toString() + '-' + (parseInt(year.split('-')[0]) + 1).toString();

        const newModule = new CourseModule({
            ...module.toObject(),
            year: nextYear,  // Set the new academic year
            _id: undefined  // Clear the _id to create a new document
        });

        await newModule.save();
        res.status(201).json(newModule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add Course to the Module
export const addCourseToModule = async (req, res) => {
    try {
        const { moduleId, courseData } = req.body;  // You should pass `moduleId` and `courseData` in the request body

        // Find the CourseModule by ID
        const module = await CourseModule.findById(moduleId);
        if (!module) {
            return res.status(404).json({ message: 'CourseModule not found' });
        }

        // Add courseData to Course and assign the module._id
        const newCourse = new Course({
            ...courseData,
            module: moduleId  // Assign the module._id to the course
        });

        await newCourse.save();
        res.status(201).json(newCourse);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
