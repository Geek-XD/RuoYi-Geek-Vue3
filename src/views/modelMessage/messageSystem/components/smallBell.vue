<template>
  <el-popover v-model="showPopover" placement="bottom-start" width="200" trigger="hover">
    <template #reference>
      <el-button type="text" @mouseover="fetchLatestMessages" @mouseout="hidePopover">
        <el-icon size="20" color="#5a5e66" style="transform: scaleX(1.1) scaleY(1.1); margin-right: 5px;">
          <Bell />
        </el-icon>
      </el-button>
    </template>
    <div v-if="latestNotifications.length > 0">
      <h4 style="margin: 0px; padding: 0px;">信息中心</h4>
      <ul class="notification-list">
        <li style="cursor: pointer;" v-for="(item, index) in latestNotifications" :key="index" @click="viewDetails(item)">
          {{ item.messageTitle }}
        </li>
      </ul>
    </div>
    <div v-else>
      暂无信息
    </div>
  </el-popover>
</template>

<script setup name="SmallBell">
import { ref } from 'vue';
import { listMessageSystem } from "@/api/modelMessage/messageSystem";
import { getCurrentInstance } from 'vue';

const { proxy } = getCurrentInstance();
const showPopover = ref(false);
const latestNotifications = ref([]);
async function fetchLatestMessages() {
  try {
    const response = await listMessageSystem()
    latestNotifications.value = response.rows.slice(0, 5);
  } catch (error) {
    console.error('获取信息失败:', error);
  }
}

function viewDetails(item) {
  proxy.$emit('view-details', item); // 向父组件传递事件
}

// 隐藏popover
function hidePopover() {
  showPopover.value = false;
}

defineExpose({ fetchLatestMessages });
</script>

<style scoped>
.notification-list {
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 12px;
  margin: 0;
}

.notification-list li {
  list-style-type: none;
  padding: 10px 15px;
  margin: 5px 0;
  border-radius: 6px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  font-size: 14px;
  color: #333;
  background: rgba(255, 255, 255, 0.7);
  border-left: 3px solid #00aaff;
}

.notification-list li:hover {
  background: #e8f6ff;
  transform: translateX(5px);
  box-shadow: 0 2px 8px rgba(0, 170, 255, 0.2);
}

.notification-list li::before {
  content: '';
  position: absolute;
  left: -100%;
  top: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: 0.5s;
}

.notification-list li:hover::before {
  left: 100%;
}

@keyframes bellRing {
  0% { transform: rotate(0); }
  20% { transform: rotate(15deg); }
  40% { transform: rotate(-15deg); }
  60% { transform: rotate(7deg); }
  80% { transform: rotate(-7deg); }
  100% { transform: rotate(0); }
}

.el-button:hover .el-icon {
  animation: bellRing 0.8s ease;
}

h4 {
  color: #333;
  font-size: 16px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #00aaff;
}

.el-popover {
  border-radius: 10px;
  border: none;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.1);
}
</style>