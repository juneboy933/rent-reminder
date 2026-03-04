import axios from 'axios';
import dotenv from 'dotenv';
import moment from 'moment';

dotenv.config();

const getToken = async () => {
    const { MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_BASE_URL } = process.env;
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');

    try {
        const response = await axios.get(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
            headers: {
                Authorization: `Basic ${auth}`
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('[MPESA] Token generation failed:', error.response?.data || error.message);
        throw new Error(`Token generation failed: ${error.response?.data?.error_description || error.message}`);
    }
};

export const initiateSTKPush = async (phoneNumber, amount) => {
    const { MPESA_SHORT_CODE, MPESA_BASE_URL, MPESA_CALLBACK_URL, MPESA_PASSKEY } = process.env;

    // helper: normalize MSISDN to 2547XXXXXXXX format (no leading +)
    const normalizeMsisdn = (phone) => {
        if (!phone) return phone;
        let p = String(phone).trim();
        if (p.startsWith('+')) p = p.slice(1);
        // If number starts with 0 (e.g., 0712...), convert to 254
        if (p.startsWith('0') && p.length === 10) p = `254${p.slice(1)}`;
        // If starts with 7 and length 9, assume local and prepend 254
        if (/^7\d{8}$/.test(p)) p = `254${p}`;
        return p;
    };

    const msisdn = normalizeMsisdn(phoneNumber);

    const maxRetries = 3;
    const baseDelayMs = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log('[MPESA] Initiating STK push (attempt', attempt, ') for:', { phoneNumber: msisdn, amount });
            const token = await getToken();
            console.log('[MPESA] Token obtained successfully');

            const timestamp = moment().format('YYYYMMDDHHmmss');
            if (!MPESA_PASSKEY) console.warn('[MPESA] Warning: MPESA_PASSKEY is not set in environment (using empty passkey)');
            const password = Buffer.from(`${MPESA_SHORT_CODE}${MPESA_PASSKEY || ''}${timestamp}`).toString('base64');

            const payload = {
                BusinessShortCode: MPESA_SHORT_CODE,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: amount,
                PartyA: msisdn,
                PartyB: MPESA_SHORT_CODE,
                PhoneNumber: msisdn,
                CallBackURL: MPESA_CALLBACK_URL,
                AccountReference: 'RentPayment',
                TransactionDesc: 'Payment for rent'
            };

            console.log('[MPESA] Payload:', JSON.stringify(payload, null, 2));

            const response = await axios.post(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                timeout: 15000
            });

            console.log('[MPESA] STK push response:', response.data);
            return response.data;
        } catch (error) {
            const info = {
                attempt,
                message: error.message,
                code: error.code,
                responseData: error.response?.data,
                config: error.config && { url: error.config.url, method: error.config.method }
            };
            console.error('[MPESA] STK push failed:', info);

            // If this is the last attempt, throw the error upward
            if (attempt === maxRetries) {
                throw new Error(`STK Push failed: ${error.response?.data?.errorMessage || error.message}`);
            }

            // For transient/server errors, wait and retry (exponential backoff)
            const shouldRetry = error.code === 'ECONNABORTED' || error.code === 'ERR_BAD_RESPONSE' || (error.response && error.response.status >= 500);
            if (!shouldRetry) {
                throw new Error(`STK Push failed: ${error.response?.data?.errorMessage || error.message}`);
            }

            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            console.log(`[MPESA] Transient error detected, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise((r) => setTimeout(r, delay));
        }
    }
};