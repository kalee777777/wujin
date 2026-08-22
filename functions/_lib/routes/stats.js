import { successResponse } from '../utils.js';

export async function log(request, env) {
  const { page_type, page_id, page_url, referer } = await request.json();

  const visitorIp = request.headers.get('CF-Connecting-IP') || '';
  const userAgent = request.headers.get('User-Agent') || '';
  const today = new Date().toISOString().split('T')[0];

  await env.DB.prepare(`
    INSERT INTO visit_logs (page_type, page_id, page_url, visitor_ip, user_agent, referer)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    page_type || null,
    page_id || null,
    page_url || null,
    visitorIp,
    userAgent,
    referer || null
  ).run();

  const existing = await env.DB.prepare('SELECT id, pv, uv FROM daily_stats WHERE date = ?')
    .bind(today)
    .first();

  if (existing) {
    const column = page_type === 'product' ? 'product_views' : page_type === 'post' ? 'post_views' : 'pv';
    await env.DB.prepare(`UPDATE daily_stats SET ${column} = ${column} + 1, pv = pv + 1 WHERE date = ?`)
      .bind(today)
      .run();
  } else {
    await env.DB.prepare(`
      INSERT INTO daily_stats (date, pv, uv, product_views, post_views)
      VALUES (?, 1, 1, ?, ?)
    `).bind(
      today,
      page_type === 'product' ? 1 : 0,
      page_type === 'post' ? 1 : 0
    ).run();
  }

  return successResponse(null, '访问记录已保存');
}
