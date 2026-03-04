import Landlord from "../database/models/landlord.model.js";
import { initiateSTKPush } from "../services/mpesa.service.js";

export const initiatePayment = async (req, res)=> {
    const { phoneNumber, amount } = req.body;
    const landlordId = req.user.id;

    try {
        const landlord = await Landlord.findById(landlordId);
        if (!landlord) {
            return res.status(404).json({ message: 'Landlord not found' });
        }

        const response = await initiateSTKPush(phoneNumber, amount);
        res.status(200).json({ message: 'STK Push initiated', response });
    } catch (error) {
        console.error('[MPESA_CONTROLLER] Error:', error.message);
        res.status(500).json({ message: 'Error initiating payment', error: error.message });
    }
};

export const mpesaCallback = async (req, res) => {
    const callbackData = req.body;
    console.log('Received M-Pesa callback:', JSON.stringify(callbackData, null, 2));
    return res.status(200).json({ resultCode: 0, resultDesc: 'Callback received successfully' });
};