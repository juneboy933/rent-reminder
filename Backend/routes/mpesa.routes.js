import express from 'express';
import { partnerAuth } from '../middlewares/auth.middleware.js';
import { initiatePayment, mpesaCallback } from '../controllers/mpesa.controller.js';

const router = express.Router();

router.post('/stkpush', partnerAuth, initiatePayment);
router.post('/callback', express.json(), mpesaCallback);

export default router;