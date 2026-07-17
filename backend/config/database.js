const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// 确保数据目录存在
const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dbDir, 'holgenvy.db');
const db = new Database(dbPath);

// 启用外键约束
db.pragma('journal_mode = WAL');

// 初始化数据库表
function initDatabase() {
    // 管理员表
    db.exec(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 分类表
    db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            icon TEXT,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 产品表
    db.exec(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            folder TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            category_id INTEGER,
            description TEXT,
            specs TEXT,
            applications TEXT,
            certifications TEXT,
            downloads TEXT,
            status INTEGER DEFAULT 1,
            views INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    `);

    // 产品图片表
    db.exec(`
        CREATE TABLE IF NOT EXISTS product_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            image_path TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    `);

    // 帖子/文章表
    db.exec(`
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT UNIQUE,
            category TEXT DEFAULT 'news',
            cover_image TEXT,
            content TEXT,
            summary TEXT,
            author TEXT,
            status INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0,
            read_time INTEGER DEFAULT 5,
            published_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 访问日志表
    db.exec(`
        CREATE TABLE IF NOT EXISTS visit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page_type TEXT,
            page_id INTEGER,
            page_url TEXT,
            visitor_ip TEXT,
            user_agent TEXT,
            referer TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 每日统计表
    db.exec(`
        CREATE TABLE IF NOT EXISTS daily_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT UNIQUE NOT NULL,
            pv INTEGER DEFAULT 0,
            uv INTEGER DEFAULT 0,
            product_views INTEGER DEFAULT 0,
            post_views INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 询盘表
    db.exec(`
        CREATE TABLE IF NOT EXISTS inquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            company TEXT DEFAULT '',
            email TEXT NOT NULL,
            phone TEXT DEFAULT '',
            subject TEXT NOT NULL,
            products TEXT DEFAULT '',
            quantity TEXT DEFAULT '',
            message TEXT DEFAULT '',
            status TEXT DEFAULT 'pending',
            source TEXT DEFAULT 'website',
            visitor_ip TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 创建索引
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
        CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
        CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
        CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
        CREATE INDEX IF NOT EXISTS idx_visit_logs_date ON visit_logs(created_at);
        CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
        CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
        CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at);
    `);

    console.log('✅ 数据库表创建完成');
    
    // 初始化默认分类
    initCategories();
    
    // 初始化默认管理员
    initAdmins();
}

// 初始化默认分类
function initCategories() {
    const categories = [
        { name: 'Drills & Drivers', slug: 'drills-drivers', icon: '⚙', description: 'Electric drills and impact drivers' },
        { name: 'Angle Grinders', slug: 'angle-grinders', icon: '🛠', description: 'Angle grinders and cutting tools' },
        { name: 'Rotary Hammers', slug: 'rotary-hammers', icon: '⛏', description: 'Rotary hammers and demolition tools' },
        { name: 'Circular Saws', slug: 'circular-saws', icon: '🔫', description: 'Circular saws and cutting tools' },
        { name: 'Sanders & Polishers', slug: 'sanders-polishers', icon: '🗝', description: 'Sanding and polishing tools' },
        { name: 'Tool Kits & Sets', slug: 'tool-kits-sets', icon: '📦', description: 'Tool kits and sets' },
        { name: 'Garden Tools', slug: 'garden-tools', icon: '🌿', description: 'Garden and outdoor tools' },
        { name: 'Welding Equipment', slug: 'welding-equipment', icon: '🔥', description: 'Welding machines and accessories' },
        { name: 'Measuring Tools', slug: 'measuring-tools', icon: '📐', description: 'Measuring and surveying tools' },
        { name: 'Accessories', slug: 'accessories', icon: '⚙', description: 'Tool accessories and parts' }
    ];

    const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO categories (name, slug, icon, description, sort_order)
        VALUES (@name, @slug, @icon, @description, @sort_order)
    `);

    categories.forEach((cat, index) => {
        insertStmt.run({ ...cat, sort_order: index });
    });

    console.log('✅ 默认分类初始化完成');
}

// 初始化默认管理员
function initAdmins() {
    const admins = [
        { username: process.env.ADMIN_USERNAME_1 || 'admin', password: process.env.ADMIN_PASSWORD_1 || 'admin123' },
        { username: process.env.ADMIN_USERNAME_2 || 'manager', password: process.env.ADMIN_PASSWORD_2 || 'manager123' }
    ];

    const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO admins (username, password, role)
        VALUES (@username, @password, 'admin')
    `);

    admins.forEach(admin => {
        const hashedPassword = bcrypt.hashSync(admin.password, 10);
        insertStmt.run({ username: admin.username, password: hashedPassword });
    });

    console.log('✅ 默认管理员初始化完成');
}

module.exports = { db, initDatabase };
