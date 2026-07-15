/**
 * 将现有的静态博客帖子导入数据库
 * 读取 blog-post-*.html 文件，提取内容后插入数据库
 * 然后同步前端页面
 */
const path = require('path');
const fs = require('fs');
const { db } = require('../config/database');

const FRONTEND_DIR = path.join(__dirname, '../../');

// 分类映射：从标签文本到分类 slug
const TAG_TO_CATEGORY = {
  'Industry Trends': 'industry-trends',
  'Sourcing Guide': 'sourcing-guide',
  'Product Spotlight': 'product-spotlight',
  'Technical': 'technical',
  'Product Guide': 'product-guide'
};

// 从 HTML 中提取文章内容
function extractArticleBody(html) {
  const match = html.match(/<div class="article-body"[^>]*>([\s\S]*?)<\/div>\s*<!-- Share/);
  if (match) return match[1].trim();
  // 备选匹配
  const match2 = html.match(/<div class="article-body"[^>]*>([\s\S]*?)<\/div>\s*<div class="share-section/);
  if (match2) return match2[1].trim();
  return '';
}

// 从 HTML 中提取 meta description
function extractMetaDescription(html) {
  const match = html.match(/<meta name="description" content="([^"]+)"/);
  return match ? match[1] : '';
}

// 从 HTML 中提取分类标签
function extractCategory(html) {
  const match = html.match(/<span class="blog-tag">([^<]+)<\/span>/);
  return match ? match[1].trim() : 'Industry Trends';
}

// 从 HTML 中提取日期
function extractDate(html) {
  // 查找 meta-item 中的日期格式
  const match = html.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}/);
  if (match) return match[0];
  // 查找 meta description 中的日期
  const dateRegex = /<span class="blog-date">([^<]+)<\/span>/;
  const dateMatch = html.match(dateRegex);
  return dateMatch ? dateMatch[1] : '';
}

// 从 HTML 中提取作者
function extractAuthor(html) {
  // 作者在 author-box 的 h4 中
  const match = html.match(/<h4>([^<]+)<\/h4>/g);
  if (match) {
    for (const m of match) {
      const text = m.replace(/<h4>/, '').replace(/<\/h4>/, '');
      if (text.includes('HOLGENVY') || text.includes('Team')) {
        return text;
      }
    }
  }
  return 'HOLGENVY Editorial Team';
}

// 从 HTML 中提取阅读时间
function extractReadTime(html) {
  const match = html.match(/(\d+)\s*min\s*read/);
  return match ? parseInt(match[1]) : 5;
}

// 从 HTML 中提取 slug（从文件名）
function extractSlugFromFilename(filename) {
  // blog-post-something.html
  const match = filename.match(/blog-post-(.+)\.html$/);
  if (match) return match[1];
  // blog-post.html -> 特殊处理
  if (filename === 'blog-post.html') return 'top-5-power-tool-trends-2025';
  return null;
}

// 从 HTML 中提取标题
function extractTitle(html) {
  const match = html.match(/<h1 class="blog-post-title-main"[^>]*>([^<]+)<\/h1>/);
  if (match) return match[1].trim();
  return '';
}

// 日期字符串转 ISO
function dateToISO(dateStr) {
  const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const parts = dateStr.split(' ');
  const month = months[parts[0]];
  const day = parseInt(parts[1].replace(',', ''));
  const year = parseInt(parts[2]);
  const d = new Date(year, month, day, 12, 0, 0);
  return d.toISOString();
}

// 主函数
async function importBlogPosts() {
  console.log('开始导入现有博客帖子到数据库...\n');

  // 读取所有 blog-post-*.html 文件
  const files = fs.readdirSync(FRONTEND_DIR)
    .filter(f => f.startsWith('blog-post-') && f.endsWith('.html'))
    .sort((a, b) => {
      // 按文件名排序，保持一致性
      return a.localeCompare(b);
    });

  // 确保 blog-post.html 也在列表中（第一篇）
  if (fs.existsSync(path.join(FRONTEND_DIR, 'blog-post.html'))) {
    if (!files.includes('blog-post.html')) {
      files.unshift('blog-post.html');
    }
  }

  console.log(`找到 ${files.length} 个帖子文件\n`);

  const posts = [];
  let imported = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(FRONTEND_DIR, file);
    const html = fs.readFileSync(filePath, 'utf-8');
    
    const title = extractTitle(html);
    const slug = extractSlugFromFilename(file) || file.replace('.html', '');
    const categoryTag = extractCategory(html);
    const category = TAG_TO_CATEGORY[categoryTag] || 'industry-trends';
    const dateStr = extractDate(html);
    const summary = extractMetaDescription(html);
    const author = extractAuthor(html);
    const readTime = extractReadTime(html);
    const content = extractArticleBody(html);

    // 检查是否已存在
    const existing = db.prepare('SELECT id FROM posts WHERE slug = ?').get(slug);
    if (existing) {
      console.log(`  ⏭ 跳过(已存在): ${title} (slug: ${slug})`);
      skipped++;
      continue;
    }

    const publishedAt = dateStr ? dateToISO(dateStr) : new Date().toISOString();

    try {
      db.prepare(`
        INSERT INTO posts (title, slug, category, content, summary, author, status, read_time, published_at, created_at, views)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
      `).run(
        title,
        slug,
        category,
        content,
        summary,
        author,
        readTime,
        publishedAt,
        publishedAt,
        Math.floor(Math.random() * 3000) + 500
      );
      console.log(`  ✅ 导入: ${title} (slug: ${slug})`);
      imported++;
    } catch (err) {
      console.error(`  ❌ 导入失败: ${title}`, err.message);
    }
  }

  console.log(`\n导入完成: ${imported} 个成功, ${skipped} 个跳过`);
  return imported > 0;
}

// 执行
importBlogPosts().then((hasNew) => {
  if (hasNew) {
    console.log('\n新帖子已导入，请运行同步前端命令来更新前端页面。');
  }
  console.log('\n完成!');
}).catch(err => {
  console.error('导入失败:', err);
  process.exit(1);
});