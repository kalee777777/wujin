const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 上传目录配置
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../product-images');

// 确保上传目录存在
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 根据 folder 参数创建子目录
        const folder = req.body.folder || 'uploads';
        const targetDir = path.join(uploadDir, folder);
        
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        cb(null, targetDir);
    },
    filename: (req, file, cb) => {
        // 生成唯一文件名
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${uuidv4().substring(0, 8)}${ext}`;
        cb(null, uniqueName);
    }
});

// 文件过滤
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型，仅支持 JPG、PNG、GIF、WEBP'), false);
    }
};

// 文件大小限制 (10MB)
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || 10485760)
    }
});

// 认证中间件
const { authMiddleware } = require('../middleware/auth');

// 单图上传
router.post('/image', authMiddleware, (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: '文件大小超过限制（最大 10MB）' });
            }
            return res.status(400).json({ error: err.message });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: '请选择要上传的图片' });
        }
        
        const relativePath = path.relative(uploadDir, req.file.path);
        const publicUrl = `product-images/${relativePath}`;
        
        res.json({
            success: true,
            data: {
                filename: req.file.filename,
                path: publicUrl,
                size: req.file.size
            }
        });
    });
});

// 多图上传
router.post('/images', authMiddleware, (req, res) => {
    upload.array('images', 10)(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: '文件大小超过限制（最大 10MB）' });
            }
            return res.status(400).json({ error: err.message });
        }
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: '请选择要上传的图片' });
        }
        
        const files = req.files.map(file => {
            const relativePath = path.relative(uploadDir, file.path);
            return {
                filename: file.filename,
                path: `product-images/${relativePath}`,
                size: file.size
            };
        });
        
        res.json({
            success: true,
            data: {
                files,
                count: files.length
            }
        });
    });
});

// 删除图片
router.delete('/image', authMiddleware, (req, res) => {
    try {
        const { path: imagePath } = req.body;
        
        if (!imagePath) {
            return res.status(400).json({ error: '请提供图片路径' });
        }
        
        const fullPath = path.join(uploadDir, imagePath);
        
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: '图片不存在' });
        }
        
        fs.unlinkSync(fullPath);
        
        res.json({ success: true, message: '图片删除成功' });
    } catch (error) {
        console.error('删除图片错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;