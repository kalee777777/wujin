<template>
  <div class="settings-page">
    <div class="stat-card">
      <h3 style="margin-bottom: 24px;">系统设置</h3>
      
      <el-tabs>
        <el-tab-pane label="账号设置">
          <el-form label-width="100px">
            <el-form-item label="当前账号">
              <span>{{ adminStore.adminInfo?.username }}</span>
            </el-form-item>
            
            <el-form-item label="角色">
              <el-tag>{{ adminStore.adminInfo?.role }}</el-tag>
            </el-form-item>
            
            <el-form-item label="创建时间">
              <span>{{ formatDate(adminStore.adminInfo?.created_at) }}</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="API 接口">
          <h4 style="margin-bottom: 16px;">外部接口调用说明</h4>
          
          <el-alert type="info" :closable="false" style="margin-bottom: 20px;">
            使用以下 API 接口可以在外部系统中发布产品和帖子。所有接口需要在请求头中携带 Authorization: Bearer {token}
          </el-alert>
          
          <h5 style="margin-bottom: 12px;">产品接口</h5>
          <el-table :data="productApis" size="small" border>
            <el-table-column prop="method" label="方法" width="80" />
            <el-table-column prop="path" label="路径" />
            <el-table-column prop="desc" label="说明" />
          </el-table>
          
          <h5 style="margin: 20px 0 12px;">帖子接口</h5>
          <el-table :data="postApis" size="small" border>
            <el-table-column prop="method" label="方法" width="80" />
            <el-table-column prop="path" label="路径" />
            <el-table-column prop="desc" label="说明" />
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="数据管理">
          <h4 style="margin-bottom: 16px;">数据备份与迁移</h4>
          
          <el-button type="primary" icon="Download" @click="handleExportData">导出产品数据</el-button>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAdminStore } from '@/stores/admin';
import dayjs from 'dayjs';

const adminStore = useAdminStore();

const productApis = ref([
  { method: 'GET', path: '/api/products', desc: '获取产品列表' },
  { method: 'GET', path: '/api/products/:id', desc: '获取单个产品' },
  { method: 'POST', path: '/api/products', desc: '创建产品' },
  { method: 'PUT', path: '/api/products/:id', desc: '更新产品' },
  { method: 'DELETE', path: '/api/products/:id', desc: '删除产品' }
]);

const postApis = ref([
  { method: 'GET', path: '/api/posts', desc: '获取帖子列表' },
  { method: 'GET', path: '/api/posts/:id', desc: '获取单个帖子' },
  { method: 'POST', path: '/api/posts', desc: '创建帖子' },
  { method: 'PUT', path: '/api/posts/:id', desc: '更新帖子' },
  { method: 'DELETE', path: '/api/posts/:id', desc: '删除帖子' }
]);

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-';
}

function handleExportData() {
  // 导出 products.json
  const link = document.createElement('a');
  link.href = '/products.json';
  link.download = 'products.json';
  link.click();
}
</script>