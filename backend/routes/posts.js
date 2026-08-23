const express = require('express');
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// 前端静态文件目录
const FRONTEND_DIR = path.join(__dirname, '../../');

// ========== 分类映射 ==========
const CATEGORY_LABELS = {
  'industry-trends': 'Industry Trends',
  'sourcing-guide': 'Sourcing Guide',
  'product-spotlight': 'Product Spotlight',
  'technical': 'Technical',
  'product-guide': 'Product Guide'
};

// ========== 辅助函数 ==========

function generateSlug(title) {
  return title.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function estimateReadTime(content) {
  const text = content.replace(/<[^>]+>/g, '');
  const wordCount = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// 生成帖子详情页
function generatePostHtml(post) {
  const slug = post.slug || generateSlug(post.title);
  const filename = `blog-post-${slug}.html`;
  const categoryLabel = CATEGORY_LABELS[post.category] || post.category;
  const dateFormatted = formatDate(post.published_at || post.created_at);
  const readTime = post.read_time || estimateReadTime(post.content || '');
  const summary = post.summary || stripHtml(post.content || '').substring(0, 150);
  const content = post.content || '';

  return {
    filename,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} | HOLGENVY Blog</title>
    <meta name="description" content="${summary}">
    <meta name="keywords" content="${categoryLabel.toLowerCase()}, power tools, holgenvy">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://www.holgenvy.com/${filename}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${post.title} | HOLGENVY">
    <meta property="og:description" content="${summary}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://www.holgenvy.com/${filename}">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <!-- ========== HEADER ========== -->
    <div id="site-header"></div>
    <div id="site-nav"></div>

    <!-- ========== HERO ========== -->
    <section class="blog-hero">
        <div class="blog-hero-bg">
            ${post.cover_image
              ? `<img src="${post.cover_image}" alt="${post.title}" style="width:100%;height:100%;object-fit:cover;">`
              : `<div class="img-placeholder hero-img-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>Featured Image Placeholder</span>
            </div>`
            }
        </div>
        <div class="blog-hero-overlay"></div>
    </section>

    <!-- ========== BLOG POST ========== -->
    <section class="blog-post-section">
        <div class="blog-post-layout">
            <div class="blog-post-main">
                
                <nav class="blog-breadcrumb-inline">
                    <a href="index.html">Home</a>
                    <span class="separator">/</span>
                    <a href="resources.html">Resources</a>
                    <span class="separator">/</span>
                    <a href="blog.html">Blog</a>
                    <span class="separator">/</span>
                    <span class="current">${post.title}</span>
                </nav>

                <a href="blog.html" class="back-to-blog">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Blog
                </a>

                <div class="blog-post-meta-inline">
                    <span class="meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        ${dateFormatted}
                    </span>
                    <span class="meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        ${readTime} min read
                    </span>
                </div>

                <h1 class="blog-post-title-main">${post.title}</h1>
                <p class="blog-post-excerpt-inline">${summary}</p>

                <div class="article-body">
                    ${content}

                    <div class="share-section">
                        <span class="share-label">Share</span>
                        <div class="share-buttons-inline">
                            <button class="share-btn-circle linkedin" onclick="shareOnLinkedIn()" title="LinkedIn">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                            </button>
                            <button class="share-btn-circle twitter" onclick="shareOnTwitter()" title="Twitter">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            </button>
                            <button class="share-btn-circle copy" onclick="copyLink()" title="Copy link">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                            </button>
                            <button class="share-btn-circle email" onclick="shareByEmail()" title="Email">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="author-box-inline">
                    <div class="author-avatar-inline">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div class="author-content">
                        <div class="author-header">
                            <h4>${post.author || 'HOLGENVY Editorial Team'}</h4>
                            <span class="author-badge">${categoryLabel}</span>
                        </div>
                        <p>Our editorial team brings together decades of experience in power tool manufacturing, quality control, and industry analysis.</p>
                    </div>
                </div>
            </div>

            <aside class="blog-post-sidebar">
                <div class="sidebar-section">
                    <div class="sidebar-label">Category</div>
                    <div class="sidebar-tags">
                        <a href="blog.html" class="sidebar-tag">${categoryLabel}</a>
                    </div>
                </div>
                <div class="sidebar-section">
                    <div class="sidebar-label">Quick Links</div>
                    <ul class="sidebar-links">
                        <li><a href="products.html">Browse All Products</a></li>
                        <li><a href="contact.html">Request a Quote</a></li>
                        <li><a href="about.html">About HOLGENVY</a></li>
                    </ul>
                </div>
            </aside>
        </div>
    </section>

    <div id="site-footer"></div>

    <script src="script.js?v=2"></script>
    <script>
        function shareOnLinkedIn() { window.open('https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(window.location.href), '_blank', 'width=600,height=400'); }
        function shareOnTwitter() { window.open('https://twitter.com/intent/tweet?url=' + encodeURIComponent(window.location.href) + '&text=' + encodeURIComponent(document.title), '_blank', 'width=600,height=400'); }
        function copyLink() { navigator.clipboard.writeText(window.location.href).then(() => { document.querySelector('.share-btn-circle.copy').classList.add('copied'); setTimeout(() => { document.querySelector('.share-btn-circle.copy').classList.remove('copied'); }, 2000); }); }
        function shareByEmail() { window.location.href = 'mailto:?subject=' + encodeURIComponent(document.title) + '&body=' + encodeURIComponent(window.location.href); }
    </script>
</body>
</html>`
  };
}

// 生成博客卡片 HTML
function generateBlogCard(post, filename) {
  const categoryLabel = CATEGORY_LABELS[post.category] || post.category;
  const dateFormatted = formatDate(post.published_at || post.created_at);
  const summary = post.summary || stripHtml(post.content || '').substring(0, 150);
  const coverImg = post.cover_image
    ? `<img src="${post.cover_image}" alt="${post.title}" loading="lazy">`
    : `<div class="img-placeholder"><span>Blog Image</span></div>`;
  return `                <a href="${filename}" class="blog-card">
                    <div class="blog-img">
                        ${coverImg}
                    </div>
                    <div class="blog-info">
                        <div class="blog-meta-top">
                            <span class="blog-tag">${categoryLabel}</span>
                            <span class="blog-date">${dateFormatted}</span>
                        </div>
                        <h4>${post.title}</h4>
                        <p>${summary}</p>
                        <span class="blog-read-more">Read More →</span>
                    </div>
                </a>`;
}

// 生成 blog.html
function generateBlogHtml(posts) {
  const cards = posts.map((post, index) => {
    const slug = post.slug || generateSlug(post.title);
    const filename = `blog-post-${slug}.html`;
    return generateBlogCard(post, filename);
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog | HOLGENVY - Industry Insights & Guides</title>
    <meta name="description" content="Explore HOLGENVY's blog for industry trends, sourcing guides, product spotlights, and technical insights on power tools and hardware equipment.">
    <meta name="keywords" content="power tool blog, industry insights, sourcing guide, tool technology">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://www.holgenvy.com/blog.html">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="site-header"></div>
    <div id="site-nav"></div>

    <section class="page-header">
        <div class="container">
            <h1>Our <span class="neon">Blog</span></h1>
            <p>Industry insights, sourcing guides, and technical updates for professionals worldwide.</p>
        </div>
    </section>

    <section class="blog-list-page">
        <div class="container">
            <div class="blog-page-grid">
${cards}
            </div>
            <div class="resources-cta">
                <h3>Stay Updated with HOLGENVY</h3>
                <p>Subscribe to our newsletter to receive the latest industry insights, product updates, and sourcing tips delivered to your inbox.</p>
                <a href="contact.html" class="btn btn-neon">Subscribe Now</a>
            </div>
        </div>
    </section>

    <div id="site-footer"></div>
    <script src="script.js?v=2"></script>
</body>
</html>`;
}

// 生成 resources.html（Latest Blog 前3篇）
function generateResourcesLatestBlog(posts) {
  if (posts.length === 0) return '';

  const top3 = posts.slice(0, 3);
  const cards = top3.map((post) => {
    const slug = post.slug || generateSlug(post.title);
    const filename = `blog-post-${slug}.html`;
    const categoryLabel = CATEGORY_LABELS[post.category] || post.category;
    const dateFormatted = formatDate(post.published_at || post.created_at);
    const summary = post.summary || stripHtml(post.content || '').substring(0, 150);
    const coverImg = post.cover_image
      ? `<img src="${post.cover_image}" alt="${post.title}" loading="lazy">`
      : `<div class="img-placeholder"><span>Blog Image</span></div>`;
    return `                    <a href="${filename}" class="blog-card">
                        <div class="blog-img">
                            ${coverImg}
                        </div>
                        <div class="blog-info">
                            <div class="blog-meta-top">
                                <span class="blog-tag">${categoryLabel}</span>
                                <span class="blog-date">${dateFormatted}</span>
                            </div>
                            <h4>${post.title}</h4>
                            <p>${summary}</p>
                            <span class="blog-read-more">Read More →</span>
                        </div>
                    </a>`;
  }).join('\n');

  return `                <!-- BEGIN_BLOG_SECTION -->
                <div class="section-title-with-more">
                    <h2 class="resources-section-title">Latest <span class="neon">Blog</span></h2>
                    <a href="blog.html" class="view-more-link">
                        View More
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </a>
                </div>
                <div class="blog-grid">
${cards}
                </div>
                <!-- END_BLOG_SECTION -->`;
}

// 更新 resources.html 中的 Latest Blog 部分
function updateResourcesHtml(posts) {
  const resourcesPath = path.join(FRONTEND_DIR, 'resources.html');
  if (!fs.existsSync(resourcesPath)) {
    console.error('resources.html 不存在');
    return;
  }

  let content = fs.readFileSync(resourcesPath, 'utf-8');
  const newBlogSection = generateResourcesLatestBlog(posts);

  // 方式1：使用 HTML 注释标记精确匹配（推荐）
  const markerRegex = /<!-- BEGIN_BLOG_SECTION -->[\s\S]*?<!-- END_BLOG_SECTION -->/;
  if (markerRegex.test(content)) {
    content = content.replace(markerRegex, newBlogSection);
    fs.writeFileSync(resourcesPath, content, 'utf-8');
    return;
  }

  // 方式2：回退到旧逻辑（兼容首次 sync 无标记的情况）
  // 匹配从 <div class="resources-section" id="blog"> 到 Sourcing Events 注释之间的所有内容
  const sectionRegex = /(<div class="resources-section" id="blog">)[\s\S]*?(<!--\s*Sourcing\s*Events\s*-->)/;
  const sectionMatch = content.match(sectionRegex);
  if (sectionMatch) {
    // 注意：newBlogSection 内容结束后需要关闭 resources-section div
    content = content.replace(sectionMatch[0], sectionMatch[1] + '\n' + newBlogSection + '\n            </div>\n\n            ' + sectionMatch[2]);
  }

  fs.writeFileSync(resourcesPath, content, 'utf-8');
}

// ========== API 路由 ==========

// 同步前端辅助函数
function syncFrontend() {
  const stmt = db.prepare('SELECT id, title, slug, category, summary, cover_image, author, read_time, content, published_at, created_at FROM posts WHERE status = 1 ORDER BY published_at DESC');
  const allPosts = stmt.all();

  // 1. 重新生成所有帖子详情页
  for (const post of allPosts) {
    const { filename, html } = generatePostHtml(post);
    const detailPath = path.join(FRONTEND_DIR, filename);
    fs.writeFileSync(detailPath, html, 'utf-8');
  }

  // 2. 更新 blog.html
  const blogHtml = generateBlogHtml(allPosts);
  const blogPath = path.join(FRONTEND_DIR, 'blog.html');
  fs.writeFileSync(blogPath, blogHtml, 'utf-8');

  // 3. 更新 resources.html
  updateResourcesHtml(allPosts);
}

// 获取帖子列表（未登录也可访问部分接口）
router.get('/', (req, res) => {
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
    
    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM posts ${whereSQL}`);
    const { total } = countStmt.get(...params);
    
    const listStmt = db.prepare(`
      SELECT id, title, slug, category, cover_image, summary, author, status, views, read_time, published_at, created_at, updated_at
      FROM posts ${whereSQL}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    
    const posts = listStmt.all(...params, parseInt(limit), offset);
    
    res.json({
      success: true,
      data: {
        posts,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
      }
    });
  } catch (error) {
    console.error('获取帖子列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取所有已发布的帖子（按创建时间倒序）
router.get('/published/all', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, title, slug, category, summary, author, read_time, content, published_at, created_at
      FROM posts WHERE status = 1
      ORDER BY published_at DESC
    `);
    const posts = stmt.all();
    res.json({ success: true, data: posts });
  } catch (error) {
    console.error('获取已发布帖子错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取单个帖子详情
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM posts WHERE id = ?');
    const post = stmt.get(req.params.id);
    if (!post) return res.status(404).json({ error: '帖子不存在' });
    res.json({ success: true, data: post });
  } catch (error) {
    console.error('获取帖子详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建帖子
router.post('/', authMiddleware, (req, res) => {
  try {
    const { title, slug, category, cover_image, content, summary, author, status, read_time } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: '标题和内容不能为空' });
    }
    
    const insertStmt = db.prepare(`
      INSERT INTO posts (title, slug, category, cover_image, content, summary, author, status, read_time, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const postSlug = slug || generateSlug(title);
    const publishedAt = req.body.published_at || (status === 1 ? new Date().toISOString() : null);
    const postReadTime = read_time || estimateReadTime(content);
    
    const result = insertStmt.run(
      title,
      postSlug,
      category || 'industry-trends',
      cover_image || null,
      content,
      summary || stripHtml(content).substring(0, 150),
      author || 'HOLGENVY Editorial Team',
      status ?? 0,
      postReadTime,
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

// 发布帖子（创建 + 生成静态页面 + 同步前端）
router.post('/publish', authMiddleware, (req, res) => {
  try {
    const { title, slug, category, cover_image, content, summary, author, read_time } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: '标题和内容不能为空' });
    }
    
    const postSlug = slug || generateSlug(title);
    const publishedAt = new Date().toISOString();
    const postReadTime = read_time || estimateReadTime(content);
    const postSummary = summary || stripHtml(content).substring(0, 150);
    const postAuthor = author || 'HOLGENVY Editorial Team';
    const postCategory = category || 'industry-trends';
    
    // 1. 保存到数据库
    const insertStmt = db.prepare(`
      INSERT INTO posts (title, slug, category, cover_image, content, summary, author, status, read_time, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);
    
    const result = insertStmt.run(
      title, postSlug, postCategory, cover_image || null,
      content, postSummary, postAuthor, postReadTime, publishedAt
    );
    
    const postId = result.lastInsertRowid;
    
    // 2. 生成帖子详情页
    const post = { id: postId, title, slug: postSlug, category: postCategory, cover_image: cover_image || null, content, summary: postSummary, author: postAuthor, read_time: postReadTime, published_at: publishedAt, created_at: publishedAt };
    const { filename, html } = generatePostHtml(post);
    const detailPath = path.join(FRONTEND_DIR, filename);
    fs.writeFileSync(detailPath, html, 'utf-8');
    
    // 3. 获取所有已发布帖子
    const allStmt = db.prepare('SELECT id, title, slug, category, summary, cover_image, author, read_time, content, published_at, created_at FROM posts WHERE status = 1 ORDER BY published_at DESC');
    const allPosts = allStmt.all();
    
    // 4. 更新 blog.html
    const blogHtml = generateBlogHtml(allPosts);
    const blogPath = path.join(FRONTEND_DIR, 'blog.html');
    fs.writeFileSync(blogPath, blogHtml, 'utf-8');
    
    // 5. 更新 resources.html
    updateResourcesHtml(allPosts);
    
    res.status(201).json({
      success: true,
      data: { id: postId, filename, total_posts: allPosts.length },
      message: '帖子发布成功，前端页面已同步更新'
    });
  } catch (error) {
    console.error('发布帖子错误:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: '帖子 slug 已存在' });
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新帖子
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { title, slug, category, cover_image, content, summary, author, status, read_time } = req.body;
    
    const checkStmt = db.prepare('SELECT id, status FROM posts WHERE id = ?');
    const existing = checkStmt.get(req.params.id);
    
    if (!existing) return res.status(404).json({ error: '帖子不存在' });
    
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
        read_time = COALESCE(?, read_time),
        published_at = COALESCE(?, published_at),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const postSlug = slug || undefined;
    
    updateStmt.run(
      title || null, postSlug || null, category || null, cover_image || null,
      content || null, summary || null, author || null, status ?? null,
      read_time || null, publishedAt, req.params.id
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

// 同步前端静态页面
router.post('/sync-frontend', authMiddleware, (req, res) => {
  try {
    // 获取所有已发布帖子
    const stmt = db.prepare('SELECT id, title, slug, category, summary, cover_image, author, read_time, content, published_at, created_at FROM posts WHERE status = 1 ORDER BY published_at DESC');
    const allPosts = stmt.all();
    
    if (allPosts.length === 0) {
      return res.json({ success: true, message: '没有已发布的帖子需要同步', data: { synced: 0 } });
    }
    
    let syncedCount = 0;
    
    // 1. 重新生成所有帖子详情页
    for (const post of allPosts) {
      const { filename, html } = generatePostHtml(post);
      const detailPath = path.join(FRONTEND_DIR, filename);
      fs.writeFileSync(detailPath, html, 'utf-8');
      syncedCount++;
    }
    
    // 2. 更新 blog.html
    const blogHtml = generateBlogHtml(allPosts);
    const blogPath = path.join(FRONTEND_DIR, 'blog.html');
    fs.writeFileSync(blogPath, blogHtml, 'utf-8');
    
    // 3. 更新 resources.html
    updateResourcesHtml(allPosts);
    
    res.json({
      success: true,
      message: `同步完成，已更新 ${syncedCount} 个帖子页面`,
      data: { synced: syncedCount, total_posts: allPosts.length }
    });
  } catch (error) {
    console.error('同步前端错误:', error);
    res.status(500).json({ error: '服务器错误: ' + error.message });
  }
});

// 删除帖子
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const checkStmt = db.prepare('SELECT id, slug FROM posts WHERE id = ?');
    const existing = checkStmt.get(req.params.id);
    
    if (!existing) return res.status(404).json({ error: '帖子不存在' });
    
    const deleteStmt = db.prepare('DELETE FROM posts WHERE id = ?');
    deleteStmt.run(req.params.id);
    
    // 删除对应的静态HTML文件
    const slug = existing.slug || 'post-' + req.params.id;
    const detailPath = path.join(FRONTEND_DIR, `blog-post-${slug}.html`);
    if (fs.existsSync(detailPath)) {
      fs.unlinkSync(detailPath);
    }
    
    // 同步前端（重新生成 blog.html 和 resources.html）
    syncFrontend();
    
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
    
    // 先获取要删除的帖子slug，用于删除静态文件
    const placeholders = ids.map(() => '?').join(',');
    const slugs = db.prepare(`SELECT slug FROM posts WHERE id IN (${placeholders})`).all(...ids);
    
    const deleteStmt = db.prepare('DELETE FROM posts WHERE id = ?');
    
    const deleteMany = db.transaction((postIds) => {
      for (const id of postIds) {
        deleteStmt.run(id);
      }
    });
    
    deleteMany(ids);
    
    // 删除对应的静态HTML文件
    for (const { slug } of slugs) {
      const detailPath = path.join(FRONTEND_DIR, `blog-post-${slug}.html`);
      if (fs.existsSync(detailPath)) {
        fs.unlinkSync(detailPath);
      }
    }
    
    // 同步前端（重新生成 blog.html 和 resources.html）
    syncFrontend();
    
    res.json({ success: true, message: `成功删除 ${ids.length} 个帖子` });
  } catch (error) {
    console.error('批量删除错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;