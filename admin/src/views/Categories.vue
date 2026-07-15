<template>
  <div class="categories-page">
    <div class="stat-card table-toolbar">
      <div class="toolbar-left">
        <h3 style="margin: 0;">分类列表</h3>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" icon="Plus" @click="handleAdd">新增分类</el-button>
      </div>
    </div>
    
    <div class="stat-card">
      <el-table :data="categories" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="icon" label="图标" width="80">
          <template #default="{ row }">
            <span style="font-size: 20px;">{{ row.icon }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="分类名称" />
        <el-table-column prop="slug" label="Slug" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="product_count" label="产品数量" width="100" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '新增分类'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="分类名称" />
        </el-form-item>
        
        <el-form-item label="Slug" prop="slug">
          <el-input v-model="form.slug" placeholder="URL标识，如 drills-drivers" />
        </el-form-item>
        
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="图标，如 ⚙" />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="分类描述" />
        </el-form-item>
        
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';

const loading = ref(false);
const categories = ref([]);
const dialogVisible = ref(false);
const submitting = ref(false);
const isEdit = ref(false);
const editingId = ref(null);

const formRef = ref();
const form = reactive({
  name: '',
  slug: '',
  icon: '',
  description: '',
  sort_order: 0
});

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  slug: [{ required: true, message: '请输入 Slug', trigger: 'blur' }]
};

async function fetchCategories() {
  loading.value = true;
  try {
    const res = await request.get('/categories');
    if (res.success) {
      categories.value = res.data;
    }
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  isEdit.value = false;
  editingId.value = null;
  form.name = '';
  form.slug = '';
  form.icon = '';
  form.description = '';
  form.sort_order = 0;
  dialogVisible.value = true;
}

function handleEdit(row) {
  isEdit.value = true;
  editingId.value = row.id;
  form.name = row.name;
  form.slug = row.slug;
  form.icon = row.icon || '';
  form.description = row.description || '';
  form.sort_order = row.sort_order || 0;
  dialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  
  submitting.value = true;
  
  try {
    let res;
    if (isEdit.value) {
      res = await request.put(`/categories/${editingId.value}`, form);
    } else {
      res = await request.post('/categories', form);
    }
    
    if (res.success) {
      ElMessage.success(isEdit.value ? '分类更新成功' : '分类创建成功');
      dialogVisible.value = false;
      fetchCategories();
    }
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除分类 "${row.name}" 吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    const res = await request.delete(`/categories/${row.id}`);
    if (res.success) {
      ElMessage.success('删除成功');
      fetchCategories();
    }
  } catch (error) {
    // 用户取消或请求失败
  }
}

onMounted(() => {
  fetchCategories();
});
</script>