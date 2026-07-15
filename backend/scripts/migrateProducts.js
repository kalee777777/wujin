const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');
const { db, initDatabase } = require('../config/database');

// 读取 products.json
const productsJsonPath = path.join(__dirname, '../../../workspace/products.json');

function migrateProducts() {
    try {
        // 初始化数据库
        initDatabase();
        
        // 读取产品数据
        if (!fs.existsSync(productsJsonPath)) {
            console.error('❌ products.json 文件不存在');
            return;
        }
        
        const productsData = JSON.parse(fs.readFileSync(productsJsonPath, 'utf-8'));
        console.log(`📦 发现 ${productsData.length} 个产品`);
        
        // 开始迁移
        const insertProduct = db.prepare(`
            INSERT INTO products (folder, name, category_id, description, specs, applications, certifications, downloads)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const insertImage = db.prepare(`
            INSERT INTO product_images (product_id, image_path, sort_order)
            VALUES (?, ?, ?)
        `);
        
        // 获取分类映射
        const categoryMap = {};
        const categories = db.prepare('SELECT id, name FROM categories').all();
        categories.forEach(cat => {
            categoryMap[cat.name] = cat.id;
        });
        
        let successCount = 0;
        let errorCount = 0;
        
        const migrate = db.transaction((products) => {
            for (const product of products) {
                try {
                    // 查找分类
                    let categoryId = null;
                    if (product.category) {
                        categoryId = categoryMap[product.category];
                    }
                    
                    // 插入产品
                    const result = insertProduct.run(
                        product.folder,
                        product.name,
                        categoryId,
                        product.description || '',
                        JSON.stringify(product.specs || {}),
                        JSON.stringify(product.applications || []),
                        JSON.stringify(product.certifications || []),
                        JSON.stringify(product.downloads || [])
                    );
                    
                    const productId = result.lastInsertRowid;
                    
                    // 插入图片
                    if (product.images && product.images.length > 0) {
                        product.images.forEach((imagePath, index) => {
                            insertImage.run(productId, imagePath, index);
                        });
                    }
                    
                    successCount++;
                } catch (error) {
                    console.error(`❌ 迁移产品失败: ${product.name}`, error.message);
                    errorCount++;
                }
            }
        });
        
        migrate(productsData);
        
        console.log(`\n✅ 迁移完成:`);
        console.log(`   成功: ${successCount} 个产品`);
        console.log(`   失败: ${errorCount} 个产品`);
        
    } catch (error) {
        console.error('❌ 迁移失败:', error);
    }
}

migrateProducts();