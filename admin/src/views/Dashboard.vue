<template>
  <div class="dashboard-page">
    <!-- 统计卡片 -->
    <el-row :gutter="24" class="stat-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">产品总数</span>
            <div class="stat-icon" style="background: #e3f2fd; color: #1976d2;">
              <el-icon size="24"><Box /></el-icon>
            </div>
          </div>
          <div class="stat-value">{{ overview.product_count }}</div>
          <div class="stat-footer">已发布产品数量</div>
        </div>
      </el-col>
      
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">帖子总数</span>
            <div class="stat-icon" style="background: #e8f5e9; color: #388e3c;">
              <el-icon size="24"><Document /></el-icon>
            </div>
          </div>
          <div class="stat-value">{{ overview.post_count }}</div>
          <div class="stat-footer">已发布帖子数量</div>
        </div>
      </el-col>
      
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">今日 PV</span>
            <div class="stat-icon" style="background: #fff3e0; color: #f57c00;">
              <el-icon size="24"><View /></el-icon>
            </div>
          </div>
          <div class="stat-value">{{ today.pv }}</div>
          <div class="stat-footer">今日页面浏览量</div>
        </div>
      </el-col>
      
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">分类数量</span>
            <div class="stat-icon" style="background: #f3e5f5; color: #7b1fa2;">
              <el-icon size="24"><Grid /></el-icon>
            </div>
          </div>
          <div class="stat-value">{{ overview.category_count }}</div>
          <div class="stat-footer">产品分类数量</div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 图表区域 -->
    <el-row :gutter="24" style="margin-top: 24px;">
      <!-- 访问趋势 -->
      <el-col :span="16">
        <div class="stat-card">
          <h3 style="margin-bottom: 20px; font-size: 16px; color: #333;">访问趋势（最近30天）</h3>
          <div ref="trendChartRef" style="height: 300px;"></div>
        </div>
      </el-col>
      
      <!-- 分类分布 -->
      <el-col :span="8">
        <div class="stat-card">
          <h3 style="margin-bottom: 20px; font-size: 16px; color: #333;">分类分布</h3>
          <div ref="categoryChartRef" style="height: 300px;"></div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 热门产品和最近内容 -->
    <el-row :gutter="24" style="margin-top: 24px;">
      <el-col :span="12">
        <div class="stat-card">
          <h3 style="margin-bottom: 16px; font-size: 16px; color: #333;">热门产品</h3>
          <el-table :data="hotProducts" size="small">
            <el-table-column prop="name" label="产品名称" />
            <el-table-column prop="views" label="浏览量" width="100" />
          </el-table>
        </div>
      </el-col>
      
      <el-col :span="12">
        <div class="stat-card">
          <h3 style="margin-bottom: 16px; font-size: 16px; color: #333;">最近产品</h3>
          <el-table :data="recentProducts" size="small">
            <el-table-column prop="name" label="产品名称" />
            <el-table-column prop="created_at" label="创建时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import request from '@/utils/request';
import dayjs from 'dayjs';

const trendChartRef = ref();
const categoryChartRef = ref();
let trendChart = null;
let categoryChart = null;

const overview = ref({
  product_count: 0,
  post_count: 0,
  category_count: 0
});

const today = ref({
  pv: 0,
  uv: 0
});

const hotProducts = ref([]);
const recentProducts = ref([]);
const categoryDistribution = ref([]);
const dailyTrend = ref([]);

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

async function fetchDashboardData() {
  try {
    const res = await request.get('/stats/dashboard');
    if (res.success) {
      overview.value = res.data.overview;
      today.value = res.data.today;
      hotProducts.value = res.data.hot_products;
      recentProducts.value = res.data.recent_products;
      categoryDistribution.value = res.data.category_distribution;
      dailyTrend.value = res.data.daily_trend;
      
      initCharts();
    }
  } catch (error) {
    console.error('获取统计数据失败:', error);
  }
}

function initCharts() {
  // 访问趋势图
  if (!trendChart && trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value);
  }
  
  const dates = dailyTrend.value.map(item => item.date);
  const pvData = dailyTrend.value.map(item => item.pv);
  
  trendChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: 'PV',
      type: 'line',
      smooth: true,
      data: pvData,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
        ])
      },
      lineStyle: {
        color: '#409eff'
      },
      itemStyle: {
        color: '#409eff'
      }
    }]
  });
  
  // 分类分布图
  if (!categoryChart && categoryChartRef.value) {
    categoryChart = echarts.init(categoryChartRef.value);
  }
  
  const categoryData = categoryDistribution.value
    .filter(item => item.count > 0)
    .map(item => ({
      name: item.name,
      value: item.count
    }));
  
  categoryChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: categoryData
    }]
  });
}

function handleResize() {
  trendChart?.resize();
  categoryChart?.resize();
}

onMounted(() => {
  fetchDashboardData();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  trendChart?.dispose();
  categoryChart?.dispose();
});
</script>

<style scoped>
.dashboard-page {
  .stat-row {
    margin-bottom: 0;
  }
}
</style>