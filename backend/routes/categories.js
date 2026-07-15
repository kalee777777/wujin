const express = require('express');
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取所有分类
router.get('/', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT c.*, COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            GROUP BY c.id
            ORDER BY c.sort_order ASC
        `);
        const categories = stmt.all();
        
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('获取分类列表错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 创建分类（需要认证）
router.post('/', authMiddleware, (req, res) => {
    try {
        const { name, slug, description, icon, sort_order } = req.body;
        
        if (!name || !slug) {
            return res.status(400).json({ error: '分类名称和 slug 不能为空' });
        }
        
        const insertStmt = db.prepare(`
            INSERT INTO categories (name, slug, description, icon, sort_order)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        const result = insertStmt.run(name, slug, description || '', icon || '', sort_order || 0);
        
        res.status(201).json({
            success: true,
            data: { id: result.lastInsertRowid },
            message: '分类创建成功'
        });
    } catch (error) {
        console.error('创建分类错误:', error);
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: '分类名称或 slug 已存在' });
        }
        res.status(500).json({ error: '服务器错误' });
    }
});

// 更新分类
router.put('/:id', authMiddleware, (req, res) => {
    try {
        const { name, slug, description, icon, sort_order } = req.body;
        
        const updateStmt = db.prepare(`
            UPDATE categories SET
                name = COALESCE(?, name),
                slug = COALESCE(?, slug),
                description = COALESCE(?, description),
                icon = COALESCE(?, icon),
                sort_order = COALESCE(?, sort_order)
            WHERE id = ?
        `);
        
        updateStmt.run(name || null, slug || null, description || null, icon || null, sort_order ?? null, req.params.id);
        
        res.json({ success: true, message: '分类更新成功' });
    } catch (error) {
        console.error('更新分类错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 删除分类
router.delete('/:id', authMiddleware, (req, res) => {
    try {
        const checkStmt = db.prepare('SELECT id FROM categories WHERE id = ?');
        const existing = checkStmt.get(req.params.id);
        
        if (!existing) {
            return res.status(404).json({ error: '分类不存在' });
        }
        
        // 检查是否有产品使用该分类
        const productCountStmt = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?');
        const { count } = productCountStmt.get(req.params.id);
        
        if (count > 0) {
            return res.status(400).json({ error: `该分类下有 ${count} 个产品，无法删除` });
        }
        
        const deleteStmt = db.prepare('DELETE FROM categories WHERE id = ?');
        deleteStmt.run(req.params.id);
        
        res.json({ success: true, message: '分类删除成功' });
    } catch (error) {
        console.error('删除分类错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;