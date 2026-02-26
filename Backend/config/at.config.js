import africastalking from "africastalking";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.AT_API_KEY?.trim();
const username = process.env.AT_USERNAME?.trim();

if (!apiKey || !username) {
    throw new Error("Missing Africa's Talking credentials in environment variables (AT_API_KEY or AT_USERNAME)");
}

const at = africastalking({
    apiKey,
    username
});

export const sms = at.SMS;
export const voice = at.VOICE;