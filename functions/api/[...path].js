// API catch-all router for all /api/* requests
import { jsonResponse, errorResponse, successResponse } from '../_lib/utils.js';
import * as authRoutes from '../_lib/routes/auth.js';
import * as postRoutes from '../_lib/routes/posts.js';
import * as inquiryRoutes from '../_lib/routes/inquiries.js';
import * as uploadRoutes from '../_lib/routes/upload.js';
import * as productRoutes from '../_lib/routes/products.js';
import * as categoryRoutes from '../_lib/routes/categories.js';
import * as statsRoutes from '../_lib/routes/stats.js';

function getRouteSegments(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\//, '');
  return path.split('/').filter(Boolean);
}

async function dispatch(request, env, segments) {
  const method = request.method;
  const resource = segments[0];
  const subPath = segments.slice(1);

  switch (resource) {
    case 'health':
      return successResponse({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0' });

    case 'auth': {
      const action = subPath[0];
      if (action === 'login' && method === 'POST') return authRoutes.login(request, env);
      if (action === 'me' && method === 'GET') return authRoutes.me(request, env);
      if (action === 'password' && method === 'PUT') return authRoutes.changePassword(request, env);
      if (action === 'logout' && method === 'POST') return authRoutes.logout();
      break;
    }

    case 'posts': {
      if (subPath.length === 0) {
        if (method === 'GET') return postRoutes.list(request, env);
        if (method === 'POST') return postRoutes.create(request, env);
      }
      const action = subPath[0];
      if (action === 'publish' && method === 'POST') return postRoutes.publish(request, env);
      if (action === 'sync-frontend' && method === 'POST') return postRoutes.syncFrontend(request, env);
      if (action === 'batch-delete' && method === 'POST') return postRoutes.batchDelete(request, env);
      if (action === 'published' && subPath[1] === 'all' && method === 'GET') return postRoutes.publishedAll(request, env);
      if (subPath.length === 1 && /^\d+$/.test(action)) {
        if (method === 'GET') return postRoutes.get(request, env, action);
        if (method === 'PUT') return postRoutes.update(request, env, action);
        if (method === 'DELETE') return postRoutes.remove(request, env, action);
      }
      break;
    }

    case 'inquiries': {
      if (subPath.length === 0) {
        if (method === 'GET') return inquiryRoutes.list(request, env);
      }
      const action = subPath[0];
      if (action === 'public' && subPath[1] === 'submit' && method === 'POST') return inquiryRoutes.submit(request, env);
      if (action === 'stats' && subPath[1] === 'summary' && method === 'GET') return inquiryRoutes.statsSummary(request, env);
      if (action === 'batch-delete' && method === 'POST') return inquiryRoutes.batchDelete(request, env);
      if (subPath.length === 1 && /^\d+$/.test(action)) {
        if (method === 'GET') return inquiryRoutes.get(request, env, action);
        if (method === 'PUT') return inquiryRoutes.update(request, env, action);
        if (method === 'DELETE') return inquiryRoutes.remove(request, env, action);
      }
      break;
    }

    case 'upload': {
      if (subPath[0] === 'image') {
        if (method === 'POST') return uploadRoutes.uploadImage(request, env);
        if (method === 'DELETE') return uploadRoutes.deleteImage(request, env);
      }
      break;
    }

    case 'products': {
      if (subPath.length === 0) {
        if (method === 'GET') return productRoutes.list(request, env);
        if (method === 'POST') return productRoutes.create(request, env);
      }
      const action = subPath[0];
      if (action === 'public' && subPath[1] === 'search' && method === 'GET') return productRoutes.publicSearch(request, env);
      if (action === 'batch-delete' && method === 'POST') return productRoutes.batchDelete(request, env);
      if (subPath.length === 1 && /^\d+$/.test(action)) {
        if (method === 'GET') return productRoutes.get(request, env, action);
        if (method === 'PUT') return productRoutes.update(request, env, action);
        if (method === 'DELETE') return productRoutes.remove(request, env, action);
      }
      break;
    }

    case 'categories': {
      if (subPath.length === 0) {
        if (method === 'GET') return categoryRoutes.list(request, env);
        if (method === 'POST') return categoryRoutes.create(request, env);
      }
      if (subPath.length === 1 && /^\d+$/.test(subPath[0])) {
        if (method === 'PUT') return categoryRoutes.update(request, env, subPath[0]);
        if (method === 'DELETE') return categoryRoutes.remove(request, env, subPath[0]);
      }
      break;
    }

    case 'stats': {
      if (subPath[0] === 'log' && method === 'POST') return statsRoutes.log(request, env);
      break;
    }
  }

  return errorResponse('接口不存在', 404);
}

export async function onRequestGet(context) {
  return dispatch(context.request, context.env, getRouteSegments(context.request));
}

export async function onRequestPost(context) {
  return dispatch(context.request, context.env, getRouteSegments(context.request));
}

export async function onRequestPut(context) {
  return dispatch(context.request, context.env, getRouteSegments(context.request));
}

export async function onRequestDelete(context) {
  return dispatch(context.request, context.env, getRouteSegments(context.request));
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
