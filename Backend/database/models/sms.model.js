import mongoose from 'mongoose';

const smsSchema = new mongoose.Schema({
  phone: String,
  message: String,
  messageId: String,  // Africa's Talking message ID
  status: { type: String, default: 'SENT' }, // SENT, DELIVERED, FAILED
  sentAt: { type: Date, default: Date.now },
  deliveredAt: Date
});

const SMSLog = mongoose.model('SMSLog', smsSchema);
export default SMSLog;