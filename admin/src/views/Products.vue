<template>
  <div class="products-page">
    <!-- 操作栏 -->
    <div class="stat-card table-toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索产品名称或描述"
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
          <el-option
            v-for="cat in categories"
            :key="cat.id"
            :label="cat.name"
            :value="cat.id"
          />
        </el-select>
      </div>
      
      <div class="toolbar-right">
        <el-button type="primary" icon="Plus" @click="handleAdd">新增产品</el-button>
        <el-button type="danger" icon="Delete" :disabled="selectedIds.length === 0" @click="handleBatchDelete">批量删除</el-button>
      </div>
    </div>
    
    <!-- 产品列表 -->
    <div class="stat-card">
      <el-table
        :data="products"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="50" />
        
        <el-table-column label="图片" width="80">
          <template #default="{ row }">
            <el-image
              v-if="row.first_image"
              :src="row.first_image"
              :preview-src-list="[row.first_image]"
              style="width: 50px; height: 50px; object-fit: cover;"
              fit="cover"
            />
            <div v-else style="width: 50px; height: 50px; background: #f5f5f5; display: flex; align-items: center; justify-content: center;">
              <el-icon color="#ccc"><Picture /></el-icon>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="产品名称" min-width="180" />
        
        <el-table-column prop="category_name" label="分类" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.category_name" size="small">{{ row.category_name }}</el-tag>
            <span v-else style="color: #999;">未分类</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="views" label="浏览量" width="80" />
        
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
        
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
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
          @size-change="fetchProducts"
          @current-change="fetchProducts"
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
const products = ref([]);
const categories = ref([]);
const selectedIds = ref([]);

const searchKeyword = ref('');
const filterCategory = ref('');

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
});

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

// 获取产品列表
async function fetchProducts() {
  loading.value = true;
  
  try {
    const res = await request.get('/products', {
      params: {
        page: pagination.page,
        limit: pagination.limit,
        keyword: searchKeyword.value,
        category: filterCategory.value
      }
    });
    
    if (res.success) {
      products.value = res.data.products;
      pagination.total = res.data.pagination.total;
      pagination.totalPages = res.data.pagination.totalPages;
    }
  } finally {
    loading.value = false;
  }
}

// 获取分类列表
async function fetchCategories() {
  try {
    const res = await request.get('/categories');
    if (res.success) {
      categories.value = res.data;
    }
  } catch (error) {
    console.error('获取分类失败:', error);
  }
}

function handleSearch() {
  pagination.page = 1;
  fetchProducts();
}

function handleSelectionChange(selection) {
  selectedIds.value = selection.map(item => item.id);
}

function handleAdd() {
  router.push('/products/add');
}

function handleEdit(row) {
  router.push(`/products/edit/${row.id}`);
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除产品 "${row.name}" 吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    const res = await request.delete(`/products/${row.id}`);
    if (res.success) {
      ElMessage.success('删除成功');
      fetchProducts();
    }
  } catch (error) {
    // 用户取消或请求失败
  }
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个产品吗？`, '批量删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    const res = await request.post('/products/batch-delete', { ids: selectedIds.value });
    if (res.success) {
      ElMessage.success(res.message);
      selectedIds.value = [];
      fetchProducts();
    }
  } catch (error) {
    // 用户取消或请求失败
  }
}

onMounted(() => {
  fetchProducts();
  fetchCategories();
});
</script>