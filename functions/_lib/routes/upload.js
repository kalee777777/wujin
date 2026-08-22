import { errorResponse, successResponse } from '../utils.js';
import { verifyAuth } from '../auth.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadImage(request, env) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const url = new URL(request.url);
  const folder = url.searchParams.get('folder') || 'uploads';

  const formData = await request.formData();
  const file = formData.get('image');

  if (!file) {
    return errorResponse('请选择要上传的图片', 400);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return errorResponse('不支持的图片格式，仅支持 JPEG, PNG, GIF, WebP', 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return errorResponse('图片大小不能超过 10MB', 400);
  }

  const ext = file.name.split('.').pop().toLowerCase();
  const filename = `${Date.now()}-${crypto.randomUUID().split('-')[0]}.${ext}`;
  const r2Key = `${folder}/${filename}`;
  const publicPath = `product-images/${r2Key}`;

  const arrayBuffer = await file.arrayBuffer();
  await env.BUCKET.put(r2Key, arrayBuffer, {
    customMetadata: { 'Content-Type': file.type },
  });

  return successResponse(
    { filename, path: publicPath },
    '图片上传成功'
  );
}

export async function deleteImage(request, env) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const { path } = await request.json();

  if (!path) {
    return errorResponse('请提供图片路径', 400);
  }

  const r2Key = path.replace(/^product-images\//, '');

  try {
    await env.BUCKET.delete(r2Key);
  } catch {
    // Ignore errors if file doesn't exist
  }

  return successResponse(null, '图片删除成功');
}
