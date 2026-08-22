import { errorResponse, successResponse } from '../utils.js';
import { verifyAuth } from '../auth.js';

export async function list(request, env) {
  const { results: categories } = await env.DB.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 1) as product_count
    FROM categories c
    ORDER BY c.sort_order
  `).all();

  return successResponse(categories);
}

export async function create(request, env) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const { name, slug, description, icon, sort_order } = await request.json();

  if (!name || !slug) {
    return errorResponse('名称和 slug 不能为空', 400);
  }

  try {
    const result = await env.DB.prepare(`
      INSERT INTO categories (name, slug, description, icon, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `).bind(name, slug, description || null, icon || null, sort_order || 0).run();

    return successResponse({ id: result.meta.last_row_id }, '分类创建成功');
  } catch (error) {
    if (error.message?.includes('UNIQUE')) {
      return errorResponse('分类名称或 slug 已存在', 400);
    }
    return errorResponse('服务器错误', 500);
  }
}

export async function update(request, env, id) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const { name, slug, description, icon, sort_order } = await request.json();

  const existing = await env.DB.prepare('SELECT id FROM categories WHERE id = ?').bind(id).first();
  if (!existing) return errorResponse('分类不存在', 404);

  try {
    await env.DB.prepare(`
      UPDATE categories SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        description = COALESCE(?, description),
        icon = COALESCE(?, icon),
        sort_order = COALESCE(?, sort_order)
      WHERE id = ?
    `).bind(name || null, slug || null, description || null, icon || null, sort_order ?? null, id).run();

    return successResponse(null, '分类更新成功');
  } catch (error) {
    if (error.message?.includes('UNIQUE')) {
      return errorResponse('分类名称或 slug 已存在', 400);
    }
    return errorResponse('服务器错误', 500);
  }
}

export async function remove(request, env, id) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const { count } = await env.DB.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?')
    .bind(id).first();

  if (count > 0) {
    return errorResponse('该分类下还有产品，无法删除', 400);
  }

  await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();

  return successResponse(null, '分类删除成功');
}
