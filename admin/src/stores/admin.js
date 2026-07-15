import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import request from '@/utils/request';

export const useAdminStore = defineStore('admin', () => {
  const token = ref(localStorage.getItem('admin_token') || '');
  const adminInfo = ref(JSON.parse(localStorage.getItem('admin_info') || 'null'));

  const isLoggedIn = computed(() => !!token.value);

  // 登录
  async function login(username, password) {
    const res = await request.post('/auth/login', { username, password });
    if (res.success) {
      token.value = res.data.token;
      adminInfo.value = res.data.admin;
      localStorage.setItem('admin_token', res.data.token);
      localStorage.setItem('admin_info', JSON.stringify(res.data.admin));
    }
    return res;
  }

  // 获取当前用户信息
  async function fetchAdminInfo() {
    const res = await request.get('/auth/me');
    if (res.success) {
      adminInfo.value = res.data;
      localStorage.setItem('admin_info', JSON.stringify(res.data));
    }
    return res;
  }

  // 退出登录
  function logout() {
    token.value = '';
    adminInfo.value = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
  }

  return {
    token,
    adminInfo,
    isLoggedIn,
    login,
    fetchAdminInfo,
    logout
  };
});