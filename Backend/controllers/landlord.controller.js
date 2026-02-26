import Landlord from "../database/models/landlord.model.js";
import Tenant from "../database/models/tenant.model.js";
import mongoose from "mongoose";
import { createTenant } from "../services/createTenant.service.js";
import { processRequest } from "../services/processRequest.service.js";
import { generateToken } from "../services/jwt.service.js";
import { comparePassword, hashPassword } from "../services/password.service.js";
import { sendReminders } from "../services/sendReminders.service.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ---------- Auth ----------
export const registerLandlord = async (req, res) => {
    const { name, password, phone } = req.body;
    console.log('[REGISTER] Received registration request:', { name, phone });
    
    if (!name || !password || !phone) {
        console.log('[REGISTER] ✗ Missing fields:', { name: !!name, password: !!password, phone: !!phone });
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        console.log('[REGISTER] Checking for existing landlord...');
        const existingLandlord = await Landlord.findOne({ phone });
        if (existingLandlord) {
            console.log('[REGISTER] ✗ Landlord already exists with phone:', phone);
            return res.status(400).json({ message: 'Landlord with this phone number already exists' });
        }

        console.log('[REGISTER] Hashing password...');
        const hashedPassword = await hashPassword(password);
        console.log('[REGISTER] Creating landlord in database...');
        const landlord = await Landlord.create({ name, password: hashedPassword, phone });
        console.log('[REGISTER] ✓ Landlord created successfully:', { id: landlord._id, name: landlord.name });
        
        res.status(201).json({
            message: 'Landlord registered successfully',
            landlord: { id: landlord._id, name: landlord.name, phone: landlord.phone }
        });
    } catch (err) {
        console.error('[REGISTER] ✗ Error registering landlord:', err.message);
        console.error(err.stack);
        res.status(500).json({ message: 'Error registering landlord', error: err.message });
    }
};

export const loginLandlord = async (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ message: 'Phone and password are required' });

    try {
        const landlord = await Landlord.findOne({ phone });
        if (!landlord) return res.status(400).json({ message: 'Landlord not found' });

        const isMatch = await comparePassword(password, landlord.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

        const token = generateToken({ id: landlord._id, phone: landlord.phone });
        res.status(200).json({
            token,
            landlord: { id: landlord._id, name: landlord.name, phone: landlord.phone },
            message: 'Landlord logged in successfully'
        });
    } catch (err) {
        res.status(500).json({ message: 'Error logging in landlord', error: err.message });
    }
};

// ---------- Tenant Management ----------
export const addTenant = async (req, res) => {
    const landlordId = req.user.id;
    const { phone, amount, date } = req.body;
    console.log('[ADD_TENANT] Request received:', { landlordId, phone, amount, date });
    
    if (!phone || !amount || !date) {
        console.log('[ADD_TENANT] ✗ Missing fields:', { phone: !!phone, amount: !!amount, date: !!date });
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        console.log('[ADD_TENANT] Creating tenant...');
        const result = await createTenant(landlordId, phone, amount, date);
        console.log('[ADD_TENANT] ✓ Tenant created successfully:', { tenantId: result.tenant._id });
        res.status(201).json({ message: 'Tenant created successfully', tenant: result.tenant });

        // Fire-and-forget; tenant creation should not fail because SMS failed.
        processRequest(phone, landlordId).catch((error) => {
            console.error(`[ADD_TENANT] Reminder trigger failed for ${phone}:`, error.message);
        });
    } catch (err) {
        console.error('[ADD_TENANT] ✗ Error adding tenant:', err.message);
        console.error(err.stack);
        res.status(500).json({ message: 'Error adding tenant', error: err.message });
    }
};

export const getTenants = async (req, res) => {
    try {
        const landlordId = req.user.id;
        const tenants = await Tenant.find({ landlordId });
        res.status(200).json({ tenants });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching tenants', error: err.message });
    }
};

export const getTenant = async (req, res) => {
    const landlordId = req.user.id;
    const { tenantId } = req.params;
    if (!isValidObjectId(tenantId)) return res.status(400).json({ message: 'Invalid tenantId' });

    try {
        const tenant = await Tenant.findOne({ _id: tenantId, landlordId });
        if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
        res.status(200).json({ tenant });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching tenant', error: err.message });
    }
};

export const updateTenant = async (req, res) => {
    const landlordId = req.user.id;
    const { tenantId } = req.params;
    if (!isValidObjectId(tenantId)) return res.status(400).json({ message: 'Invalid tenantId' });

    const updates = {};
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.amount !== undefined) updates.rentAmount = req.body.amount;
    if (req.body.rentAmount !== undefined) updates.rentAmount = req.body.rentAmount;
    if (req.body.date !== undefined) updates.dueDate = req.body.date;
    if (req.body.dueDate !== undefined) updates.dueDate = req.body.dueDate;
    if (req.body.status !== undefined) updates.status = req.body.status;

    try {
        const tenant = await Tenant.findOneAndUpdate(
            { _id: tenantId, landlordId },
            updates,
            { new: true, runValidators: true }
        );
        if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
        res.status(200).json({ message: 'Tenant updated successfully', tenant });
    } catch (err) {
        res.status(500).json({ message: 'Error updating tenant', error: err.message });
    }
};

export const deleteTenant = async (req, res) => {
    const landlordId = req.user.id;
    const { tenantId } = req.params;
    if (!isValidObjectId(tenantId)) return res.status(400).json({ message: 'Invalid tenantId' });

    try {
        const tenant = await Tenant.findOneAndDelete({ _id: tenantId, landlordId });
        if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
        res.status(200).json({ message: 'Tenant deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting tenant', error: err.message });
    }
};

// ---------- Rent Management ----------
export const markPaidRent = async (req, res) => {
    const landlordId = req.user.id;
    const { tenantId } = req.params;
    if (!isValidObjectId(tenantId)) return res.status(400).json({ message: 'Invalid tenantId' });

    try {
        const tenant = await Tenant.findOne({ _id: tenantId, landlordId });
        if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
        if (tenant.status === 'PAID') return res.status(400).json({ message: 'Rent already marked as paid' });

        tenant.status = 'PAID';
        tenant.paidAt = new Date();
        tenant.lastReminderSent = null;
        await tenant.save();
        res.status(200).json({ message: 'Rent marked as paid successfully', tenant });
    } catch (err) {
        res.status(500).json({ message: 'Error marking rent as paid', error: err.message });
    }
};

export const sendManualReminder = async (req, res) => {
    const landlordId = req.user.id;
    const { tenantId } = req.params;
    if (!isValidObjectId(tenantId)) return res.status(400).json({ message: 'Invalid tenantId' });

    try {
        const tenant = await Tenant.findOne({ _id: tenantId, landlordId });
        if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

        const result = await sendReminders(tenant.phone, tenant.landlordId);
        res.status(200).json({ message: 'Reminder sent successfully', result });
    } catch (err) {
        res.status(500).json({ message: 'Failed to send reminder', error: err.message });
    }
};

export const getOverdueTenants = async (req, res) => {
    try {
        const landlordId = req.user.id;
        const tenants = await Tenant.find({ landlordId, status: 'OVERDUE' });
        res.status(200).json({ tenants });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching overdue tenants', error: err.message });
    }
};

export const getUpcomingTenants = async (req, res) => {
    try {
        const landlordId = req.user.id;
        const today = new Date();
        const tenants = await Tenant.find({ landlordId, status: 'PENDING', dueDate: { $gte: today } });
        res.status(200).json({ tenants });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching upcoming tenants', error: err.message });
    }
};

// ---------- Dashboard / Account ----------
export const dashboardSummary = async (req, res) => {
    try {
        const landlordId = req.user.id;
        const total = await Tenant.countDocuments({ landlordId });
        const overdue = await Tenant.countDocuments({ landlordId, status: 'OVERDUE' });
        const paid = await Tenant.countDocuments({ landlordId, status: 'PAID' });
        const pending = await Tenant.countDocuments({ landlordId, status: 'PENDING' });

        res.status(200).json({ total, overdue, paid, pending });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching dashboard summary', error: err.message });
    }
};

export const updateProfile = async (req, res) => {
    const landlordId = req.user.id;
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;

    try {
        const landlord = await Landlord.findByIdAndUpdate(landlordId, updates, { new: true, runValidators: true });
        if (!landlord) return res.status(404).json({ message: 'Landlord not found' });
        res.status(200).json({
            message: 'Profile updated successfully',
            landlord: { id: landlord._id, name: landlord.name, phone: landlord.phone }
        });
    } catch (err) {
        res.status(500).json({ message: 'Error updating profile', error: err.message });
    }
};

export const changePassword = async (req, res) => {
    const landlordId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Old and new password are required' });

    try {
        const landlord = await Landlord.findById(landlordId);
        if (!landlord) return res.status(404).json({ message: 'Landlord not found' });

        const isMatch = await comparePassword(oldPassword, landlord.password);
        if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect' });

        landlord.password = await hashPassword(newPassword);
        await landlord.save();
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error changing password', error: err.message });
    }
};
