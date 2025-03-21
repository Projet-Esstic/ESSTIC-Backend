import express from 'express';
import PersonnelController from '../controllers/PersonnelController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { uploadCandidateDocuments } from '../middlewares/upload.middleware.js';

const router = express.Router();

// Register routes for PersonnelController

// Route to get all personnel (Admin only)
// router.get('/all', authenticate, authorizeRoles(['admin']), PersonnelController.getAllPersonnel);
router.get('/',  PersonnelController.getAllPersonnel);
// Route to get a single personnel by ID
router.get('/:id', PersonnelController.getPersonnel);

// Route to create a new personnel
router.post('/register', PersonnelController.registerPersonnel);
router.post('/register-multiple', PersonnelController.registerManyPersonnel);
// Route to update personnel details (Admin only)
router.put('/:id',  PersonnelController.updatePersonnel);

// Route to submit documents for a personnel
router.post('/:id/submit-documents', authenticate, PersonnelController.submitDocuments);

// Route to get specific document for a personnel
router.get('/:id/document/:type', authenticate, PersonnelController.getDocument);

// Gestion des emplois du temps
router.post('/:id/schedule', authenticate, authorizeRoles(['admin']), PersonnelController.createSchedule);
router.put('/:id/schedule', authenticate, authorizeRoles(['admin']), PersonnelController.updateSchedule);
router.get('/:id/schedule', authenticate, PersonnelController.getSchedule);

// Suivi des présences et des congés
router.post('/:id/attendance', authenticate, PersonnelController.markAttendance);
router.get('/:id/attendance', authenticate, PersonnelController.getAttendance);
router.post('/:id/leave', authenticate, PersonnelController.requestLeave);
router.put('/:id/leave/:leaveId', authenticate, authorizeRoles(['admin']), PersonnelController.approveLeave);

// Assigner un enseignant à des matières
router.post('/:id/assign-subjects', authenticate, authorizeRoles(['admin']), PersonnelController.assignSubjects);

// Suspendre un enseignant
router.put('/:id/suspend', authenticate, authorizeRoles(['admin']), PersonnelController.suspendTeacher);

// Mettre à jour le rôle d'un enseignant
router.put('/:id/update-role', authenticate, authorizeRoles(['admin']), PersonnelController.updateTeacherRole);

export default router;
