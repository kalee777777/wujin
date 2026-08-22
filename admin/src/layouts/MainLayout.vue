<template>
  <div class="main-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="logo">
        <h1>HOLGEN<span>VY</span></h1>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        background-color="transparent"
        text-color="rgba(255,255,255,0.7)"
        active-text-color="#fff"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        
        <el-menu-item index="/posts">
          <el-icon><Document /></el-icon>
          <span>帖子管理</span>
        </el-menu-item>
        
        <el-menu-item index="/inquiries">
          <el-icon><ChatDotRound /></el-icon>
          <span>询盘管理</span>
        </el-menu-item>
        
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
    </aside>
    
    <!-- 主内容区 -->
    <div class="main-container">
      <!-- 头部 -->
      <header class="header">
        <div class="header-left">
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div style="display: flex; align-items: center; cursor: pointer;">
              <el-avatar :size="32" icon="User" style="background: #409eff;" />
              <span style="margin-left: 8px; color: #333;">{{ adminStore.adminInfo?.username }}</span>
              <el-icon style="margin-left: 4px;"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      
      <!-- 页面内容 -->
      <main class="page-content">
        <router-view />
      </main>
    </div>
    
    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="400px"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="80px"
      >
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="handleChangePassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAdminStore } from '@/stores/admin';
import request from '@/utils/request';

const router = useRouter();
const route = useRoute();
const adminStore = useAdminStore();

const activeMenu = computed(() => route.path);
const pageTitle = computed(() => route.meta.title || '管理后台');

function handleMenuSelect(index) {
  if (route.path !== index) {
    router.push(index);
  }
}

// 修改密码
const passwordDialogVisible = ref(false);
const passwordLoading = ref(false);
const passwordFormRef = ref();

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
};

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      adminStore.logout();
      router.push('/login');
    }).catch(() => {});
  } else if (command === 'password') {
    passwordDialogVisible.value = true;
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
  }
}

async function handleChangePassword() {
  const valid = await passwordFormRef.value.validate().catch(() => false);
  if (!valid) return;
  
  passwordLoading.value = true;
  
  try {
    const res = await request.put('/auth/password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    });
    
    if (res.success) {
      ElMessage.success('密码修改成功，请重新登录');
      passwordDialogVisible.value = false;
      adminStore.logout();
      router.push('/login');
    }
  } finally {
    passwordLoading.value = false;
  }
}
</script>