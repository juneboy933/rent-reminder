import express from "express";
import SMSLog from "../database/models/sms.model.js";

const router = express.Router();

/**
 * GET /sms-logs
 * Returns all SMS logs
 */
router.get("/", async (req, res) => {
    try {
        const logs = await SMSLog.find().sort({ sentAt: -1 }); // latest first
        res.status(200).json({ message: "SMS logs fetched successfully", logs });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch SMS logs", error: err.message });
    }
});

export default router;