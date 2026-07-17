import { createRouter, createWebHistory } from 'vue-router';
import { useAdminStore } from '@/stores/admin';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据看板' }
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/Products.vue'),
        meta: { title: '产品管理' }
      },
      {
        path: 'products/add',
        name: 'ProductAdd',
        component: () => import('@/views/ProductEdit.vue'),
        meta: { title: '新增产品' }
      },
      {
        path: 'products/edit/:id',
        name: 'ProductEdit',
        component: () => import('@/views/ProductEdit.vue'),
        meta: { title: '编辑产品' }
      },
      {
        path: 'posts',
        name: 'Posts',
        component: () => import('@/views/Posts.vue'),
        meta: { title: '帖子管理' }
      },
      {
        path: 'posts/add',
        name: 'PostAdd',
        component: () => import('@/views/PostEdit.vue'),
        meta: { title: '新增帖子' }
      },
      {
        path: 'posts/edit/:id',
        name: 'PostEdit',
        component: () => import('@/views/PostEdit.vue'),
        meta: { title: '编辑帖子' }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/Categories.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'inquiries',
        name: 'Inquiries',
        component: () => import('@/views/Inquiries.vue'),
        meta: { title: '询盘管理' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '系统设置' }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const adminStore = useAdminStore();
  
  if (to.meta.requiresAuth && !adminStore.isLoggedIn) {
    next('/login');
  } else if (to.path === '/login' && adminStore.isLoggedIn) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;