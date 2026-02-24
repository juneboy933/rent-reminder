import Landlord from "../database/models/landlord.model.js";
import Tenant from "../database/models/tenant.model.js";
import { createTenant } from "../services/createTenant.service.js";
import { processRequest } from "../services/processRequest.service.js";
import { generateToken } from "../services/jwt.service.js";
import { comparePassword, hashPassword } from "../services/password.service.js";
import { sendReminders } from "../services/sendReminders.service.js";

// ---------- Auth ----------
export const registerLandlord = async (req, res) => {
    const { name, password, phone } = req.body;
    if (!name || !password || !phone) return res.status(400).json({ message: 'All fields are required' });

    try {
        const existingLandlord = await Landlord.findOne({ phone });
        if (existingLandlord) return res.status(400).json({ message: 'Landlord with this phone number already exists' });

        const hashedPassword = await hashPassword(password);
        const landlord = await Landlord.create({ name, password: hashedPassword, phone });
        res.status(201).json({ message: 'Landlord registered successfully', landlord });
    } catch (err) {
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
    if (!phone || !amount || !date) return res.status(400).json({ message: 'All fields are required' });

    try {
        const tenant = await createTenant(landlordId, phone, amount, date);
        res.status(201).json({ message: 'Tenant created successfully', tenant });

        // Trigger reminder process for this tenant
        await processRequest(phone, landlordId);
    } catch (err) {
        res.status(500).json({ message: 'Error adding tenant', error: err.message });
    }
};

export const getTenants = async (req, res) => {
    const landlordId = req.user.id;
    const tenants = await Tenant.find({ landlordId });
    res.status(200).json({ tenants });
};

export const getTenant = async (req, res) => {
    const { tenantId } = req.params;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.status(200).json({ tenant });
};

export const updateTenant = async (req, res) => {
    const { tenantId } = req.params;
    const updates = req.body;
    const tenant = await Tenant.findByIdAndUpdate(tenantId, updates, { new: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.status(200).json({ message: 'Tenant updated successfully', tenant });
};

export const deleteTenant = async (req, res) => {
    const { tenantId } = req.params;
    const tenant = await Tenant.findByIdAndDelete(tenantId);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.status(200).json({ message: 'Tenant deleted successfully' });
};

// ---------- Rent Management ----------
export const markPaidRent = async (req, res) => {
    const { tenantId } = req.params;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    if (tenant.status === 'PAID') return res.status(400).json({ message: 'Rent already marked as paid' });

    tenant.status = 'PAID';
    tenant.paidAt = new Date();
    tenant.lastReminderSent = null;
    await tenant.save();
    res.status(200).json({ message: 'Rent marked as paid successfully', tenant });
};

export const sendManualReminder = async (req, res) => {
    const { tenantId } = req.params;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    try {
        const result = await sendReminders(tenant.phone, tenant.landlordId);
        res.status(200).json({ message: 'Reminder sent successfully', result });
    } catch (err) {
        res.status(500).json({ message: 'Failed to send reminder', error: err.message });
    }
};

export const getOverdueTenants = async (req, res) => {
    const landlordId = req.user.id;
    const tenants = await Tenant.find({ landlordId, status: 'OVERDUE' });
    res.status(200).json({ tenants });
};

export const getUpcomingTenants = async (req, res) => {
    const landlordId = req.user.id;
    const today = new Date();
    const tenants = await Tenant.find({ landlordId, status: 'PENDING', dueDate: { $gte: today } });
    res.status(200).json({ tenants });
};

// ---------- Dashboard / Account ----------
export const dashboardSummary = async (req, res) => {
    const landlordId = req.user.id;
    const total = await Tenant.countDocuments({ landlordId });
    const overdue = await Tenant.countDocuments({ landlordId, status: 'OVERDUE' });
    const paid = await Tenant.countDocuments({ landlordId, status: 'PAID' });
    const pending = await Tenant.countDocuments({ landlordId, status: 'PENDING' });

    res.status(200).json({ total, overdue, paid, pending });
};

export const updateProfile = async (req, res) => {
    const landlordId = req.user.id;
    const updates = req.body;
    const landlord = await Landlord.findByIdAndUpdate(landlordId, updates, { new: true });
    res.status(200).json({ message: 'Profile updated successfully', landlord });
};

export const changePassword = async (req, res) => {
    const landlordId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    const landlord = await Landlord.findById(landlordId);

    if (!landlord) return res.status(404).json({ message: 'Landlord not found' });
    const isMatch = await comparePassword(oldPassword, landlord.password);
    if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect' });

    landlord.password = await hashPassword(newPassword);
    await landlord.save();
    res.status(200).json({ message: 'Password updated successfully' });
};