import express from 'express';
import { addTenant, changePassword, dashboardSummary, deleteTenant, getOverdueTenants, getTenant, getTenants, getUpcomingTenants, loginLandlord, markPaidRent, registerLandlord, sendManualReminder, updateProfile, updateTenant } from '../controllers/landlord.controller.js';
import { partnerAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes for landlord registration and login
router.post('/register', registerLandlord);
router.post('/login', loginLandlord);

// Tenant management route
router.post('/tenants', partnerAuth, addTenant);
router.get('/tenants', partnerAuth, getTenants);
router.get('/tenants/overdue', partnerAuth, getOverdueTenants);
router.get('/tenants/upcoming', partnerAuth, getUpcomingTenants);
router.get('/tenants/:tenantId', partnerAuth, getTenant);
router.put('/tenants/:tenantId', partnerAuth, updateTenant);
router.delete('/tenants/:tenantId', partnerAuth, deleteTenant);

// Rent management
router.post('/tenants/:tenantId/mark-paid', partnerAuth, markPaidRent);
router.post('/tenants/:tenantId/reminder', partnerAuth, sendManualReminder);

// Dashboard / Landlord account
router.get('/dashboard/summary', partnerAuth, dashboardSummary);
router.put('/profile', partnerAuth, updateProfile);
router.put('/change-password', partnerAuth, changePassword);

export default router;
