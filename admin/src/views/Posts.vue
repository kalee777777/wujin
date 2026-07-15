<template>
  <div class="posts-page">
    <!-- 操作栏 -->
    <div class="stat-card table-toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索帖子标题"
          style="width: 250px;"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button icon="Search" @click="handleSearch" />
          </template>
        </el-input>
        
        <el-select v-model="filterCategory" placeholder="选择分类" clearable style="width: 180px;" @change="handleSearch">
          <el-option label="Industry Trends" value="industry-trends" />
          <el-option label="Sourcing Guide" value="sourcing-guide" />
          <el-option label="Product Spotlight" value="product-spotlight" />
          <el-option label="Technical" value="technical" />
          <el-option label="Product Guide" value="product-guide" />
        </el-select>
        
        <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 120px;" @change="handleSearch">
          <el-option label="已发布" :value="1" />
          <el-option label="草稿" :value="0" />
        </el-select>
      </div>
      
      <div class="toolbar-right">
        <el-button type="warning" :loading="syncing" icon="Refresh" @click="handleSyncFrontend" style="margin-right: 8px;">
          同步前端页面
        </el-button>
        <el-button type="primary" icon="Plus" @click="handleAdd">新增帖子</el-button>
        <el-button type="danger" icon="Delete" :disabled="selectedIds.length === 0" @click="handleBatchDelete">批量删除</el-button>
      </div>
    </div>
    
    <!-- 帖子列表 -->
    <div class="stat-card">
      <el-table
        :data="posts"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="50" />
        
        <el-table-column label="封面" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.cover_image"
              :src="row.cover_image"
              style="width: 80px; height: 50px; object-fit: cover;"
              fit="cover"
            />
            <div v-else style="width: 80px; height: 50px; background: #f5f5f5; display: flex; align-items: center; justify-content: center;">
              <el-icon color="#ccc"><Picture /></el-icon>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="title" label="标题" min-width="200" />
        
        <el-table-column label="分类" width="140">
          <template #default="{ row }">
            <el-tag size="small">{{ getCategoryLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="views" label="浏览量" width="80" />
        <el-table-column :label="'阅读时间'" width="90">
          <template #default="{ row }">
            {{ row.read_time || '—' }} min
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link size="small" :loading="syncingRow === row.id" @click="handlePublish(row)">发布</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchPosts"
          @current-change="fetchPosts"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';
import dayjs from 'dayjs';

const router = useRouter();

const loading = ref(false);
const syncing = ref(false);
const syncingRow = ref(null);
const posts = ref([]);
const selectedIds = ref([]);

const searchKeyword = ref('');
const filterCategory = ref('');
const filterStatus = ref('');

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
});

const categoryLabels = {
  'industry-trends': 'Industry Trends',
  'sourcing-guide': 'Sourcing Guide',
  'product-spotlight': 'Product Spotlight',
  technical: 'Technical',
  'product-guide': 'Product Guide',
  news: 'News',
  industry: 'Industry',
  product: 'Product'
};

function getCategoryLabel(category) {
  return categoryLabels[category] || category || '—';
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

async function fetchPosts() {
  loading.value = true;
  
  try {
    const res = await request.get('/posts', {
      params: {
        page: pagination.page,
        limit: pagination.limit,
        keyword: searchKeyword.value,
        category: filterCategory.value,
        status: filterStatus.value
      }
    });
    
    if (res.success) {
      posts.value = res.data.posts;
      pagination.total = res.data.pagination.total;
      pagination.totalPages = res.data.pagination.totalPages;
    }
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  fetchPosts();
}

function handleSelectionChange(selection) {
  selectedIds.value = selection.map(item => item.id);
}

function handleAdd() {
  router.push('/posts/add');
}

function handleEdit(row) {
  router.push(`/posts/edit/${row.id}`);
}

async function handlePublish(row) {
  try {
    await ElMessageBox.confirm(
      `发布"${row.title}"后将自动同步到前端页面，是否继续？`,
      '确认发布',
      { confirmButtonText: '发布并同步', cancelButtonText: '取消', type: 'info' }
    );
    
    syncingRow.value = row.id;
    
    // 先更新状态为发布
    await request.put(`/posts/${row.id}`, { status: 1 });
    // 同步前端
    const res = await request.post('/posts/sync-frontend');
    
    if (res.success) {
      ElMessage.success(res.message || '发布同步成功');
      fetchPosts();
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('发布失败');
    }
  } finally {
    syncingRow.value = null;
  }
}

async function handleSyncFrontend() {
  try {
    await ElMessageBox.confirm(
      '将根据所有已发布的帖子重新生成前端静态页面：\n1. 重新生成所有帖子详情页\n2. 更新 blog.html 列表\n3. 同步 Latest Blog 板块\n\n是否继续？',
      '同步前端页面',
      { confirmButtonText: '开始同步', cancelButtonText: '取消', type: 'info' }
    );
    
    syncing.value = true;
    const res = await request.post('/posts/sync-frontend');
    
    if (res.success) {
      ElMessage.success(res.message || '同步完成');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('同步失败');
    }
  } finally {
    syncing.value = false;
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除帖子 "${row.title}" 吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    const res = await request.delete(`/posts/${row.id}`);
    if (res.success) {
      ElMessage.success('删除成功');
      fetchPosts();
    }
  } catch (error) {
    // 用户取消或请求失败
  }
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个帖子吗？`, '批量删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    const res = await request.post('/posts/batch-delete', { ids: selectedIds.value });
    if (res.success) {
      ElMessage.success(res.message);
      selectedIds.value = [];
      fetchPosts();
    }
  } catch (error) {
    // 用户取消或请求失败
  }
}

onMounted(() => {
  fetchPosts();
});
</script>