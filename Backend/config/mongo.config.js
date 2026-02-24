import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
    console.error("MONGO_URI is not defined in environment variables");
    process.exit(1);
}

// Just call connect with URI only
export const connectDB = mongoose.connect(mongoURI);