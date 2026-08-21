import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || '请求失败';
    
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
      router.push('/login');
      ElMessage.error('登录已过期，请重新登录');
    } else {
      ElMessage.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;