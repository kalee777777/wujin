// Serves images from R2 bucket
const CONTENT_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const key = params.path.join('/');
  const ext = key.split('.').pop().toLowerCase();
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

  const object = await env.BUCKET.get(key);

  if (!object) {
    return new Response('Image not found', { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', contentType);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('Access-Control-Allow-Origin', '*');

  return new Response(object.body, { headers });
}
