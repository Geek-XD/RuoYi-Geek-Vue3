<template>
  <!-- 模板预览对话框 -->
  <el-dialog title="模板预览" :modelValue="visible" @update:modelValue="emit('update:visible', $event)"
    width="540px" append-to-body destroy-on-close custom-class="preview-dialog">
    <div class="preview-container">
      <div class="template-preview-header">
        <div class="preview-title">{{ previewData.templateName }}</div>
        <div class="preview-meta">
          <el-tag size="small" effect="dark">{{ getTemplatTypeText(previewData.templateType) }}</el-tag>
          <span class="preview-code">
            <el-icon><Document /></el-icon>
            {{ previewData.templateCode }}
          </span>
        </div>
      </div>
      <div class="message-preview">
        <div class="message-bubble">
          <div class="message-content">{{ previewData.templateContent }}</div>
          <div class="message-time">{{ formatTime() }}</div>
        </div>
      </div>
      <div class="preview-variables-section">
        <div class="section-title">
          <el-icon><Collection /></el-icon>
          <span>模板变量</span>
        </div>
        <div class="preview-variables">
          <el-tag v-for="(item, index) in previewVariables" :key="index" size="small" effect="plain" class="var-tag">
            {{ item }}
          </el-tag>
          <div class="no-variables" v-if="!previewVariables.length">无变量</div>
        </div>
      </div>
      <div class="preview-remark">
        <div class="section-title">
          <el-icon><Memo /></el-icon>
          <span>场景说明</span>
        </div>
        <div class="remark-content">{{ previewData.remark || '无' }}</div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup name="TemplatePreviewDialog">
import { ref, computed, getCurrentInstance } from 'vue';
import { Document, Collection, Memo } from '@element-plus/icons-vue';

const { proxy } = getCurrentInstance();
const { template_type } = proxy.useDict("template_type");

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  previewData: {
    type: Object,
    default: () => ({})
  },
  previewVariables: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['update:visible']);

// Methods
/** 获取模板类型文字 */
function getTemplatTypeText(type) {
  const found = template_type.value.find(item => item.value === type);
  return found ? found.label : '未知类型';
}

// 添加格式化时间方法
const formatTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};
</script>

<style scoped>
/* 预览对话框样式 */
:deep(.preview-dialog .el-dialog__header) { padding: 16px 20px; margin-right: 0; background: #67c23a; border-radius: 8px 8px 0 0; }
:deep(.preview-dialog .el-dialog__title) { color: white; font-weight: 600; }
:deep(.preview-dialog .el-dialog__headerbtn .el-dialog__close) { color: rgba(255, 255, 255, 0.9); }
:deep(.preview-dialog .el-dialog__body) { padding: 0; }

/* 预览内容样式 */
.preview-container { background: #f9fafc; }
.template-preview-header { padding: 16px; border-bottom: 1px solid #ebeef5; }
.preview-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #303133; }
.preview-meta { display: flex; align-items: center; gap: 12px; }
.preview-code { color: #606266; font-size: 13px; display: flex; align-items: center; gap: 4px; }
.message-preview { background: #ebebeb; padding: 20px; position: relative; min-height: 100px; }
.message-bubble { max-width: 80%; background: white; border-radius: 8px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); position: relative; }
.message-content { color: #333; font-size: 14px; line-height: 1.5; word-break: break-word; white-space: pre-wrap; }
.message-time { text-align: right; font-size: 12px; color: #999; margin-top: 6px; }
.preview-variables-section, .preview-remark { padding: 16px; border-top: 1px solid #ebeef5; }
.section-title { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; font-weight: 500; color: #303133; }
.preview-variables { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.var-tag { margin-right: 0; }
.no-variables { color: #909399; font-size: 13px; font-style: italic; }
.remark-content { background: white; border-radius: 6px; padding: 12px; font-size: 14px; color: #606266; border: 1px solid #ebeef5; min-height: 50px; }
</style>
