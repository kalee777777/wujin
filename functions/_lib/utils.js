// Shared utilities for Cloudflare Pages Functions

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders },
  });
}

export function errorResponse(error, status = 500) {
  return jsonResponse({ success: false, error }, status);
}

export function successResponse(data, message) {
  const body = { success: true };
  if (data !== undefined) body.data = data;
  if (message) body.message = message;
  return jsonResponse(body);
}

export function generateSlug(title) {
  return title.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function estimateReadTime(content) {
  const text = content.replace(/<[^>]+>/g, '');
  const wordCount = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function stripHtml(html) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

const CATEGORY_LABELS = {
  'industry-trends': 'Industry Trends',
  'sourcing-guide': 'Sourcing Guide',
  'product-spotlight': 'Product Spotlight',
  'technical': 'Technical',
  'product-guide': 'Product Guide',
};

export function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

export function getQueryParam(url, name) {
  return url.searchParams.get(name);
}

export function getIntQueryParam(url, name, defaultValue) {
  const val = url.searchParams.get(name);
  if (val === null) return defaultValue;
  return parseInt(val) || defaultValue;
}
