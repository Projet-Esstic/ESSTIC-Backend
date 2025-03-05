import express from 'express';
import PersonnelController from '../controllers/PersonnelController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { uploadCandidateDocuments } from '../middlewares/upload.middleware.js';

const router = express.Router();

// Register routes for PersonnelController

// Route to get all personnel (Admin only)
// router.get('/all', authenticate, authorizeRoles(['admin']), PersonnelController.getAllPersonnel);
router.get('/', authenticate, authorizeRoles(['admin']),  PersonnelController.getAllPersonnel);
// Route to get a single personnel by ID
router.get('/:id', authenticate, PersonnelController.getPersonnel);

// Route to create a new personnel
router.post('/register', authenticate, authorizeRoles(['admin']), PersonnelController.registerPersonnel);

// Route to update personnel details (Admin only)
router.put('/:id', authenticate, authorizeRoles(['admin']), PersonnelController.updatePersonnel);

// Route to submit documents for a personnel
router.post('/:id/submit-documents', authenticate, PersonnelController.submitDocuments);

// Route to get specific document for a personnel
router.get('/:id/document/:type', authenticate, PersonnelController.getDocument);

export default router;
