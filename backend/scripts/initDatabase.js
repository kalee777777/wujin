require('dotenv').config();
const { initDatabase } = require('../config/database');

console.log('🔧 正在初始化数据库...');
initDatabase();
console.log('✅ 数据库初始化完成');