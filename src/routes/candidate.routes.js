import express from 'express';
import candidateController from '../controllers/CandidateController.js';
import authenticate from '../middleware/auth.middleware.js';
import { uploadCandidateDocuments } from '../middlewares/upload.middleware.js';

const router = express.Router();

// Route for public registration of a candidate and applying for an exam
router.post('/register', candidateController.registerForExam);

// Route for submitting documents, protected for authenticated users
router.post('/submit-documents', authenticate(), uploadCandidateDocuments, candidateController.submitDocuments);

// Route for updating marks, protected for admin only
router.post('/update', authenticate(['admin']), candidateController.updateMarks);

// Route to get a single candidate by ID, protected for authenticated users
router.get('/:id', authenticate(), candidateController.getCandidate);

// Route to get all candidates, protected for admin only
router.get('/', candidateController.getAllCandidates);

// Route to get document by type
router.get('/documents/:type', authenticate(), candidateController.getDocument);

// Route to update candidate by ID
router.put('/:id', candidateController.updateCandidate);

export default router; 