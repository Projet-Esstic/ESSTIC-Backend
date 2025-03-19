import CourseModule from '../models/CourseModule.js';
import { validateObjectId } from '../utils/validation.js';

export const courseModuleController = {
    // Create a new course module
    create: async (req, res) => {
        try {
            const newModule = new CourseModule(req.body);
            const savedModule = await newModule.save();
            res.status(201).json(savedModule);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Get all course modules
    getAll: async (req, res) => {
        try {
            const modules = await CourseModule.find()
                .populate('courses.course');
            res.status(200).json(modules);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get a single course module by ID
    getById: async (req, res) => {
        try {
            if (!validateObjectId(req.params.id)) {
                return res.status(400).json({ message: 'Invalid module ID' });
            }

            const module = await CourseModule.findById(req.params.id)
                .populate('courses.course');
            
            if (!module) {
                return res.status(404).json({ message: 'Module not found' });
            }
            
            res.status(200).json(module);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Update a course module
    update: async (req, res) => {
        try {
            if (!validateObjectId(req.params.id)) {
                return res.status(400).json({ message: 'Invalid module ID' });
            }

            const updatedModule = await CourseModule.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            ).populate('courses.course');

            if (!updatedModule) {
                return res.status(404).json({ message: 'Module not found' });
            }

            res.status(200).json(updatedModule);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Delete a course module
    delete: async (req, res) => {
        try {
            if (!validateObjectId(req.params.id)) {
                return res.status(400).json({ message: 'Invalid module ID' });
            }

            const deletedModule = await CourseModule.findByIdAndDelete(req.params.id);
            
            if (!deletedModule) {
                return res.status(404).json({ message: 'Module not found' });
            }

            res.status(200).json({ message: 'Module deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Add a course to a module
    addCourse: async (req, res) => {
        try {
            if (!validateObjectId(req.params.moduleId)) {
                return res.status(400).json({ message: 'Invalid module ID' });
            }

            const module = await CourseModule.findById(req.params.moduleId);
            if (!module) {
                return res.status(404).json({ message: 'Module not found' });
            }

            module.courses.push(req.body);
            const updatedModule = await module.save();
            
            await updatedModule.populate('courses.course');
            res.status(200).json(updatedModule);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Remove a course from a module
    removeCourse: async (req, res) => {
        try {
            if (!validateObjectId(req.params.moduleId) || !validateObjectId(req.params.courseId)) {
                return res.status(400).json({ message: 'Invalid ID provided' });
            }

            const module = await CourseModule.findById(req.params.moduleId);
            if (!module) {
                return res.status(404).json({ message: 'Module not found' });
            }

            module.courses = module.courses.filter(
                course => course._id.toString() !== req.params.courseId
            );

            const updatedModule = await module.save();
            await updatedModule.populate('courses.course');
            res.status(200).json(updatedModule);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}; 