<template>
  <div class="product-edit-page">
    <div class="stat-card">
      <h2 style="margin-bottom: 24px;">{{ isEdit ? '编辑产品' : '新增产品' }}</h2>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        style="max-width: 900px;"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="产品文件夹" prop="folder">
              <el-input v-model="form.folder" placeholder="产品图片存储文件夹名" :disabled="isEdit" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品分类" prop="category_id">
              <el-select v-model="form.category_id" placeholder="请选择分类" style="width: 100%;">
                <el-option
                  v-for="cat in categories"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">发布</el-radio>
                <el-radio :value="0">草稿</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="产品描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入产品描述" />
        </el-form-item>
        
        <!-- 产品图片 -->
        <el-form-item label="产品图片">
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            list-type="picture-card"
            :file-list="fileList"
            :on-success="handleUploadSuccess"
            :on-remove="handleUploadRemove"
            :data="{ folder: form.folder || 'uploads' }"
            accept="image/*"
            multiple
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div style="color: #999; font-size: 12px; margin-top: 8px;">支持 JPG、PNG 格式，建议尺寸 800x800 以上</div>
        </el-form-item>
        
        <!-- 规格参数 -->
        <el-divider content-position="left">规格参数</el-divider>
        
        <div v-for="(item, index) in specItems" :key="index" style="display: flex; gap: 12px; margin-bottom: 12px;">
          <el-input v-model="item.key" placeholder="参数名称" style="width: 150px;" />
          <el-input v-model="item.value" placeholder="参数值" style="flex: 1;" />
          <el-button type="danger" icon="Delete" circle @click="specItems.splice(index, 1)" />
        </div>
        <el-button type="primary" link icon="Plus" @click="specItems.push({ key: '', value: '' })">添加参数</el-button>
        
        <!-- 应用场景 -->
        <el-divider content-position="left">应用场景</el-divider>
        
        <div v-for="(item, index) in form.applications" :key="index" style="margin-bottom: 16px; padding: 16px; background: #f9f9f9; border-radius: 8px;">
          <el-input v-model="item.title" placeholder="场景标题" style="width: 300px; margin-bottom: 8px;" />
          <el-input v-model="item.description" type="textarea" :rows="2" placeholder="场景描述" />
          <el-button type="danger" link size="small" style="margin-top: 8px;" @click="form.applications.splice(index, 1)">删除场景</el-button>
        </div>
        <el-button type="primary" link icon="Plus" @click="form.applications.push({ title: '', description: '' })">添加场景</el-button>
        
        <!-- 认证信息 -->
        <el-divider content-position="left">认证信息</el-divider>
        
        <el-select v-model="form.certifications" multiple placeholder="选择认证" style="width: 100%;">
          <el-option label="CE" value="CE" />
          <el-option label="ISO 9001" value="ISO 9001" />
          <el-option label="RoHS" value="RoHS" />
          <el-option label="FCC" value="FCC" />
          <el-option label="UL" value="UL" />
          <el-option label="GS" value="GS" />
        </el-select>
        
        <!-- 操作按钮 -->
        <el-form-item style="margin-top: 32px;">
          <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const router = useRouter();
const route = useRoute();

const isEdit = computed(() => !!route.params.id);
const productId = computed(() => route.params.id);

const formRef = ref();
const submitting = ref(false);
const categories = ref([]);
const fileList = ref([]);
const specItems = ref([]);

const form = reactive({
  folder: '',
  name: '',
  category_id: null,
  description: '',
  status: 1,
  specs: {},
  applications: [],
  certifications: [],
  downloads: []
});

const rules = {
  name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  folder: [{ required: true, message: '请输入产品文件夹名', trigger: 'blur' }]
};

// 上传配置
const uploadUrl = '/api/upload/image';
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('admin_token')}`
}));

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

// 获取产品详情
async function fetchProduct() {
  if (!productId.value) return;
  
  try {
    const res = await request.get(`/products/${productId.value}`);
    if (res.success) {
      const product = res.data;
      
      form.folder = product.folder;
      form.name = product.name;
      form.category_id = product.category_id;
      form.description = product.description;
      form.status = product.status;
      form.certifications = product.certifications || [];
      form.applications = product.applications || [];
      
      // 规格参数
      if (product.specs && typeof product.specs === 'object') {
        specItems.value = Object.entries(product.specs).map(([key, value]) => ({ key, value }));
      }
      
      // 图片列表
      if (product.images && product.images.length > 0) {
        fileList.value = product.images.map(img => ({
          name: img.image_path,
          url: `/${img.image_path}`
        }));
      }
    }
  } catch (error) {
    console.error('获取产品详情失败:', error);
  }
}

// 图片上传成功
function handleUploadSuccess(response, file, fileList) {
  if (response.success) {
    file.url = `/${response.data.path}`;
  }
}

// 图片移除
function handleUploadRemove(file, fileList) {
  // 如果需要，可以调用删除接口
}

// 提交表单
async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  
  // 构建规格对象
  const specs = {};
  specItems.value.forEach(item => {
    if (item.key && item.value) {
      specs[item.key] = item.value;
    }
  });
  
  // 构建图片路径列表
  const images = fileList.value
    .filter(f => f.url || f.response?.data?.path)
    .map(f => {
      if (f.response?.data?.path) {
        return f.response.data.path;
      }
      return f.url.replace(/^\//, '');
    });
  
  const data = {
    ...form,
    specs,
    images
  };
  
  submitting.value = true;
  
  try {
    let res;
    if (isEdit.value) {
      res = await request.put(`/products/${productId.value}`, data);
    } else {
      res = await request.post('/products', data);
    }
    
    if (res.success) {
      ElMessage.success(isEdit.value ? '产品更新成功' : '产品创建成功');
      router.push('/products');
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  fetchCategories();
  if (isEdit.value) {
    fetchProduct();
  } else {
    // 初始化空数组
    form.applications = [];
    form.certifications = [];
  }
});
</script>