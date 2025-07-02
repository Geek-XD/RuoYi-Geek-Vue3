<template>
  <el-popover v-model="showPopover" placement="bottom-start" width="200" trigger="hover">
    <template #reference>
      <el-button type="text" @mouseover="fetchLatestMessages" @mouseout="hidePopover">
        <el-icon size="20">
          <Bell />
        </el-icon>
      </el-button>
    </template>
    <div v-if="latestNotifications.length > 0">
      <h4>信息中心</h4>
      <ul>
        <li v-for="(item, index) in latestNotifications" :key="index" @click="viewDetails(item)">
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
import { ref, getCurrentInstance } from 'vue';
import { listMessageSystem } from "@/api/modelMessage/messageSystem";

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
  proxy.$emit('view-details', item);
}

function hidePopover() {
  showPopover.value = false;
}

defineExpose({ fetchLatestMessages });
</script>
