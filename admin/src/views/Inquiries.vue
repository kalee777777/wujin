<template>
  <div class="inquiries-page">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card mini">
        <div class="stat-label">全部询盘</div>
        <div class="stat-value">{{ stats.total }}</div>
      </div>
      <div class="stat-card mini warning">
        <div class="stat-label">待处理</div>
        <div class="stat-value">{{ stats.pending }}</div>
      </div>
      <div class="stat-card mini success">
        <div class="stat-label">已回复</div>
        <div class="stat-value">{{ stats.replied }}</div>
      </div>
      <div class="stat-card mini">
        <div class="stat-label">已关闭</div>
        <div class="stat-value">{{ stats.closed }}</div>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="stat-card table-toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索姓名/邮箱/公司/产品"
          style="width: 260px;"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button icon="Search" @click="handleSearch" />
          </template>
        </el-input>

        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 140px;" @change="handleSearch">
          <el-option label="待处理" value="pending" />
          <el-option label="已回复" value="replied" />
          <el-option label="已关闭" value="closed" />
        </el-select>
      </div>

      <div class="toolbar-right">
        <el-button type="danger" icon="Delete" :disabled="selectedIds.length === 0" @click="handleBatchDelete">批量删除</el-button>
      </div>
    </div>

    <!-- 询盘列表 -->
    <div class="stat-card">
      <el-table
        :data="inquiries"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="50" />

        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="company" label="公司" width="140">
          <template #default="{ row }">
            {{ row.company || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="subject" label="类型" width="140">
          <template #default="{ row }">
            <el-tag size="small">{{ row.subject }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="products" label="感兴趣产品" min-width="160">
          <template #default="{ row }">
            {{ row.products || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ sourceLabel(row.source) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="success" link size="small"
              @click="handleUpdateStatus(row, 'replied')"
            >标记回复</el-button>
            <el-button
              v-if="row.status !== 'closed'"
              type="warning" link size="small"
              @click="handleUpdateStatus(row, 'closed')"
            >关闭</el-button>
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
          @size-change="fetchInquiries"
          @current-change="fetchInquiries"
        />
      </div>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="询盘详情" width="640px">
      <el-descriptions :column="2" border v-if="currentInquiry">
        <el-descriptions-item label="姓名">{{ currentInquiry.name }}</el-descriptions-item>
        <el-descriptions-item label="公司">{{ currentInquiry.company || '—' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentInquiry.email }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ currentInquiry.phone || '—' }}</el-descriptions-item>
        <el-descriptions-item label="询盘类型">{{ currentInquiry.subject }}</el-descriptions-item>
        <el-descriptions-item label="数量范围">{{ currentInquiry.quantity || '—' }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ sourceLabel(currentInquiry.source) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(currentInquiry.status)" size="small">{{ statusLabel(currentInquiry.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="感兴趣产品" :span="2">{{ currentInquiry.products || '—' }}</el-descriptions-item>
        <el-descriptions-item label="留言内容" :span="2">{{ currentInquiry.message || '—' }}</el-descriptions-item>
        <el-descriptions-item label="IP 地址">{{ currentInquiry.visitor_ip || '—' }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ formatDate(currentInquiry.created_at) }}</el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button
          v-if="currentInquiry && currentInquiry.status === 'pending'"
          type="success"
          @click="handleUpdateStatus(currentInquiry, 'replied'); detailVisible = false;"
        >标记为已回复</el-button>
        <el-button
          v-if="currentInquiry && currentInquiry.status !== 'closed'"
          type="warning"
          @click="handleUpdateStatus(currentInquiry, 'closed'); detailVisible = false;"
        >关闭询盘</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getInquiries, updateInquiry, deleteInquiry, batchDeleteInquiries, getInquiryStats } from '@/api';
import dayjs from 'dayjs';

const loading = ref(false);
const inquiries = ref([]);
const selectedIds = ref([]);
const detailVisible = ref(false);
const currentInquiry = ref(null);

const searchKeyword = ref('');
const filterStatus = ref('');

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
});

const stats = reactive({
  total: 0,
  pending: 0,
  replied: 0,
  closed: 0
});

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

function statusLabel(status) {
  const map = { pending: '待处理', replied: '已回复', closed: '已关闭' };
  return map[status] || status;
}

function statusType(status) {
  const map = { pending: 'warning', replied: 'success', closed: 'info' };
  return map[status] || 'info';
}

function sourceLabel(source) {
  const map = { 'inquiry-page': '询盘页', 'contact-page': '联系页', website: '网站' };
  return map[source] || source || '—';
}

async function fetchStats() {
  try {
    const res = await getInquiryStats();
    if (res.success) {
      Object.assign(stats, res.data);
    }
  } catch (e) {
    // silent
  }
}

async function fetchInquiries() {
  loading.value = true;
  try {
    const res = await getInquiries({
      page: pagination.page,
      limit: pagination.limit,
      keyword: searchKeyword.value,
      status: filterStatus.value
    });
    if (res.success) {
      inquiries.value = res.data.inquiries;
      pagination.total = res.data.pagination.total;
      pagination.totalPages = res.data.pagination.totalPages;
    }
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  fetchInquiries();
}

function handleSelectionChange(selection) {
  selectedIds.value = selection.map(item => item.id);
}

function handleView(row) {
  currentInquiry.value = row;
  detailVisible.value = true;
}

async function handleUpdateStatus(row, status) {
  try {
    const res = await updateInquiry(row.id, { status });
    if (res.success) {
      ElMessage.success('状态更新成功');
      fetchInquiries();
      fetchStats();
    }
  } catch (error) {
    ElMessage.error('操作失败');
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除该询盘吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    const res = await deleteInquiry(row.id);
    if (res.success) {
      ElMessage.success('删除成功');
      fetchInquiries();
      fetchStats();
    }
  } catch (error) {
    // 用户取消
  }
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条询盘吗？`, '批量删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    const res = await batchDeleteInquiries(selectedIds.value);
    if (res.success) {
      ElMessage.success(res.message);
      selectedIds.value = [];
      fetchInquiries();
      fetchStats();
    }
  } catch (error) {
    // 用户取消
  }
}

onMounted(() => {
  fetchInquiries();
  fetchStats();
});
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.stat-card.mini {
  padding: 20px;
}
.stat-card.mini .stat-label {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 8px;
}
.stat-card.mini .stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
}
.stat-card.mini.warning .stat-value { color: #E6A23C; }
.stat-card.mini.success .stat-value { color: #67C23A; }
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
}
.toolbar-right {
  display: flex;
  gap: 8px;
}
</style>
