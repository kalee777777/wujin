// Migration script: exports data from existing SQLite database to D1-compatible SQL
// Usage: node scripts/migrate-to-d1.js > d1-data.sql
// Then:  npx wrangler d1 execute holgenvy --file=d1-data.sql

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../backend/data/holgenvy.db');
const db = new Database(DB_PATH, { readonly: true });

function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

console.log('-- HOLGENVY D1 Data Migration');
console.log('-- Generated:', new Date().toISOString());
console.log('');

// Admins
console.log('-- Admins');
const admins = db.prepare('SELECT * FROM admins').all();
for (const a of admins) {
  console.log(`INSERT INTO admins (id, username, password, role, created_at, updated_at) VALUES (${a.id}, ${escapeSQL(a.username)}, ${escapeSQL(a.password)}, ${escapeSQL(a.role)}, ${escapeSQL(a.created_at)}, ${escapeSQL(a.updated_at)});`);
}
console.log('');

// Categories
console.log('-- Categories');
const categories = db.prepare('SELECT * FROM categories').all();
for (const c of categories) {
  console.log(`INSERT INTO categories (id, name, slug, description, icon, sort_order, created_at) VALUES (${c.id}, ${escapeSQL(c.name)}, ${escapeSQL(c.slug)}, ${escapeSQL(c.description)}, ${escapeSQL(c.icon)}, ${c.sort_order}, ${escapeSQL(c.created_at)});`);
}
console.log('');

// Products
console.log('-- Products');
const products = db.prepare('SELECT * FROM products').all();
for (const p of products) {
  console.log(`INSERT INTO products (id, folder, name, category_id, description, specs, applications, certifications, downloads, status, views, created_at, updated_at) VALUES (${p.id}, ${escapeSQL(p.folder)}, ${escapeSQL(p.name)}, ${p.category_id || 'NULL'}, ${escapeSQL(p.description)}, ${escapeSQL(p.specs)}, ${escapeSQL(p.applications)}, ${escapeSQL(p.certifications)}, ${escapeSQL(p.downloads)}, ${p.status}, ${p.views}, ${escapeSQL(p.created_at)}, ${escapeSQL(p.updated_at)});`);
}
console.log('');

// Product Images
console.log('-- Product Images');
const images = db.prepare('SELECT * FROM product_images').all();
for (const img of images) {
  console.log(`INSERT INTO product_images (id, product_id, image_path, sort_order, created_at) VALUES (${img.id}, ${img.product_id}, ${escapeSQL(img.image_path)}, ${img.sort_order}, ${escapeSQL(img.created_at)});`);
}
console.log('');

// Posts
console.log('-- Posts');
const posts = db.prepare('SELECT * FROM posts').all();
for (const p of posts) {
  console.log(`INSERT INTO posts (id, title, slug, category, cover_image, content, summary, author, status, views, read_time, published_at, created_at, updated_at) VALUES (${p.id}, ${escapeSQL(p.title)}, ${escapeSQL(p.slug)}, ${escapeSQL(p.category)}, ${escapeSQL(p.cover_image)}, ${escapeSQL(p.content)}, ${escapeSQL(p.summary)}, ${escapeSQL(p.author)}, ${p.status}, ${p.views}, ${p.read_time}, ${escapeSQL(p.published_at)}, ${escapeSQL(p.created_at)}, ${escapeSQL(p.updated_at)});`);
}
console.log('');

// Inquiries
console.log('-- Inquiries');
const inquiries = db.prepare('SELECT * FROM inquiries').all();
for (const i of inquiries) {
  console.log(`INSERT INTO inquiries (id, name, company, email, phone, subject, products, quantity, message, status, source, visitor_ip, created_at, updated_at) VALUES (${i.id}, ${escapeSQL(i.name)}, ${escapeSQL(i.company)}, ${escapeSQL(i.email)}, ${escapeSQL(i.phone)}, ${escapeSQL(i.subject)}, ${escapeSQL(i.products)}, ${escapeSQL(i.quantity)}, ${escapeSQL(i.message)}, ${escapeSQL(i.status)}, ${escapeSQL(i.source)}, ${escapeSQL(i.visitor_ip)}, ${escapeSQL(i.created_at)}, ${escapeSQL(i.updated_at)});`);
}
console.log('');

console.log('-- Migration complete');
db.close();
