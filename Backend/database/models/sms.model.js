import mongoose from 'mongoose';

const smsSchema = new mongoose.Schema({
  landlordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Landlord',
    required: true
  },
  phone: String,
  message: String,
  messageId: String,  // Africa's Talking message ID
  status: { type: String, default: 'SENT' }, // SENT, DELIVERED, FAILED
  sentAt: { type: Date, default: Date.now },
  deliveredAt: Date
});

smsSchema.index({ landlordId: 1, sentAt: -1 });

const SMSLog = mongoose.model('SMSLog', smsSchema);
export default SMSLog;
