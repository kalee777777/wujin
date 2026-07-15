const express = require('express');
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取所有产品列表
router.get('/', authMiddleware, (req, res) => {
    try {
        const { page = 1, limit = 20, category, keyword, status } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        let whereClauses = [];
        let params = [];
        
        if (category) {
            whereClauses.push('p.category_id = ?');
            params.push(parseInt(category));
        }
        
        if (keyword) {
            whereClauses.push('(p.name LIKE ? OR p.description LIKE ?)');
            params.push(`%${keyword}%`, `%${keyword}%`);
        }
        
        if (status !== undefined && status !== '') {
            whereClauses.push('p.status = ?');
            params.push(parseInt(status));
        }
        
        const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
        
        // 查询总数
        const countStmt = db.prepare(`
            SELECT COUNT(*) as total FROM products p ${whereSQL}
        `);
        const { total } = countStmt.get(...params);
        
        // 查询列表
        const listStmt = db.prepare(`
            SELECT 
                p.*, 
                c.name as category_name,
                c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ${whereSQL}
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `);
        
        const products = listStmt.all(...params, parseInt(limit), offset);
        
        // 为每个产品查询图片
        const imageStmt = db.prepare('SELECT image_path FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1');
        
        const productsWithImages = products.map(product => {
            const firstImage = imageStmt.get(product.id);
            return {
                ...product,
                specs: JSON.parse(product.specs || '{}'),
                first_image: firstImage ? firstImage.image_path : null
            };
        });
        
        res.json({
            success: true,
            data: {
                products: productsWithImages,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('获取产品列表错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取单个产品详情
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT p.*, c.name as category_name, c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `);
        
        const product = stmt.get(req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: '产品不存在' });
        }
        
        // 获取产品图片
        const imageStmt = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC');
        const images = imageStmt.all(req.params.id);
        
        product.specs = JSON.parse(product.specs || '{}');
        product.applications = JSON.parse(product.applications || '[]');
        product.certifications = JSON.parse(product.certifications || '[]');
        product.downloads = JSON.parse(product.downloads || '[]');
        product.images = images;
        
        res.json({ success: true, data: product });
    } catch (error) {
        console.error('获取产品详情错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 创建产品
router.post('/', authMiddleware, (req, res) => {
    try {
        const { folder, name, category_id, description, specs, applications, certifications, downloads, images } = req.body;
        
        if (!folder || !name) {
            return res.status(400).json({ error: '产品文件夹名和名称不能为空' });
        }
        
        // 检查文件夹是否已存在
        const checkStmt = db.prepare('SELECT id FROM products WHERE folder = ?');
        const existing = checkStmt.get(folder);
        if (existing) {
            return res.status(400).json({ error: '产品文件夹名已存在' });
        }
        
        const insertStmt = db.prepare(`
            INSERT INTO products (folder, name, category_id, description, specs, applications, certifications, downloads)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = insertStmt.run(
            folder,
            name,
            category_id || null,
            description || '',
            JSON.stringify(specs || {}),
            JSON.stringify(applications || []),
            JSON.stringify(certifications || []),
            JSON.stringify(downloads || [])
        );
        
        const productId = result.lastInsertRowid;
        
        // 插入图片
        if (images && images.length > 0) {
            const imageStmt = db.prepare('INSERT INTO product_images (product_id, image_path, sort_order) VALUES (?, ?, ?)');
            images.forEach((image, index) => {
                imageStmt.run(productId, image, index);
            });
        }
        
        res.status(201).json({
            success: true,
            data: { id: productId },
            message: '产品创建成功'
        });
    } catch (error) {
        console.error('创建产品错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 更新产品
router.put('/:id', authMiddleware, (req, res) => {
    try {
        const { folder, name, category_id, description, specs, applications, certifications, downloads, images, status } = req.body;
        
        const checkStmt = db.prepare('SELECT id FROM products WHERE id = ?');
        const existing = checkStmt.get(req.params.id);
        
        if (!existing) {
            return res.status(404).json({ error: '产品不存在' });
        }
        
        const updateStmt = db.prepare(`
            UPDATE products SET
                folder = COALESCE(?, folder),
                name = COALESCE(?, name),
                category_id = COALESCE(?, category_id),
                description = COALESCE(?, description),
                specs = COALESCE(?, specs),
                applications = COALESCE(?, applications),
                certifications = COALESCE(?, certifications),
                downloads = COALESCE(?, downloads),
                status = COALESCE(?, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        
        updateStmt.run(
            folder || null,
            name || null,
            category_id ?? null,
            description !== undefined ? description : null,
            specs ? JSON.stringify(specs) : null,
            applications ? JSON.stringify(applications) : null,
            certifications ? JSON.stringify(certifications) : null,
            downloads ? JSON.stringify(downloads) : null,
            status ?? null,
            req.params.id
        );
        
        // 更新图片
        if (images && images.length > 0) {
            const deleteStmt = db.prepare('DELETE FROM product_images WHERE product_id = ?');
            deleteStmt.run(req.params.id);
            
            const imageStmt = db.prepare('INSERT INTO product_images (product_id, image_path, sort_order) VALUES (?, ?, ?)');
            images.forEach((image, index) => {
                imageStmt.run(parseInt(req.params.id), image, index);
            });
        }
        
        res.json({ success: true, message: '产品更新成功' });
    } catch (error) {
        console.error('更新产品错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 删除产品
router.delete('/:id', authMiddleware, (req, res) => {
    try {
        const checkStmt = db.prepare('SELECT id FROM products WHERE id = ?');
        const existing = checkStmt.get(req.params.id);
        
        if (!existing) {
            return res.status(404).json({ error: '产品不存在' });
        }
        
        // 删除关联图片
        const deleteImagesStmt = db.prepare('DELETE FROM product_images WHERE product_id = ?');
        deleteImagesStmt.run(req.params.id);
        
        // 删除产品
        const deleteStmt = db.prepare('DELETE FROM products WHERE id = ?');
        deleteStmt.run(req.params.id);
        
        res.json({ success: true, message: '产品删除成功' });
    } catch (error) {
        console.error('删除产品错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 批量删除
router.post('/batch-delete', authMiddleware, (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: '请提供要删除的产品 ID 列表' });
        }
        
        const deleteImagesStmt = db.prepare('DELETE FROM product_images WHERE product_id = ?');
        const deleteStmt = db.prepare('DELETE FROM products WHERE id = ?');
        
        const deleteMany = db.transaction((productIds) => {
            for (const id of productIds) {
                deleteImagesStmt.run(id);
                deleteStmt.run(id);
            }
        });
        
        deleteMany(ids);
        
        res.json({ success: true, message: `成功删除 ${ids.length} 个产品` });
    } catch (error) {
        console.error('批量删除错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;