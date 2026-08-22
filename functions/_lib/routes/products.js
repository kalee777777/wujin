import { errorResponse, successResponse, getIntQueryParam, getQueryParam } from '../utils.js';
import { verifyAuth } from '../auth.js';

export async function publicSearch(request, env) {
  const url = new URL(request.url);
  const q = getQueryParam(url, 'q') || '';
  const limit = getIntQueryParam(url, 'limit', 8);

  const { results } = await env.DB.prepare(`
    SELECT p.id, p.folder, p.name, p.description, pi.image_path
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.sort_order = 0
    WHERE p.status = 1 AND (p.name LIKE ? OR p.description LIKE ?)
    LIMIT ?
  `).bind(`%${q}%`, `%${q}%`, limit).all();

  const products = results.map(p => ({
    ...p,
    image_url: p.image_path ? `/product-images/${p.image_path}` : null,
  }));

  return successResponse(products);
}

export async function list(request, env) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

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
    whereClauses.push('category_id = ?');
    params.push(category);
  }
  if (keyword) {
    whereClauses.push('(name LIKE ? OR description LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (status !== null && status !== '') {
    whereClauses.push('status = ?');
    params.push(parseInt(status));
  }

  const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  const { total } = await env.DB.prepare(`SELECT COUNT(*) as total FROM products ${whereSQL}`)
    .bind(...params)
    .first();

  const { results: products } = await env.DB.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ${whereSQL}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all();

  return successResponse({
    products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function get(request, env, id) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const product = await env.DB.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).bind(id).first();

  if (!product) return errorResponse('产品不存在', 404);

  const { results: images } = await env.DB.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order')
    .bind(id).all();

  product.images = images;
  if (product.specs) {
    try { product.specs = JSON.parse(product.specs); } catch {}
  }
  if (product.applications) {
    try { product.applications = JSON.parse(product.applications); } catch {}
  }
  if (product.certifications) {
    try { product.certifications = JSON.parse(product.certifications); } catch {}
  }

  return successResponse(product);
}

export async function create(request, env) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const body = await request.json();
  const { folder, name, category_id, description, specs, applications, certifications, downloads, images } = body;

  if (!folder || !name) {
    return errorResponse('文件夹和名称不能为空', 400);
  }

  const result = await env.DB.prepare(`
    INSERT INTO products (folder, name, category_id, description, specs, applications, certifications, downloads, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).bind(
    folder, name, category_id || null, description || null,
    specs ? JSON.stringify(specs) : null,
    applications ? JSON.stringify(applications) : null,
    certifications ? JSON.stringify(certifications) : null,
    downloads ? JSON.stringify(downloads) : null
  ).run();

  const productId = result.meta.last_row_id;

  if (images && Array.isArray(images)) {
    for (let i = 0; i < images.length; i++) {
      await env.DB.prepare('INSERT INTO product_images (product_id, image_path, sort_order) VALUES (?, ?, ?)')
        .bind(productId, images[i].image_path || images[i], i)
        .run();
    }
  }

  return successResponse({ id: productId }, '产品创建成功');
}

export async function update(request, env, id) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const body = await request.json();
  const { folder, name, category_id, description, specs, applications, certifications, downloads, status, images } = body;

  const existing = await env.DB.prepare('SELECT id FROM products WHERE id = ?').bind(id).first();
  if (!existing) return errorResponse('产品不存在', 404);

  await env.DB.prepare(`
    UPDATE products SET
      folder = COALESCE(?, folder),
      name = COALESCE(?, name),
      category_id = COALESCE(?, category_id),
      description = COALESCE(?, description),
      specs = COALESCE(?, specs),
      applications = COALESCE(?, applications),
      certifications = COALESCE(?, certifications),
      downloads = COALESCE(?, downloads),
      status = COALESCE(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    folder || null, name || null, category_id || null, description || null,
    specs ? JSON.stringify(specs) : null,
    applications ? JSON.stringify(applications) : null,
    certifications ? JSON.stringify(certifications) : null,
    downloads ? JSON.stringify(downloads) : null,
    status ?? null, id
  ).run();

  if (images && Array.isArray(images)) {
    await env.DB.prepare('DELETE FROM product_images WHERE product_id = ?').bind(id).run();
    for (let i = 0; i < images.length; i++) {
      await env.DB.prepare('INSERT INTO product_images (product_id, image_path, sort_order) VALUES (?, ?, ?)')
        .bind(id, images[i].image_path || images[i], i)
        .run();
    }
  }

  return successResponse(null, '产品更新成功');
}

export async function remove(request, env, id) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const existing = await env.DB.prepare('SELECT id FROM products WHERE id = ?').bind(id).first();
  if (!existing) return errorResponse('产品不存在', 404);

  await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();

  return successResponse(null, '产品删除成功');
}

export async function batchDelete(request, env) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const { ids } = await request.json();
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return errorResponse('请提供要删除的产品 ID 列表', 400);
  }

  const placeholders = ids.map(() => '?').join(',');
  await env.DB.prepare(`DELETE FROM products WHERE id IN (${placeholders})`)
    .bind(...ids)
    .run();

  return successResponse(null, `成功删除 ${ids.length} 个产品`);
}
