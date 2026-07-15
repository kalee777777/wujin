<template>
  <div class="post-edit-page">
    <div class="stat-card">
      <h2 style="margin-bottom: 24px;">{{ isEdit ? '编辑帖子' : '新增帖子' }}</h2>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
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
                <el-option label="公司动态" value="news" />
                <el-option label="行业资讯" value="industry" />
                <el-option label="产品发布" value="product" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="封面图片">
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleCoverUpload"
            accept="image/*"
          >
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
          <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="帖子摘要，不填写则自动截取正文前100字" />
        </el-form-item>
        
        <el-form-item label="作者">
          <el-input v-model="form.author" placeholder="作者名称" style="width: 200px;" />
        </el-form-item>
        
        <el-form-item label="内容" prop="content">
          <div style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">
            <Toolbar
              style="border-bottom: 1px solid #ccc"
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              mode="default"
            />
            <Editor
              style="height: 400px; overflow-y: hidden;"
              v-model="form.content"
              :defaultConfig="editorConfig"
              mode="default"
              @onCreated="handleCreated"
            />
          </div>
        </el-form-item>
        
        <el-form-item style="margin-top: 24px;">
          <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';

const router = useRouter();
const route = useRoute();

const isEdit = computed(() => !!route.params.id);
const postId = computed(() => route.params.id);

const formRef = ref();
const submitting = ref(false);
const editorRef = shallowRef();

const form = reactive({
  title: '',
  category: 'news',
  cover_image: '',
  summary: '',
  author: 'HOLGENVY',
  content: '',
  status: 0
});

const rules = {
  title: [{ required: true, message: '请输入帖子标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入帖子内容', trigger: 'change' }]
};

// 上传配置
const uploadUrl = '/api/upload/image';
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('admin_token')}`
}));

// 编辑器配置
const toolbarConfig = {
  excludeKeys: ['group-video']
};

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

function handleCreated(editor) {
  editorRef.value = editor;
}

function handleCoverUpload(response) {
  if (response.success) {
    form.cover_image = `/${response.data.path}`;
  }
}

// 获取帖子详情
async function fetchPost() {
  if (!postId.value) return;
  
  try {
    const res = await request.get(`/posts/${postId.value}`);
    if (res.success) {
      const post = res.data;
      form.title = post.title;
      form.category = post.category;
      form.cover_image = post.cover_image || '';
      form.summary = post.summary || '';
      form.author = post.author || 'HOLGENVY';
      form.content = post.content || '';
      form.status = post.status;
    }
  } catch (error) {
    console.error('获取帖子详情失败:', error);
  }
}

// 提交表单
async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  
  // 如果没有摘要，自动截取正文
  if (!form.summary && form.content) {
    const textContent = form.content.replace(/<[^>]+>/g, '');
    form.summary = textContent.substring(0, 100);
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
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  if (isEdit.value) {
    fetchPost();
  }
});

onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor) {
    editor.destroy();
  }
});
</script>

<style>
.post-edit-page .w-e-text-container {
  background: #fff;
}
</style>