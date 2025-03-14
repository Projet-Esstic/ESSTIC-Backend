import express from 'express';
import router from express.Router();
import RequestController from '../controllers/RequestController';

router.post('/requests', RequestController.createRequest);
router.get('/requests', RequestController.getAllRequests);
router.get('/requests/:id', RequestController.getRequestById);
router.put('/requests/:id', RequestController.updateRequest);
router.delete('/requests/:id', RequestController.deleteRequest);

module.exports = router; 