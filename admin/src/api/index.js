import api from '@/utils/api';

// 登录
export const login = (data) => api.post('/auth/login', data);

// 获取当前用户信息
export const getMe = () => api.get('/auth/me');

// 修改密码
export const changePassword = (data) => api.put('/auth/password', data);

// 获取帖子列表
export const getPosts = (params) => api.get('/posts', { params });

// 获取帖子详情
export const getPost = (id) => api.get(`/posts/${id}`);

// 创建帖子
export const createPost = (data) => api.post('/posts', data);

// 更新帖子
export const updatePost = (id, data) => api.put(`/posts/${id}`, data);

// 删除帖子
export const deletePost = (id) => api.delete(`/posts/${id}`);

// 批量删除帖子
export const batchDeletePosts = (ids) => api.post('/posts/batch-delete', { ids });

// 上传图片
export const uploadImage = (formData, folder = '') => {
  return api.post(`/upload/image?folder=${folder}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// 获取统计数据
export const getDashboardStats = (params) => api.get('/stats/dashboard', { params });

// 记录访问日志
export const logVisit = (data) => api.post('/stats/log', data);

// 获取询盘列表
export const getInquiries = (params) => api.get('/inquiries', { params });

// 获取询盘详情
export const getInquiry = (id) => api.get(`/inquiries/${id}`);

// 更新询盘状态
export const updateInquiry = (id, data) => api.put(`/inquiries/${id}`, data);

// 删除询盘
export const deleteInquiry = (id) => api.delete(`/inquiries/${id}`);

// 批量删除询盘
export const batchDeleteInquiries = (ids) => api.post('/inquiries/batch-delete', { ids });

// 获取询盘统计
export const getInquiryStats = () => api.get('/inquiries/stats/summary');