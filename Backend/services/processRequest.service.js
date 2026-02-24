import Tenant from "../database/models/tenant.model.js";
import { sendReminders } from "./sendReminders.service.js";

export const processRequest = async (phone, landlordId) => {
    try {
        const tenant = await Tenant.findOne({
            phone,
            landlordId,
            status: 'PENDING'
        });
    
        if (!tenant) {
            throw new Error('Tenant not found or rent already paid');
        }
    
        return await sendReminders(phone, landlordId);
    } catch (err) {
        console.error(`Failed to process request for ${phone}`, err.message);
        throw err;
    }
};