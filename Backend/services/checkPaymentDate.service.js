import Tenant from "../database/models/tenant.model.js";

export const checkPaymentDate = async (phone, landlordId) => {
    const tenant = await Tenant.findOne({ phone, landlordId });

    if (!tenant) {
        throw new Error('Tenant not found');
    }

    const paymentDate = tenant.dueDate;

    return paymentDate;
}