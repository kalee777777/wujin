require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDatabase } = require('./config/database');

// 导入路由
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const postsRoutes = require('./routes/posts');
const categoriesRoutes = require('./routes/categories');
const uploadRoutes = require('./routes/upload');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务（产品图片）
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../product-images');
app.use('/product-images', express.static(uploadDir));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stats', statsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 404 处理
app.use((req, res) => {
    res.status(404).json({ error: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
});

// 初始化数据库并启动服务器
async function startServer() {
    try {
        // 初始化数据库
        initDatabase();
        
        app.listen(PORT, () => {
            console.log(`🚀 服务已启动: http://localhost:${PORT}`);
            console.log(`📡 API 地址: http://localhost:${PORT}/api`);
            console.log(`📁 图片目录: ${uploadDir}`);
        });
    } catch (error) {
        console.error('启动服务器失败:', error);
        process.exit(1);
    }
}

startServer();