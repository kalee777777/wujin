const express = require('express');
const { db } = require('../config/database');

const router = express.Router();

// 记录访问日志
router.post('/log', (req, res) => {
    try {
        const { page_type, page_id, page_url, referer } = req.body;
        
        const visitorIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';
        
        const stmt = db.prepare(`
            INSERT INTO visit_logs (page_type, page_id, page_url, visitor_ip, user_agent, referer)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(page_type || null, page_id || null, page_url || '', visitorIP, userAgent, referer || null);
        
        // 更新每日统计
        const today = new Date().toISOString().split('T')[0];
        const updateStats = db.prepare(`
            INSERT INTO daily_stats (date, pv, uv) VALUES (?, 1, 1)
            ON CONFLICT(date) DO UPDATE SET pv = pv + 1
        `);
        updateStats.run(today);
        
        // 更新具体页面类型统计
        if (page_type === 'product') {
            const updateProductViews = db.prepare('UPDATE products SET views = views + 1 WHERE id = ?');
            updateProductViews.run(page_id);
            
            const updateProductDaily = db.prepare(`
                INSERT INTO daily_stats (date, product_views) VALUES (?, 1)
                ON CONFLICT(date) DO UPDATE SET product_views = product_views + 1
            `);
            updateProductDaily.run(today);
        } else if (page_type === 'post') {
            const updatePostViews = db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?');
            updatePostViews.run(page_id);
            
            const updatePostDaily = db.prepare(`
                INSERT INTO daily_stats (date, post_views) VALUES (?, 1)
                ON CONFLICT(date) DO UPDATE SET post_views = post_views + 1
            `);
            updatePostDaily.run(today);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('记录访问日志错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取统计数据（需要认证）
router.get('/dashboard', require('../middleware/auth').authMiddleware, (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        // 默认最近 30 天
        const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = end_date || new Date().toISOString().split('T')[0];
        
        // 基础统计
        const productCountStmt = db.prepare('SELECT COUNT(*) as count FROM products WHERE status = 1');
        const categoryCountStmt = db.prepare('SELECT COUNT(*) as count FROM categories');
        const postCountStmt = db.prepare('SELECT COUNT(*) as count FROM posts WHERE status = 1');
        
        const productCount = productCountStmt.get().count;
        const categoryCount = categoryCountStmt.get().count;
        const postCount = postCountStmt.get().count;
        
        // 今日统计
        const today = new Date().toISOString().split('T')[0];
        const todayStatsStmt = db.prepare('SELECT * FROM daily_stats WHERE date = ?');
        const todayStats = todayStatsStmt.get(today) || { pv: 0, uv: 0, product_views: 0, post_views: 0 };
        
        // 时间范围内统计
        const rangeStatsStmt = db.prepare(`
            SELECT 
                SUM(pv) as total_pv,
                SUM(uv) as total_uv,
                SUM(product_views) as total_product_views,
                SUM(post_views) as total_post_views
            FROM daily_stats
            WHERE date BETWEEN ? AND ?
        `);
        const rangeStats = rangeStatsStmt.get(startDate, endDate);
        
        // 每日趋势
        const dailyTrendStmt = db.prepare(`
            SELECT date, pv, uv, product_views, post_views
            FROM daily_stats
            WHERE date BETWEEN ? AND ?
            ORDER BY date ASC
        `);
        const dailyTrend = dailyTrendStmt.all(startDate, endDate);
        
        // 分类分布
        const categoryDistStmt = db.prepare(`
            SELECT c.name, COUNT(p.id) as count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id AND p.status = 1
            GROUP BY c.id
            ORDER BY count DESC
        `);
        const categoryDist = categoryDistStmt.all();
        
        // 热门产品（按浏览量）
        const hotProductsStmt = db.prepare(`
            SELECT id, name, views
            FROM products
            WHERE status = 1
            ORDER BY views DESC
            LIMIT 10
        `);
        const hotProducts = hotProductsStmt.all();
        
        // 最近产品
        const recentProductsStmt = db.prepare(`
            SELECT id, name, created_at
            FROM products
            ORDER BY created_at DESC
            LIMIT 5
        `);
        const recentProducts = recentProductsStmt.all();
        
        // 最近帖子
        const recentPostsStmt = db.prepare(`
            SELECT id, title, status, created_at
            FROM posts
            ORDER BY created_at DESC
            LIMIT 5
        `);
        const recentPosts = recentPostsStmt.all();
        
        res.json({
            success: true,
            data: {
                overview: {
                    product_count: productCount,
                    category_count: categoryCount,
                    post_count: postCount
                },
                today: todayStats,
                range: {
                    ...rangeStats,
                    start_date: startDate,
                    end_date: endDate
                },
                daily_trend: dailyTrend,
                category_distribution: categoryDist,
                hot_products: hotProducts,
                recent_products: recentProducts,
                recent_posts: recentPosts
            }
        });
    } catch (error) {
        console.error('获取统计数据错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;