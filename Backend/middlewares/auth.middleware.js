import { verifyToken } from "../services/jwt.service.js";

export const partnerAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('[AUTH] Authorization header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[AUTH] ✗ No valid Bearer token found');
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        console.log('[AUTH] Verifying token...');
        const decoded = verifyToken(token);
        console.log('[AUTH] ✓ Token verified for landlord:', decoded.phone);
        req.user = {
            id: decoded.id,
            phone: decoded.phone
        };
        
        next();
    } catch (err) {
        console.log('[AUTH] ✗ Token verification failed:', err.message);
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};