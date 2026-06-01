<template>
  <div class="app-container">
    <el-row :gutter="16" class="summary-row">
      <el-col :xl="4" :lg="6" :md="8" :sm="12" :xs="24" v-for="card in summaryCards" :key="card.label" class="card-box">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-label">{{ card.label }}</div>
          <div class="summary-value">{{ card.value }}</div>
          <div class="summary-extra" v-if="card.extra">{{ card.extra }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="24" class="card-box">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>JetCache 配置概览</span>
              <el-tag type="primary">{{ cacheSummary.cacheType || '-' }}</el-tag>
            </div>
          </template>
          <el-descriptions :column="4" border>
            <el-descriptions-item label="Area">{{ cacheSummary.area || '-' }}</el-descriptions-item>
            <el-descriptions-item label="本地 Provider">{{ cacheSummary.localProvider || '-' }}</el-descriptions-item>
            <el-descriptions-item label="远端 Provider">{{ cacheSummary.remoteProvider || '未启用' }}</el-descriptions-item>
            <el-descriptions-item label="统计周期">{{ cacheSummary.statIntervalMinutes || 0 }} 分钟</el-descriptions-item>
            <el-descriptions-item label="默认 TTL">{{ cacheSummary.defaultExpire || '-' }}</el-descriptions-item>
            <el-descriptions-item label="本地 TTL">{{ cacheSummary.localExpire || '-' }}</el-descriptions-item>
            <el-descriptions-item label="本地容量">{{ cacheSummary.localLimit || 0 }}</el-descriptions-item>
            <el-descriptions-item label="多级缓存">{{ cacheSummary.multiLevelEnabled ? '已开启' : '未开启'
            }}</el-descriptions-item>
            <el-descriptions-item label="本地同步">{{ cacheSummary.syncLocal ? '已开启' : '未开启' }}</el-descriptions-item>
            <el-descriptions-item label="穿透保护">{{ cacheSummary.penetrationProtect ? '已开启' : '未开启'
            }}</el-descriptions-item>
            <el-descriptions-item label="活跃缓存">{{ cacheSummary.activeCacheCount || 0 }}</el-descriptions-item>
            <el-descriptions-item label="监控缓存">{{ cacheSummary.cacheCount || 0 }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :lg="12" :xs="24" class="card-box">
        <el-card>
          <template #header><span>缓存键数量分布</span></template>
          <div ref="keyChartRef" class="chart-panel" />
        </el-card>
      </el-col>

      <el-col :lg="12" :xs="24" class="card-box">
        <el-card>
          <template #header><span>命中率 / QPS</span></template>
          <div ref="hitRateChartRef" class="chart-panel" />
        </el-card>
      </el-col>

      <el-col :span="24" class="card-box">
        <el-card>
          <template #header><span>缓存统计明细</span></template>
          <el-table :data="cacheStats" stripe>
            <el-table-column label="缓存名称" prop="cacheName" min-width="180" show-overflow-tooltip />
            <el-table-column label="备注" prop="remark" min-width="120" show-overflow-tooltip />
            <el-table-column label="键数量" prop="keyCount" width="100" align="center" />
            <el-table-column label="命中率" width="100" align="center">
              <template #default="scope">
                {{ formatPercent(scope.row.hitRate) }}
              </template>
            </el-table-column>
            <el-table-column label="QPS" prop="qps" width="100" align="center" />
            <el-table-column label="GET" prop="getCount" width="100" align="center" />
            <el-table-column label="PUT" prop="putCount" width="100" align="center" />
            <el-table-column label="REMOVE" prop="removeCount" width="100" align="center" />
            <el-table-column label="LOAD" prop="loadCount" width="100" align="center" />
            <el-table-column label="默认 TTL" prop="defaultExpire" width="110" align="center" />
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="24" class="card-box">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>Redis 远程缓存监控</span>
              <el-tag :type="redisTagType">{{ redisStatusText }}</el-tag>
            </div>
          </template>

          <template v-if="redisCache.enabled && redisCache.available && redisCache.info">
            <div class="el-table el-table--enable-row-hover el-table--medium">
              <table cellspacing="0" style="width: 100%">
                <tbody>
                  <tr>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">Redis版本</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">{{ redisCache.info.redis_version }}</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">运行模式</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">{{ redisCache.info.redis_mode === 'standalone' ? '单机' : '集群' }}</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">端口</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">{{ redisCache.info.tcp_port }}</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">客户端数</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">{{ redisCache.info.connected_clients }}</div>
                    </td>
                  </tr>
                  <tr>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">运行时间(天)</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">{{ redisCache.info.uptime_in_days }}</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">使用内存</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">{{ redisCache.info.used_memory_human }}</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">峰值内存</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">{{ redisCache.info.used_memory_peak_human }}</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">内存上限</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">{{ redisCache.info.maxmemory_human }}</div>
                    </td>
                  </tr>
                  <tr>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">AOF是否开启</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">{{ redisCache.info.aof_enabled === '0' ? '否' : '是' }}</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">RDB是否成功</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">{{ redisCache.info.rdb_last_bgsave_status }}</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">Key数量</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">{{ redisCache.dbSize || 0 }}</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">网络入口/出口</div>
                    </td>
                    <td class="el-table__cell is-leaf">
                      <div class="cell">{{ redisCache.info.instantaneous_input_kbps }}kps/{{
                        redisCache.info.instantaneous_output_kbps }}kps</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <el-row :gutter="16" class="redis-row">
              <el-col :lg="12" :xs="24" class="card-box">
                <div ref="redisCommandChartRef" class="chart-panel" />
              </el-col>
              <el-col :lg="12" :xs="24" class="card-box">
                <div ref="redisMemoryChartRef" class="chart-panel" />
              </el-col>
            </el-row>
          </template>

          <el-empty v-else :description="redisCache.error || redisCache.message || '当前未启用 Redis 远程缓存监控'" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="Cache">
import { getCache, getRedisCache } from '@/api/monitor/cache';
import * as echarts from 'echarts';
import { nextTick, onBeforeUnmount, onMounted } from 'vue';

const { proxy } = getCurrentInstance();

const cacheSummary = ref({});
const cacheStats = ref([]);
const redisCache = ref({
  enabled: false,
  available: false,
  info: null,
  commandStats: [],
  message: '',
  error: ''
});

const keyChartRef = ref(null);
const hitRateChartRef = ref(null);
const redisCommandChartRef = ref(null);
const redisMemoryChartRef = ref(null);

let keyChart;
let hitRateChart;
let redisCommandChart;
let redisMemoryChart;

const summaryCards = computed(() => [
  {
    label: '缓存模式',
    value: cacheSummary.value.cacheType || '-',
    extra: `${cacheSummary.value.localProvider || '-'} / ${cacheSummary.value.remoteProvider || '无远端'}`
  },
  {
    label: '监控缓存数',
    value: cacheSummary.value.cacheCount ?? 0,
    extra: `活跃 ${cacheSummary.value.activeCacheCount ?? 0}`
  },
  {
    label: '缓存键数量',
    value: cacheSummary.value.keyCount ?? 0,
    extra: `Area: ${cacheSummary.value.area || '-'}`
  },
  {
    label: '命中率',
    value: formatPercent(cacheSummary.value.hitRate),
    extra: `GET ${cacheSummary.value.getCount ?? 0} / HIT ${cacheSummary.value.hitCount ?? 0}`
  },
  {
    label: 'QPS',
    value: cacheSummary.value.qps ?? 0,
    extra: `PUT ${cacheSummary.value.putCount ?? 0} / REMOVE ${cacheSummary.value.removeCount ?? 0}`
  },
  {
    label: '默认 TTL',
    value: cacheSummary.value.defaultExpire || '-',
    extra: `本地 TTL ${cacheSummary.value.localExpire || '-'}`
  }
]);

const redisTagType = computed(() => {
  if (!redisCache.value.enabled) {
    return 'info';
  }
  return redisCache.value.available ? 'success' : 'danger';
});

const redisStatusText = computed(() => {
  if (!redisCache.value.enabled) {
    return '未启用';
  }
  return redisCache.value.available ? '运行中' : '不可用';
});

function formatPercent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function buildKeyChart() {
  if (!keyChartRef.value) {
    return;
  }
  keyChart?.dispose();
  keyChart = echarts.init(keyChartRef.value, 'macarons');
  const topCaches = [...cacheStats.value]
    .sort((a, b) => (b.keyCount || 0) - (a.keyCount || 0))
    .slice(0, 8);
  keyChart.setOption({
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
      data: topCaches.map(item => item.remark || item.cacheName),
      axisLabel: {
        interval: 0,
        rotate: 20
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '缓存键数量',
        type: 'bar',
        barWidth: '40%',
        data: topCaches.map(item => item.keyCount || 0)
      }
    ]
  });
}

function buildHitRateChart() {
  if (!hitRateChartRef.value) {
    return;
  }
  hitRateChart?.dispose();
  hitRateChart = echarts.init(hitRateChartRef.value, 'macarons');
  const topCaches = [...cacheStats.value]
    .sort((a, b) => (b.getCount || 0) - (a.getCount || 0))
    .slice(0, 8);
  hitRateChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['命中率', 'QPS']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: topCaches.map(item => item.remark || item.cacheName),
      axisLabel: {
        interval: 0,
        rotate: 20
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '命中率(%)'
      },
      {
        type: 'value',
        name: 'QPS'
      }
    ],
    series: [
      {
        name: '命中率',
        type: 'bar',
        data: topCaches.map(item => Number(item.hitRate || 0))
      },
      {
        name: 'QPS',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: topCaches.map(item => Number(item.qps || 0))
      }
    ]
  });
}

function buildRedisCommandChart() {
  if (!redisCommandChartRef.value || !redisCache.value.available) {
    return;
  }
  redisCommandChart?.dispose();
  redisCommandChart = echarts.init(redisCommandChartRef.value, 'macarons');
  const commandStats = redisCache.value.commandStats || [];
  redisCommandChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c} ({d}%)'
    },
    series: [
      {
        name: 'Redis命令',
        type: 'pie',
        roseType: 'radius',
        radius: [15, 95],
        center: ['50%', '45%'],
        data: commandStats,
        animationEasing: 'cubicInOut',
        animationDuration: 1000
      }
    ]
  });
}

function buildRedisMemoryChart() {
  if (!redisMemoryChartRef.value || !redisCache.value.available || !redisCache.value.info) {
    return;
  }
  redisMemoryChart?.dispose();
  redisMemoryChart = echarts.init(redisMemoryChartRef.value, 'macarons');
  const info = redisCache.value.info;
  const maxMemory = Number(info.maxmemory || 0);
  const memoryData = [
    { name: '当前内存', value: Number(info.used_memory || 0) },
    { name: '峰值内存', value: Number(info.used_memory_peak || 0) }
  ];
  if (maxMemory > 0) {
    memoryData.push({ name: '最大内存', value: maxMemory });
  }
  redisMemoryChart.setOption({
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
      data: memoryData.map(item => item.name)
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: value => `${(value / 1024 / 1024).toFixed(0)} MB`
      }
    },
    series: [
      {
        name: '字节数',
        type: 'bar',
        data: memoryData.map(item => item.value)
      }
    ]
  });
}

function renderCharts() {
  nextTick(() => {
    buildKeyChart();
    buildHitRateChart();
    buildRedisCommandChart();
    buildRedisMemoryChart();
  });
}

function getList() {
  proxy.$modal.loading('正在加载缓存监控数据，请稍候！');
  Promise.allSettled([getCache(), getRedisCache()])
    .then(([cacheResponse, redisResponse]) => {
      if (cacheResponse.status === 'fulfilled') {
        cacheSummary.value = cacheResponse.value.data.summary || {};
        cacheStats.value = cacheResponse.value.data.caches || [];
      } else {
        cacheSummary.value = {};
        cacheStats.value = [];
        proxy.$modal.msgError('JetCache 监控数据加载失败');
      }

      if (redisResponse.status === 'fulfilled') {
        redisCache.value = {
          enabled: false,
          available: false,
          info: null,
          commandStats: [],
          message: '',
          error: '',
          ...redisResponse.value.data
        };
      } else {
        redisCache.value = {
          enabled: false,
          available: false,
          info: null,
          commandStats: [],
          message: 'Redis 监控接口不可用',
          error: ''
        };
      }

      renderCharts();
    })
    .finally(() => {
      proxy.$modal.closeLoading();
    });
}

onMounted(() => {
  getList();
});

onBeforeUnmount(() => {
  keyChart?.dispose();
  hitRateChart?.dispose();
  redisCommandChart?.dispose();
  redisMemoryChart?.dispose();
});
</script>

<style scoped>
.summary-row {
  margin-bottom: 16px;
}

.summary-card {
  min-height: 110px;
}

.summary-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.summary-value {
  margin-top: 14px;
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.summary-extra {
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.card-box {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart-panel {
  height: 380px;
}

.redis-row {
  margin-top: 16px;
}
</style>
