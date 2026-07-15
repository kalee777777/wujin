const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../config/database');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 登录
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码不能为空' });
        }
        
        const stmt = db.prepare('SELECT * FROM admins WHERE username = ?');
        const admin = stmt.get(username);
        
        if (!admin) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        
        const isMatch = bcrypt.compareSync(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        
        const token = generateToken({
            id: admin.id,
            username: admin.username,
            role: admin.role
        });
        
        res.json({
            success: true,
            data: {
                token,
                admin: {
                    id: admin.id,
                    username: admin.username,
                    role: admin.role
                }
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取当前用户信息
router.get('/me', authMiddleware, (req, res) => {
    try {
        const stmt = db.prepare('SELECT id, username, role, created_at FROM admins WHERE id = ?');
        const admin = stmt.get(req.admin.id);
        
        if (!admin) {
            return res.status(404).json({ error: '用户不存在' });
        }
        
        res.json({ success: true, data: admin });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 修改密码
router.put('/password', authMiddleware, (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: '旧密码和新密码不能为空' });
        }
        
        const stmt = db.prepare('SELECT * FROM admins WHERE id = ?');
        const admin = stmt.get(req.admin.id);
        
        if (!admin) {
            return res.status(404).json({ error: '用户不存在' });
        }
        
        const isMatch = bcrypt.compareSync(oldPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({ error: '旧密码错误' });
        }
        
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        const updateStmt = db.prepare('UPDATE admins SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        updateStmt.run(hashedPassword, req.admin.id);
        
        res.json({ success: true, message: '密码修改成功' });
    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 退出登录（前端处理，这里仅返回成功）
router.post('/logout', (req, res) => {
    res.json({ success: true, message: '已退出登录' });
});

module.exports = router;
