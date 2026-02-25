import express from "express";
import SMSLog from "../database/models/sms.model.js";
import { partnerAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * GET /sms-logs
 * Returns all SMS logs
 */
router.get("/", partnerAuth, async (req, res) => {
    try {
        const logs = await SMSLog.find({ landlordId: req.user.id }).sort({ sentAt: -1 }); // latest first
        res.status(200).json({ message: "SMS logs fetched successfully", logs });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch SMS logs", error: err.message });
    }
});

export default router;
