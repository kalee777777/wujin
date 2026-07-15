import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api',
  timeout: 30000
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    if (error.response) {
      const { status, data } = error.response;
      const requestUrl = error.config?.url || '';
      
      // 登录接口的401错误显示具体错误信息
      if (status === 401) {
        if (requestUrl.includes('/auth/login')) {
          // 登录失败，显示后端返回的错误信息
          ElMessage.error(data?.error || '用户名或密码错误');
        } else {
          // 其他接口401，说明token过期
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_info');
          router.push('/login');
          ElMessage.error('登录已过期，请重新登录');
        }
      } else {
        ElMessage.error(data?.error || '请求失败');
      }
    } else {
      ElMessage.error('网络错误');
    }
    return Promise.reject(error);
  }
);

export default request;