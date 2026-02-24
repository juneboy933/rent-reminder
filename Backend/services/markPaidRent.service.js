import Tenant from "../database/models/tenant.model.js";

export const markPaidRent = async (phone, landlordId) => {
    const tenant = await Tenant.findOne({ phone, landlordId });

    if(!tenant){
        throw new Error('Tenant not found');
    }

    if (tenant.status === 'PAID') {
        return { message: 'Rent is already marked as paid' };
    }

    await Tenant.updateOne(
        { phone, landlordId }, 
        { 
            status: 'PAID', 
            lastReminderSent: null, 
            paidAt: new Date() 
        }
    );
    return { message: 'Rent marked as paid successfully' };
};