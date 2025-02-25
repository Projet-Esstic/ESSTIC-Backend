const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController'); // Adjust the path as necessary

router.post('/create', candidateController.createCandidate); // Create a new candidate
router.put('/update/:id', candidateController.updateCandidate); // Update a candidate by ID
router.get('/get-all', candidateController.getAllCandidates); // Retrieve all candidates
router.get('/get/:id', candidateController.getCandidateById); // Retrieve a candidate by ID
router.delete('/delete/:id', candidateController.deleteCandidate); // Delete a candidate by ID

module.exports = router;
