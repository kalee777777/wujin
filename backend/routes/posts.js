const express = require('express');
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取帖子列表
router.get('/', authMiddleware, (req, res) => {
    try {
        const { page = 1, limit = 20, category, keyword, status } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        let whereClauses = [];
        let params = [];
        
        if (category) {
            whereClauses.push('category = ?');
            params.push(category);
        }
        
        if (keyword) {
            whereClauses.push('(title LIKE ? OR content LIKE ?)');
            params.push(`%${keyword}%`, `%${keyword}%`);
        }
        
        if (status !== undefined && status !== '') {
            whereClauses.push('status = ?');
            params.push(parseInt(status));
        }
        
        const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
        
        // 查询总数
        const countStmt = db.prepare(`SELECT COUNT(*) as total FROM posts ${whereSQL}`);
        const { total } = countStmt.get(...params);
        
        // 查询列表
        const listStmt = db.prepare(`
            SELECT id, title, slug, category, cover_image, summary, author, status, views, published_at, created_at, updated_at
            FROM posts
            ${whereSQL}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `);
        
        const posts = listStmt.all(...params, parseInt(limit), offset);
        
        res.json({
            success: true,
            data: {
                posts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('获取帖子列表错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取单个帖子详情
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM posts WHERE id = ?');
        const post = stmt.get(req.params.id);
        
        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }
        
        res.json({ success: true, data: post });
    } catch (error) {
        console.error('获取帖子详情错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 创建帖子
router.post('/', authMiddleware, (req, res) => {
    try {
        const { title, slug, category, cover_image, content, summary, author, status } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: '标题和内容不能为空' });
        }
        
        const insertStmt = db.prepare(`
            INSERT INTO posts (title, slug, category, cover_image, content, summary, author, status, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const postSlug = slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '');
        const publishedAt = status === 1 ? new Date().toISOString() : null;
        
        const result = insertStmt.run(
            title,
            postSlug,
            category || 'news',
            cover_image || null,
            content,
            summary || title.substring(0, 100),
            author || 'HOLGENVY',
            status ?? 0,
            publishedAt
        );
        
        res.status(201).json({
            success: true,
            data: { id: result.lastInsertRowid },
            message: '帖子创建成功'
        });
    } catch (error) {
        console.error('创建帖子错误:', error);
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: '帖子 slug 已存在' });
        }
        res.status(500).json({ error: '服务器错误' });
    }
});

// 更新帖子
router.put('/:id', authMiddleware, (req, res) => {
    try {
        const { title, slug, category, cover_image, content, summary, author, status } = req.body;
        
        const checkStmt = db.prepare('SELECT id, status FROM posts WHERE id = ?');
        const existing = checkStmt.get(req.params.id);
        
        if (!existing) {
            return res.status(404).json({ error: '帖子不存在' });
        }
        
        // 如果从草稿变为发布，设置发布时间
        let publishedAt = null;
        if (status === 1 && existing.status !== 1) {
            publishedAt = new Date().toISOString();
        }
        
        const updateStmt = db.prepare(`
            UPDATE posts SET
                title = COALESCE(?, title),
                slug = COALESCE(?, slug),
                category = COALESCE(?, category),
                cover_image = COALESCE(?, cover_image),
                content = COALESCE(?, content),
                summary = COALESCE(?, summary),
                author = COALESCE(?, author),
                status = COALESCE(?, status),
                published_at = COALESCE(?, published_at),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        
        const postSlug = slug || undefined;
        
        updateStmt.run(
            title || null,
            postSlug || null,
            category || null,
            cover_image || null,
            content || null,
            summary || null,
            author || null,
            status ?? null,
            publishedAt,
            req.params.id
        );
        
        res.json({ success: true, message: '帖子更新成功' });
    } catch (error) {
        console.error('更新帖子错误:', error);
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: '帖子 slug 已存在' });
        }
        res.status(500).json({ error: '服务器错误' });
    }
});

// 删除帖子
router.delete('/:id', authMiddleware, (req, res) => {
    try {
        const checkStmt = db.prepare('SELECT id FROM posts WHERE id = ?');
        const existing = checkStmt.get(req.params.id);
        
        if (!existing) {
            return res.status(404).json({ error: '帖子不存在' });
        }
        
        const deleteStmt = db.prepare('DELETE FROM posts WHERE id = ?');
        deleteStmt.run(req.params.id);
        
        res.json({ success: true, message: '帖子删除成功' });
    } catch (error) {
        console.error('删除帖子错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 批量删除
router.post('/batch-delete', authMiddleware, (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: '请提供要删除的帖子 ID 列表' });
        }
        
        const deleteStmt = db.prepare('DELETE FROM posts WHERE id = ?');
        
        const deleteMany = db.transaction((postIds) => {
            for (const id of postIds) {
                deleteStmt.run(id);
            }
        });
        
        deleteMany(ids);
        
        res.json({ success: true, message: `成功删除 ${ids.length} 个帖子` });
    } catch (error) {
        console.error('批量删除错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;