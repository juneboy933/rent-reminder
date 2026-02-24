import mongoose from 'mongoose';

const landlordSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Landlord = mongoose.model('Landlord', landlordSchema);

export default Landlord;