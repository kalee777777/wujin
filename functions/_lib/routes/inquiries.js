import { errorResponse, successResponse, getIntQueryParam, getQueryParam } from '../utils.js';
import { verifyAuth } from '../auth.js';

export async function submit(request, env) {
  const body = await request.json();
  const { name, company, email, phone, subject, products, quantity, message, source } = body;

  if (!name || !name.trim()) return errorResponse('姓名不能为空', 400);
  if (!email || !email.trim()) return errorResponse('邮箱不能为空', 400);
  if (!subject || !subject.trim()) return errorResponse('请选择询盘类型', 400);

  const visitorIp = request.headers.get('CF-Connecting-IP') || '';

  const result = await env.DB.prepare(`
    INSERT INTO inquiries (name, company, email, phone, subject, products, quantity, message, source, visitor_ip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    name.trim(), (company || '').trim(), email.trim(), (phone || '').trim(),
    subject.trim(), (products || '').trim(), (quantity || '').trim(),
    (message || '').trim(), source || 'website', visitorIp
  ).run();

  return successResponse(
    { id: result.meta.last_row_id },
    '询盘提交成功，我们将尽快回复您！'
  );
}

export async function statsSummary(request, env) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const total = await env.DB.prepare('SELECT COUNT(*) as count FROM inquiries').first();
  const pending = await env.DB.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'pending'").first();
  const replied = await env.DB.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'replied'").first();
  const closed = await env.DB.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'closed'").first();

  return successResponse({
    total: total.count, pending: pending.count, replied: replied.count, closed: closed.count,
  });
}

export async function list(request, env) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const url = new URL(request.url);
  const page = getIntQueryParam(url, 'page', 1);
  const limit = getIntQueryParam(url, 'limit', 20);
  const offset = (page - 1) * limit;
  const keyword = getQueryParam(url, 'keyword');
  const status = getQueryParam(url, 'status');

  let whereClauses = [];
  let params = [];

  if (keyword) {
    whereClauses.push('(name LIKE ? OR email LIKE ? OR company LIKE ? OR products LIKE ? OR message LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (status) {
    whereClauses.push('status = ?');
    params.push(status);
  }

  const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  const { total } = await env.DB.prepare(`SELECT COUNT(*) as total FROM inquiries ${whereSQL}`)
    .bind(...params)
    .first();

  const { results: inquiries } = await env.DB.prepare(`
    SELECT * FROM inquiries ${whereSQL}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all();

  return successResponse({
    inquiries,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function get(request, env, id) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const inquiry = await env.DB.prepare('SELECT * FROM inquiries WHERE id = ?')
    .bind(id)
    .first();

  if (!inquiry) return errorResponse('询盘不存在', 404);

  return successResponse(inquiry);
}

export async function update(request, env, id) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const { status } = await request.json();

  const existing = await env.DB.prepare('SELECT id FROM inquiries WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) return errorResponse('询盘不存在', 404);

  await env.DB.prepare(`
    UPDATE inquiries SET status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(status || null, id).run();

  return successResponse(null, '询盘状态更新成功');
}

export async function remove(request, env, id) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const existing = await env.DB.prepare('SELECT id FROM inquiries WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) return errorResponse('询盘不存在', 404);

  await env.DB.prepare('DELETE FROM inquiries WHERE id = ?').bind(id).run();

  return successResponse(null, '询盘删除成功');
}

export async function batchDelete(request, env) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const { ids } = await request.json();

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return errorResponse('请提供要删除的询盘 ID 列表', 400);
  }

  const placeholders = ids.map(() => '?').join(',');
  await env.DB.prepare(`DELETE FROM inquiries WHERE id IN (${placeholders})`)
    .bind(...ids)
    .run();

  return successResponse(null, `成功删除 ${ids.length} 条询盘`);
}
