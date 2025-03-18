import BaseController from './BaseController.js';
import Department from '../models/Departement.js';
import createError from 'http-errors';

class DepartmentController extends BaseController {
    constructor() {
        super(Department);
    }

    async getAllDepartments(req, res, next) {
        try {
            const departments = await Department.find({})
                .populate('headOfDepartment', 'name email')
                .populate('createdBy', 'name email')
                .populate('coursesList', 'courseName courseCode');

            // console.log('Fetched departments:', departments);
            res.json(departments);
        } catch (error) {
            console.error('Error fetching departments:', error);
            next(this.handleError(error, 'fetching all departments'));
        }
    }

    async getDepartment(req, res, next) {
        try {
            const department = await Department.findById(req.params.id);
            if (!department) {
                throw createError(404, 'Department not found');
            }
            res.json(department);
        } catch (error) {
            next(this.handleError(error, 'fetching department'));
        }
    }

    async createDepartment(req, res) {
        const { name, code, description, headOfDepartment } = req.body;
        console.log(headOfDepartment)
        // Validate required fields
        if (!name || !code) {
            return res.status(400).json({ message: 'Name and code are required' });
        }

        try {
            // Create a new department
            const newDepartment = new Department({
                name,
                code,
                description,
                headOfDepartment,
                createdBy: "67d4107246023123ea84d3ce"
            });

            await newDepartment.save();
            return res.status(201).json(newDepartment);
        } catch (err) {
            console.error('Error creating department:', err);
            return res.status(500).json({ message: 'Failed to create department' });
        }
    }

    async updateDepartment(req, res, next) {
        const { id } = req.params;
        const { name, code, description, headOfDepartment } = req.body;

        // Validate required fields
        if (!name || !code) {
            return res.status(400).json({ message: 'Name and code are required' });
        }

        try {
            const department = await Department.findById(id);
            if (!department) {
                return res.status(404).json({ message: 'Department not found' });
            }
            console.log(department)

            department.name = name || department.name;
            department.code = code || department.code;
            department.description = description || department.description;
            department.headOfDepartment = headOfDepartment || department.headOfDepartment;
            department.createdBy = "67d4107246023123ea84d3ce" || department.createdBy;

            await department.save();
            return res.status(200).json(department);
        } catch (err) {
            console.error('Error updating department:', err);
            return res.status(500).json({ message: 'Failed to update department' });
        }
    }

    async deleteDepartment(req, res, next) {
        try {
            const deletedDepartment = await Department.findByIdAndDelete(req.params.id);
            if (!deletedDepartment) {
                throw createError(404, 'Department not found');
            }
            res.status(204).send();
        } catch (error) {
            next(this.handleError(error, 'deleting department'));
        }
    }
}

export default new DepartmentController(); 