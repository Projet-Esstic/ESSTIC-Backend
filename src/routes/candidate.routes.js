import express from 'express';
import candidateController from '../controllers/CandidateController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { uploadCandidateDocuments } from '../middlewares/upload.middleware.js';

const router = express.Router();

// Route for public registration of a candidate and applying for an exam
//router.post('/register', uploadCandidateDocuments(), candidateController.registerForExam);

// Route for submitting documents, protected for authenticated users
router.post('/submit-documents', authenticate, uploadCandidateDocuments(), candidateController.submitDocuments);
router.post('/register', /*uploadDocuments,*/ candidateController.registerForExam);

// Route for submitting documents, protected for authenticated users
router.post('/submit-documents', authenticate, /*uploadDocuments,*/ candidateController.submitDocuments);

// Route for updating marks, protected for admin only
router.put('/update',
    //  authenticate, authorizeRoles(['admin']),
      candidateController.updateMarks);

// Route to get a single candidate by ID, protected for authenticated users
router.get('/:id', authenticate, candidateController.getCandidate);

// Route to get all candidates, protected for admin only
router.get('/', 
    // authenticate, authorizeRoles(['admin']),
     candidateController.getAllCandidates);

// Route to get document by type, protected for authenticated users
router.get('/documents/:type', authenticate, candidateController.getDocument);

// Route to update candidate by ID, protected for authenticated users
router.put('/:id', candidateController.updateCandidate);

export default router;
