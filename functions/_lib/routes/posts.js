// Posts routes — static HTML generation approach
// Existing posts served from Pages Assets; new posts uploaded to R2
import { jsonResponse, errorResponse, successResponse, generateSlug, estimateReadTime, formatDate, stripHtml, getCategoryLabel, getIntQueryParam, getQueryParam } from '../utils.js';
import { verifyAuth } from '../auth.js';

// ===================== HTML Generation =====================

function generatePostHtml(post) {
  const slug = post.slug || generateSlug(post.title);
  const filename = `blog-post-${slug}.html`;
  const categoryLabel = getCategoryLabel(post.category);
  const dateFormatted = formatDate(post.published_at || post.created_at);
  const readTime = post.read_time || estimateReadTime(post.content || '');
  const summary = post.summary || stripHtml(post.content || '').substring(0, 150);
  const content = post.content || '';

  const coverImg = post.cover_image
    ? `<img src="${post.cover_image}" alt="${post.title}" style="width:100%;height:100%;object-fit:cover;">`
    : `<div class="img-placeholder hero-img-placeholder">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span>Featured Image Placeholder</span>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} | HOLGENVY Blog</title>
    <meta name="description" content="${summary}">
    <meta name="keywords" content="${categoryLabel.toLowerCase()}, power tools, holgenvy">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://www.holgenvy.com/${filename}">
    <meta property="og:title" content="${post.title} | HOLGENVY">
    <meta property="og:description" content="${summary}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://www.holgenvy.com/${filename}">
    ${post.cover_image ? `<meta property="og:image" content="${post.cover_image}">` : ''}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="site-header"></div>
    <div id="site-nav"></div>

    <section class="blog-hero">
        <div class="blog-hero-bg">${coverImg}</div>
        <div class="blog-hero-overlay"></div>
    </section>

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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                    Back to Blog
                </a>
                <div class="blog-post-meta-inline">
                    <span class="meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${dateFormatted}
                    </span>
                    <span class="meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
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
                            <button class="share-btn-circle linkedin" onclick="shareOnLinkedIn()" title="LinkedIn"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></button>
                            <button class="share-btn-circle twitter" onclick="shareOnTwitter()" title="Twitter"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></button>
                            <button class="share-btn-circle copy" onclick="copyLink()" title="Copy link"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>
                            <button class="share-btn-circle email" onclick="shareByEmail()" title="Email"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></button>
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
                    <div class="sidebar-tags"><a href="blog.html" class="sidebar-tag">${categoryLabel}</a></div>
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
</html>`;

  return { filename, html };
}

function generateBlogCard(post, filename) {
  const categoryLabel = getCategoryLabel(post.category);
  const dateFormatted = formatDate(post.published_at || post.created_at);
  const summary = post.summary || stripHtml(post.content || '').substring(0, 150);
  const coverImg = post.cover_image
    ? `<img src="${post.cover_image}" alt="${post.title}" loading="lazy">`
    : `<div class="img-placeholder"><span>Blog Image</span></div>`;

  return `                <a href="${filename}" class="blog-card">
                    <div class="blog-img">${coverImg}</div>
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

function generateBlogHtml(posts) {
  const cards = posts.map((post) => {
    const slug = post.slug || generateSlug(post.title);
    return generateBlogCard(post, `blog-post-${slug}.html`);
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

function generateBlogCardSection(posts) {
  if (posts.length === 0) return '';
  const top3 = posts.slice(0, 3);
  const cards = top3.map((post) => {
    const slug = post.slug || generateSlug(post.title);
    const categoryLabel = getCategoryLabel(post.category);
    const dateFormatted = formatDate(post.published_at || post.created_at);
    const summary = post.summary || stripHtml(post.content || '').substring(0, 150);
    const coverImg = post.cover_image
      ? `<img src="${post.cover_image}" alt="${post.title}" loading="lazy">`
      : `<div class="img-placeholder"><span>Blog Image</span></div>`;
    return `                    <a href="blog-post-${slug}.html" class="blog-card">
                        <div class="blog-img">${coverImg}</div>
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </a>
                </div>
                <div class="blog-grid">
${cards}
                </div>
                <!-- END_BLOG_SECTION -->`;
}

// ===================== R2 Helpers =====================

async function uploadToR2(env, key, content, contentType = 'text/html; charset=utf-8') {
  await env.BUCKET.put(key, content, {
    customMetadata: { 'Content-Type': contentType },
  });
}

async function deleteFromR2(env, key) {
  try { await env.BUCKET.delete(key); } catch {}
}

async function getAllPublishedPosts(env) {
  const { results } = await env.DB.prepare(`
    SELECT id, title, slug, category, cover_image, summary, author, read_time, content, published_at, created_at
    FROM posts WHERE status = 1 ORDER BY published_at DESC
  `).all();
  return results;
}

async function syncBlogAndResources(env) {
  const allPosts = await getAllPublishedPosts(env);

  if (allPosts.length > 0) {
    // Rebuild blog.html
    const blogHtml = generateBlogHtml(allPosts);
    await uploadToR2(env, 'blog.html', blogHtml);

    // Rebuild resources.html blog section — need current content
    const resourcesObj = await env.BUCKET.get('resources.html');
    if (resourcesObj) {
      let content = await resourcesObj.text();
      const newBlogSection = generateBlogCardSection(allPosts);
      const markerRegex = /<!-- BEGIN_BLOG_SECTION -->[\s\S]*?<!-- END_BLOG_SECTION -->/;
      if (markerRegex.test(content)) {
        content = content.replace(markerRegex, newBlogSection);
      }
      await uploadToR2(env, 'resources.html', content);
    }
  }
}

// ===================== API Routes =====================

export async function list(request, env) {
  const url = new URL(request.url);
  const page = getIntQueryParam(url, 'page', 1);
  const limit = getIntQueryParam(url, 'limit', 20);
  const offset = (page - 1) * limit;
  const category = getQueryParam(url, 'category');
  const keyword = getQueryParam(url, 'keyword');
  const status = getQueryParam(url, 'status');

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
  if (status !== null && status !== '') {
    whereClauses.push('status = ?');
    params.push(parseInt(status));
  }

  const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  const { total } = await env.DB.prepare(`SELECT COUNT(*) as total FROM posts ${whereSQL}`)
    .bind(...params)
    .first();

  const { results: posts } = await env.DB.prepare(`
    SELECT id, title, slug, category, cover_image, summary, author, status, views, read_time, published_at, created_at, updated_at
    FROM posts ${whereSQL}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all();

  return successResponse({
    posts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function publishedAll(request, env) {
  const { results: posts } = await env.DB.prepare(`
    SELECT id, title, slug, category, summary, cover_image, author, read_time, content, published_at, created_at
    FROM posts WHERE status = 1
    ORDER BY published_at DESC
  `).all();

  return successResponse(posts);
}

export async function get(request, env, id) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
  if (!post) return errorResponse('帖子不存在', 404);

  return successResponse(post);
}

export async function create(request, env) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const body = await request.json();
  const { title, slug, category, cover_image, content, summary, author, status, read_time } = body;

  if (!title || !content) return errorResponse('标题和内容不能为空', 400);

  const postSlug = slug || generateSlug(title);
  const publishedAt = status === 1 ? new Date().toISOString() : null;
  const postReadTime = read_time || estimateReadTime(content);

  try {
    const result = await env.DB.prepare(`
      INSERT INTO posts (title, slug, category, cover_image, content, summary, author, status, read_time, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title, postSlug, category || 'industry-trends', cover_image || null,
      content, summary || stripHtml(content).substring(0, 150),
      author || 'HOLGENVY Editorial Team', status ?? 0, postReadTime, publishedAt
    ).run();

    return successResponse({ id: result.meta.last_row_id }, '帖子创建成功');
  } catch (error) {
    if (error.message?.includes('UNIQUE')) return errorResponse('帖子 slug 已存在', 400);
    return errorResponse('服务器错误', 500);
  }
}

// Publish: save to D1 + generate static HTML + upload to R2 + sync blog/resources
export async function publish(request, env) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const body = await request.json();
  const { title, slug, category, cover_image, content, summary, author, read_time } = body;

  if (!title || !content) return errorResponse('标题和内容不能为空', 400);

  const postSlug = slug || generateSlug(title);
  const publishedAt = new Date().toISOString();
  const postReadTime = read_time || estimateReadTime(content);
  const postSummary = summary || stripHtml(content).substring(0, 150);
  const postAuthor = author || 'HOLGENVY Editorial Team';
  const postCategory = category || 'industry-trends';

  try {
    // 1. Save to D1
    const result = await env.DB.prepare(`
      INSERT INTO posts (title, slug, category, cover_image, content, summary, author, status, read_time, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      title, postSlug, postCategory, cover_image || null,
      content, postSummary, postAuthor, postReadTime, publishedAt
    ).run();

    const postId = result.meta.last_row_id;

    // 2. Generate post detail HTML and upload to R2
    const post = { id: postId, title, slug: postSlug, category: postCategory, cover_image: cover_image || null, content, summary: postSummary, author: postAuthor, read_time: postReadTime, published_at: publishedAt, created_at: publishedAt };
    const { filename, html: postHtml } = generatePostHtml(post);
    await uploadToR2(env, filename, postHtml);

    // 3. Sync blog.html and resources.html
    await syncBlogAndResources(env);

    return successResponse(
      { id: postId, filename },
      '帖子发布成功，静态页面已生成并上传'
    );
  } catch (error) {
    if (error.message?.includes('UNIQUE')) return errorResponse('帖子 slug 已存在', 400);
    return errorResponse('服务器错误', 500);
  }
}

export async function update(request, env, id) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const body = await request.json();
  const { title, slug, category, cover_image, content, summary, author, status, read_time } = body;

  const existing = await env.DB.prepare('SELECT id, status FROM posts WHERE id = ?').bind(id).first();
  if (!existing) return errorResponse('帖子不存在', 404);

  let publishedAt = null;
  if (status === 1 && existing.status !== 1) {
    publishedAt = new Date().toISOString();
  }

  try {
    await env.DB.prepare(`
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
    `).bind(
      title || null, slug || null, category || null, cover_image || null,
      content || null, summary || null, author || null, status ?? null,
      read_time || null, publishedAt, id
    ).run();

    // If post is published, regenerate its HTML in R2
    if (status === 1 || existing.status === 1) {
      const updatedPost = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
      if (updatedPost && updatedPost.status === 1) {
        const slug2 = updatedPost.slug || generateSlug(updatedPost.title);
        const { filename, html } = generatePostHtml(updatedPost);
        await uploadToR2(env, filename, html);
        await syncBlogAndResources(env);
      }
    }

    return successResponse(null, '帖子更新成功');
  } catch (error) {
    if (error.message?.includes('UNIQUE')) return errorResponse('帖子 slug 已存在', 400);
    return errorResponse('服务器错误', 500);
  }
}

export async function syncFrontend(request, env) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const allPosts = await getAllPublishedPosts(env);

  let syncedCount = 0;
  for (const post of allPosts) {
    const { filename, html } = generatePostHtml(post);
    await uploadToR2(env, filename, html);
    syncedCount++;
  }

  await syncBlogAndResources(env);

  return successResponse(
    { synced: syncedCount, total_posts: allPosts.length },
    `同步完成，已更新 ${syncedCount} 个帖子静态页面`
  );
}

export async function remove(request, env, id) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const existing = await env.DB.prepare('SELECT id, slug FROM posts WHERE id = ?').bind(id).first();
  if (!existing) return errorResponse('帖子不存在', 404);

  // Delete from D1
  await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();

  // Delete static HTML from R2
  const slugName = existing.slug || 'post-' + id;
  await deleteFromR2(env, `blog-post-${slugName}.html`);

  // Sync blog.html and resources.html
  await syncBlogAndResources(env);

  return successResponse(null, '帖子删除成功');
}

export async function batchDelete(request, env) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const { ids } = await request.json();
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return errorResponse('请提供要删除的帖子 ID 列表', 400);
  }

  // Get slugs before deleting
  const placeholders = ids.map(() => '?').join(',');
  const { results: slugs } = await env.DB.prepare(`SELECT slug FROM posts WHERE id IN (${placeholders})`)
    .bind(...ids)
    .all();

  await env.DB.prepare(`DELETE FROM posts WHERE id IN (${placeholders})`)
    .bind(...ids)
    .run();

  // Delete HTML files from R2
  for (const { slug } of slugs) {
    await deleteFromR2(env, `blog-post-${slug}.html`);
  }

  await syncBlogAndResources(env);

  return successResponse(null, `成功删除 ${ids.length} 个帖子`);
}
