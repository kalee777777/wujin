const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'holgenvy-admin-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 生成 Token
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// 验证 Token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// 认证中间件
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未登录或登录已过期' });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({ error: 'Token 无效或已过期' });
    }
    
    req.admin = decoded;
    next();
}

module.exports = {
    generateToken,
    verifyToken,
    authMiddleware
};