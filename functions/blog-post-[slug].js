// Serve blog post HTML from R2 (for posts created after Cloudflare migration)
// Existing posts are served directly from Pages Assets (faster)
export async function onRequestGet(context) {
  const { request, env, params } = context;

  // Pages Assets serves existing blog-post-*.html first.
  // This Function only runs when no matching asset is found.
  // It looks for the file in R2.
  let slug = params.slug;
  if (slug.endsWith('.html')) {
    slug = slug.slice(0, -5);
  }

  const r2Key = `blog-post-${slug}.html`;
  const object = await env.BUCKET.get(r2Key);

  if (!object) {
    return new Response('Blog post not found', { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
