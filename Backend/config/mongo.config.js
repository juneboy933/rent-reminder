import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const mongoURI = process.env.MONGO_URI;

console.log('[MONGO] Loading environment variables...');
console.log('[MONGO] MONGO_URI:', mongoURI ? `${mongoURI.substring(0, 50)}...` : 'NOT SET');

if (!mongoURI) {
    console.error("[MONGO] ✗ MONGO_URI is not defined in environment variables");
    process.exit(1);
}

console.log('[MONGO] Connecting to MongoDB...');
// Just call connect with URI only
export const connectDB = mongoose
    .connect(mongoURI)
    .then(() => {
        console.log('[MONGO] ✓ Successfully connected to MongoDB');
        return true;
    })
    .catch((err) => {
        console.error('[MONGO] ✗ Failed to connect to MongoDB:', err.message);
        throw err;
    });