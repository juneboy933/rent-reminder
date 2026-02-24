import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
    },
    landlordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Landlord',
        required: true
    },
    rentAmount: {
        type: Number,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'PAID', 'OVERDUE'],
        default: 'PENDING'
    },
    lastReminderSent: {
        type: Date,
        default: null
    },
    paidAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

tenantSchema.index({ landlordId: 1, phone: 1 }, { unique: true });

const Tenant = mongoose.model('Tenant', tenantSchema);

export default Tenant;