const express = require('express');
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ========== 公开接口（无需认证） ==========

// 提交询盘（公开）
router.post('/public/submit', (req, res) => {
    try {
        const { name, company, email, phone, subject, products, quantity, message, source } = req.body;

        // 基本校验
        if (!name || !name.trim()) {
            return res.status(400).json({ error: '姓名不能为空' });
        }
        if (!email || !email.trim()) {
            return res.status(400).json({ error: '邮箱不能为空' });
        }
        if (!subject || !subject.trim()) {
            return res.status(400).json({ error: '请选择询盘类型' });
        }

        const visitorIp = req.ip || req.headers['x-forwarded-for'] || '';

        const insertStmt = db.prepare(`
            INSERT INTO inquiries (name, company, email, phone, subject, products, quantity, message, source, visitor_ip)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insertStmt.run(
            name.trim(),
            (company || '').trim(),
            email.trim(),
            (phone || '').trim(),
            subject.trim(),
            (products || '').trim(),
            (quantity || '').trim(),
            (message || '').trim(),
            source || 'website',
            visitorIp
        );

        res.status(201).json({
            success: true,
            data: { id: result.lastInsertRowid },
            message: '询盘提交成功，我们将尽快回复您！'
        });
    } catch (error) {
        console.error('提交询盘错误:', error);
        res.status(500).json({ error: '提交失败，请稍后重试' });
    }
});

// ========== 管理接口（需要认证） ==========

// 获取询盘统计（必须在 /:id 路由之前）
router.get('/stats/summary', authMiddleware, (req, res) => {
    try {
        const totalStmt = db.prepare('SELECT COUNT(*) as count FROM inquiries');
        const pendingStmt = db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'pending'");
        const repliedStmt = db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'replied'");
        const closedStmt = db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'closed'");

        const total = totalStmt.get().count;
        const pending = pendingStmt.get().count;
        const replied = repliedStmt.get().count;
        const closed = closedStmt.get().count;

        res.json({
            success: true,
            data: { total, pending, replied, closed }
        });
    } catch (error) {
        console.error('获取询盘统计错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取询盘列表
router.get('/', authMiddleware, (req, res) => {
    try {
        const { page = 1, limit = 20, keyword, status } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereClauses = [];
        let params = [];

        if (keyword) {
            whereClauses.push('(name LIKE ? OR email LIKE ? OR company LIKE ? OR products LIKE ? OR message LIKE ?)');
            params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
        }

        if (status) {
            whereClauses.push('status = ?');
            params.push(status);
        }

        const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        // 查询总数
        const countStmt = db.prepare(`SELECT COUNT(*) as total FROM inquiries ${whereSQL}`);
        const { total } = countStmt.get(...params);

        // 查询列表
        const listStmt = db.prepare(`
            SELECT * FROM inquiries ${whereSQL}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `);

        const inquiries = listStmt.all(...params, parseInt(limit), offset);

        res.json({
            success: true,
            data: {
                inquiries,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('获取询盘列表错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取单个询盘详情
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM inquiries WHERE id = ?');
        const inquiry = stmt.get(req.params.id);

        if (!inquiry) {
            return res.status(404).json({ error: '询盘不存在' });
        }

        res.json({ success: true, data: inquiry });
    } catch (error) {
        console.error('获取询盘详情错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 更新询盘状态
router.put('/:id', authMiddleware, (req, res) => {
    try {
        const { status, note } = req.body;

        const checkStmt = db.prepare('SELECT id FROM inquiries WHERE id = ?');
        const existing = checkStmt.get(req.params.id);

        if (!existing) {
            return res.status(404).json({ error: '询盘不存在' });
        }

        const updateStmt = db.prepare(`
            UPDATE inquiries SET
                status = COALESCE(?, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        updateStmt.run(status || null, req.params.id);

        res.json({ success: true, message: '询盘状态更新成功' });
    } catch (error) {
        console.error('更新询盘错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 删除询盘
router.delete('/:id', authMiddleware, (req, res) => {
    try {
        const checkStmt = db.prepare('SELECT id FROM inquiries WHERE id = ?');
        const existing = checkStmt.get(req.params.id);

        if (!existing) {
            return res.status(404).json({ error: '询盘不存在' });
        }

        const deleteStmt = db.prepare('DELETE FROM inquiries WHERE id = ?');
        deleteStmt.run(req.params.id);

        res.json({ success: true, message: '询盘删除成功' });
    } catch (error) {
        console.error('删除询盘错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 批量删除询盘
router.post('/batch-delete', authMiddleware, (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: '请提供要删除的询盘 ID 列表' });
        }

        const deleteStmt = db.prepare('DELETE FROM inquiries WHERE id = ?');

        const deleteMany = db.transaction((inquiryIds) => {
            for (const id of inquiryIds) {
                deleteStmt.run(id);
            }
        });

        deleteMany(ids);

        res.json({ success: true, message: `成功删除 ${ids.length} 条询盘` });
    } catch (error) {
        console.error('批量删除询盘错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;
