<template>
  <el-popover v-model="showPopover" placement="bottom-start" width="200" trigger="hover">
    <template #reference>
      <el-button type="text" @mouseover="fetchLatestMessages" @mouseout="hidePopover">
        <el-icon size="20" color="#5a5e66" style="transform: scaleX(1.1) scaleY(1.1); margin-right: 5px;">
          <Bell />
        </el-icon>
      </el-button>
    </template>
    <div v-if="filteredNotifications.length > 0">
      <h4 style="margin: 0px; padding: 0px;">信息中心</h4>
      <ul class="notification-list">
        <li style="cursor: pointer;" v-for="(item, index) in filteredNotifications" :key="index" @click="viewDetails(item)">
          {{ item.messageTitle }}
        </li>
      </ul>
    </div>
    <div v-else>
      暂无信息
    </div>
  </el-popover>
</template>

<script setup name="NotificationBell">
import { ref, computed } from 'vue';
import { listMessageSystem } from "@/api/modelMessage/messageSystem";
import { getCurrentInstance } from 'vue';
import useUserStore from '@/store/modules/user';

const { proxy } = getCurrentInstance();

const userStore = useUserStore();
const isCustomer = computed(() => !userStore.roles.includes('admin') && !userStore.roles.includes('engineer'));
const messageSystemList = ref([])
const filteredNotifications = computed(() => {
  if (isCustomer.value) {
    return messageSystemList.value.filter(item => item.sendMode === '0').slice(0, 5);
  }
  return messageSystemList.value.slice(0, 5);
});

const showPopover = ref(false);
const latestNotifications = ref([]);

async function fetchLatestMessages() {
  try {
    const response = await listMessageSystem();
    messageSystemList.value = response.rows;
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
  background-color: #f8f9fa;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 10px;
}

.notification-list li {
  list-style-type: none;
  padding: 5px 0;
  cursor: pointer;
}

.notification-list li:hover {
  background-color: #e0e0e0;
  color: #333;
}
</style>