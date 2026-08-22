<template>
  <div class="post-edit-page">
    <div class="stat-card">
      <h2 style="margin-bottom: 24px;">{{ isEdit ? '编辑帖子' : '新增帖子' }}</h2>
      
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="16">
            <el-form-item label="标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入帖子标题" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">发布</el-radio>
                <el-radio :value="0">草稿</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="分类">
              <el-select v-model="form.category" style="width: 100%;">
                <el-option label="Industry Trends" value="industry-trends" />
                <el-option label="Sourcing Guide" value="sourcing-guide" />
                <el-option label="Product Spotlight" value="product-spotlight" />
                <el-option label="Technical" value="technical" />
                <el-option label="Product Guide" value="product-guide" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="作者">
              <el-input v-model="form.author" placeholder="作者名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="阅读时间（分钟）">
              <el-input-number v-model="form.read_time" :min="1" :max="60" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Slug（自动生成）">
              <el-input v-model="form.slug" placeholder="留空自动生成" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="封面图片">
          <el-upload :action="uploadUrl" :headers="uploadHeaders" :show-file-list="false"
            name="image" :on-success="handleCoverUpload" :on-error="handleCoverUploadError"
            accept="image/*">
            <div v-if="form.cover_image" style="position: relative;">
              <el-image :src="form.cover_image" style="width: 200px; height: 120px; object-fit: cover;" fit="cover" />
              <div style="position: absolute; top: 0; right: 0; padding: 4px;">
                <el-button type="danger" size="small" icon="Delete" circle @click.stop="form.cover_image = ''" />
              </div>
            </div>
            <div v-else style="width: 200px; height: 120px; border: 1px dashed #ddd; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div style="text-align: center;">
                <el-icon size="24" color="#ccc"><Plus /></el-icon>
                <div style="font-size: 12px; color: #999; margin-top: 4px;">上传封面</div>
              </div>
            </div>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="摘要">
          <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="帖子摘要，不填写则自动截取正文前150字" />
        </el-form-item>
        
        <el-form-item label="内容" prop="content">
          <div style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">
            <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef" :defaultConfig="toolbarConfig" mode="default" />
            <Editor style="height: 400px; overflow-y: hidden;" v-model="form.content" :defaultConfig="editorConfig" mode="default" @onCreated="handleCreated" />
          </div>
        </el-form-item>
        
        <el-form-item style="margin-top: 24px;">
          <el-button type="primary" :loading="submitting" @click="handleSubmit">保存草稿</el-button>
          <el-button type="success" :loading="publishing" @click="handlePublish" style="margin-left: 12px;">
            <el-icon style="margin-right: 4px;"><Upload /></el-icon>
            发布并同步前端
          </el-button>
          <el-button @click="$router.back()">取消</el-button>
          <el-tag v-if="lastSync" type="info" style="margin-left: 12px;">
            上次同步: {{ lastSync }}
          </el-tag>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';

const router = useRouter();
const route = useRoute();

const isEdit = computed(() => !!route.params.id);
const postId = computed(() => route.params.id);

const formRef = ref();
const submitting = ref(false);
const publishing = ref(false);
const editorRef = shallowRef();
const lastSync = ref('');

const form = reactive({
  title: '',
  slug: '',
  category: 'industry-trends',
  cover_image: '',
  summary: '',
  author: 'HOLGENVY Editorial Team',
  content: '',
  status: 0,
  read_time: 5
});

const rules = {
  title: [{ required: true, message: '请输入帖子标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入帖子内容', trigger: 'change' }]
};

const uploadUrl = '/api/upload/image';
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('admin_token')}`
}));

const toolbarConfig = { excludeKeys: ['group-video'] };

const editorConfig = {
  placeholder: '请输入帖子内容...',
  MENU_CONF: {
    uploadImage: {
      server: '/api/upload/image',
      fieldName: 'image',
      headers: uploadHeaders.value,
      customInsert(res, insertFn) {
        if (res.success) {
          insertFn(`/${res.data.path}`, res.data.filename, `/${res.data.path}`);
        }
      }
    }
  }
};

function handleCreated(editor) { editorRef.value = editor; }
function handleCoverUpload(response) {
  if (response.success) { form.cover_image = `/${response.data.path}`; }
}
function handleCoverUploadError(error) {
  ElMessage.error('封面图片上传失败：' + (error?.message || '未知错误'));
}

async function fetchPost() {
  if (!postId.value) return;
  try {
    const res = await request.get(`/posts/${postId.value}`);
    if (res.success) {
      const post = res.data;
      form.title = post.title;
      form.slug = post.slug || '';
      form.category = post.category || 'industry-trends';
      form.cover_image = post.cover_image || '';
      form.summary = post.summary || '';
      form.author = post.author || 'HOLGENVY Editorial Team';
      form.content = post.content || '';
      form.status = post.status;
      form.read_time = post.read_time || 5;
    }
  } catch (error) { console.error('获取帖子详情失败:', error); }
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  if (!form.summary && form.content) {
    const textContent = form.content.replace(/<[^>]+>/g, '');
    form.summary = textContent.substring(0, 150);
  }
  submitting.value = true;
  try {
    let res;
    if (isEdit.value) {
      res = await request.put(`/posts/${postId.value}`, form);
    } else {
      res = await request.post('/posts', form);
    }
    if (res.success) {
      ElMessage.success(isEdit.value ? '帖子更新成功' : '帖子创建成功');
      router.push('/posts');
    }
  } finally { submitting.value = false; }
}

async function handlePublish() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  
  await ElMessageBox.confirm(
    '发布后系统将自动：\n1. 生成帖子详情页 HTML\n2. 更新 blog.html 列表\n3. 同步 Latest Blog 板块\n\n是否继续？',
    '确认发布并同步前端',
    { confirmButtonText: '确认发布', cancelButtonText: '取消', type: 'info' }
  );
  
  if (!form.summary && form.content) {
    const textContent = form.content.replace(/<[^>]+>/g, '');
    form.summary = textContent.substring(0, 150);
  }
  
  publishing.value = true;
  try {
    let res;
    if (isEdit.value) {
      // 编辑后先保存，再同步
      res = await request.put(`/posts/${postId.value}`, { ...form, status: 1 });
      if (res.success) {
        res = await request.post('/posts/sync-frontend');
      }
    } else {
      res = await request.post('/posts/publish', form);
    }
    if (res.success) {
      const now = new Date().toLocaleString();
      lastSync.value = now;
      ElMessage.success(res.message || '发布成功，前端页面已同步更新');
      router.push('/posts');
    }
  } catch (error) {
    console.error('发布失败:', error);
    ElMessage.error('发布失败');
  } finally { publishing.value = false; }
}

onMounted(() => { if (isEdit.value) { fetchPost(); } });
onBeforeUnmount(() => { const editor = editorRef.value; if (editor) { editor.destroy(); } });
</script>

<style>
.post-edit-page .w-e-text-container { background: #fff; }
</style>