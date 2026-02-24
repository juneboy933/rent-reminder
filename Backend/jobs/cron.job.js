import cron from 'node-cron';
import Tenant from '../database/models/tenant.model.js';
import { sendReminders } from '../services/sendReminders.service.js';

cron.schedule('0 8 * * *', async () => {
    const tenants = await Tenant.find({ status: { $in: ['PENDING', 'OVERDUE'] } });

    for (const tenant of tenants){
        try {
            await sendReminders(tenant.phone, tenant.landlordId);
        } catch (err) {
            console.error(`Failed for ${tenant.phone}`, err.message);
        }
    }
});