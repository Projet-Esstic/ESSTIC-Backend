import express from 'express';
const router = express.Router();
import { createRequest, getAllRequests, getRequestById, updateRequest, deleteRequest } from '../controllers/RequestController.js';

router.post('/requests', createRequest);
router.get('/requests', getAllRequests);
router.get('/requests/:id', getRequestById);
router.put('/requests/:id', updateRequest);
router.delete('/requests/:id', deleteRequest);

export default router; 