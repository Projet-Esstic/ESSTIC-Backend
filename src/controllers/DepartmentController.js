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
                
            console.log('Fetched departments:', departments);
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

    async createDepartment(req, res, next) {
        try {
            const newDepartment = new Department(req.body);
            await newDepartment.save();
            res.status(201).json(newDepartment);
        } catch (error) {
            next(this.handleError(error, 'creating department'));
        }
    }

    async updateDepartment(req, res, next) {
        try {
            const updatedDepartment = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedDepartment) {
                throw createError(404, 'Department not found');
            }
            res.json(updatedDepartment);
        } catch (error) {
            next(this.handleError(error, 'updating department'));
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