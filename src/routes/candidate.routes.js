import express from 'express';
import candidateController from '../controllers/CandidateController.js';
<<<<<<< HEAD
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { uploadCandidateDocuments } from '../middlewares/upload.middleware.js';
=======
import authenticate from '../middleware/auth.middleware.js';
//import uploadDocuments from '../middlewares/upload.middleware.js';
>>>>>>> a1fab2b (finish the grading system and the behavior system)

const router = express.Router();

// Route for public registration of a candidate and applying for an exam
<<<<<<< HEAD
router.post('/register', uploadCandidateDocuments(), candidateController.registerForExam);

// Route for submitting documents, protected for authenticated users
router.post('/submit-documents', authenticate, uploadCandidateDocuments, candidateController.submitDocuments);
=======
router.post('/register', /*uploadDocuments,*/ candidateController.registerForExam);

// Route for submitting documents, protected for authenticated users
router.post('/submit-documents', authenticate(), /*uploadDocuments,*/ candidateController.submitDocuments);
>>>>>>> a1fab2b (finish the grading system and the behavior system)

// Route for updating marks, protected for admin only
router.post('/update', authenticate, authorizeRoles(['admin']), candidateController.updateMarks);

// Route to get a single candidate by ID, protected for authenticated users
router.get('/:id', authenticate, candidateController.getCandidate);

// Route to get all candidates, protected for admin only
router.get('/', authenticate, authorizeRoles(['admin']), candidateController.getAllCandidates);

// Route to get document by type, protected for authenticated users
router.get('/documents/:type', authenticate, candidateController.getDocument);

// Route to update candidate by ID, protected for authenticated users
router.put('/:id', authenticate, candidateController.updateCandidate);

export default router;
