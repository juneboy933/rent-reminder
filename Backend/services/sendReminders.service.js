import { sms } from "../config/at.config.js";
import Landlord from "../database/models/landlord.model.js";
import SMSLog from "../database/models/sms.model.js";
import Tenant from "../database/models/tenant.model.js";
import { checkPaymentDate } from "./checkPaymentDate.service.js";

export const sendReminders = async (phone, landlordId) => {
    if (!phone.startsWith('+254')) throw new Error('Phone must start with +254');

    const paymentDate = await checkPaymentDate(phone, landlordId);
    const currentDate = new Date();
    const startOfDay = d => { const dt = new Date(d); dt.setHours(0,0,0,0); return dt; };

    const payment = startOfDay(paymentDate);
    const today = startOfDay(currentDate);
    const isSameDay = (d1,d2) => d1.toDateString() === d2.toDateString();

    const tenant = await Tenant.findOne({ phone, landlordId });
    const landlord = await Landlord.findById(landlordId);
    if (!tenant) throw new Error('Tenant not found');

    const amount = tenant.rentAmount;

    try {
        if (tenant.lastReminderSent && isSameDay(tenant.lastReminderSent, currentDate)){
             await SMSLog.create({
                landlordId,
                phone,
                message: `Reminder already sent today`,
                messageId: null,
                status: 'SKIPPED',
                sentAt: new Date()
            });
            return { message: 'Reminder already sent today' };
        }

        let messageTxt;
        if (payment > today)
            messageTxt = `Hi, your rent payment of KES.${amount} to ${landlord.name} is due on ${paymentDate.toDateString()}.`;
        else if (isSameDay(payment, today))
            messageTxt = `Hi, your rent payment of KES.${amount} to ${landlord.name} is due today. Please make the payment to avoid any late fees.`;
        else
            messageTxt = `Hi, your rent payment of KES.${amount} to ${landlord.name} was due on ${paymentDate.toDateString()}. Please make the payment immediately.`;

        const result = await sms.send({ to: phone, message: messageTxt });

        await SMSLog.insertMany(
            result.SMSMessageData.Recipients.map(recipient => ({
                landlordId,
                phone: recipient.number,
                message: messageTxt,
                messageId: recipient.messageId,
                status: recipient.status
            }))
        );

        const updateFields = { lastReminderSent: new Date() };
        if (payment < today) updateFields.status = 'OVERDUE';
        await Tenant.updateOne({ phone, landlordId }, updateFields);

        return { message: 'Reminder sent successfully', result };

    } catch (err) {
        throw new Error(`Error sending reminder: ${err.message}`);
    }
};
