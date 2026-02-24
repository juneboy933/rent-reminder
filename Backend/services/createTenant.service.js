import Tenant from "../database/models/tenant.model.js";

const KENYA_PHONE_REGEX = /^\+254[0-9]{9}$/;

export const createTenant = async (landlordId,phone, amount, date) => {
    const validPhone = KENYA_PHONE_REGEX.test(phone);
    const validAmount = typeof amount === 'number' && amount > 0;
    const validDate = !isNaN(Date.parse(date));

    if (!validPhone || !validAmount || !validDate) {
        throw new Error('Invalid input data');
    }

    const tenant = await Tenant.create({
        phone,
        landlordId,
        rentAmount: amount,
        dueDate: new Date(date),
        status: 'PENDING'
    });

    return { message: 'Tenant created successfully', tenant };
};