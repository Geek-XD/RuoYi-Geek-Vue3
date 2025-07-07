<script setup>

import { ref, reactive, computed } from 'vue';
import { initMultipartUpload, uploadFileChunk, completeMultipartUpload } from '@/api/file/info';
import { ElMessage } from 'element-plus';

const emits = defineEmits(['update:modelValue']);
const props = defineProps({
  chunkSize: {
    type: Number,
    default: 10
  },
  maxConcurrency: {
    type: Number,
    default: 1
  }
});

const selectedFile = ref(null);
const fileInfo = reactive({
  fileName: '',
  fileSize: 0,
  totalChunks: 0
});
const uploadProgress = ref(0);
const uploadStatus = ref('');
const uploadProgressInfo = reactive({
  currentChunk: 0,
  message: ''
});
const isUploading = ref(false);
const uploadId = ref('');
const filePath = ref('');
const partETags = ref([]);

// 处理文件选择
function handleBeforeUpload(file) {
  selectedFile.value = file;
  fileInfo.fileName = file.name;
  fileInfo.fileSize = (file.size / (1024 * 1024)).toFixed(2);
  fileInfo.totalChunks = chunkTotal.value;
  return false; // 阻止默认上传
}
const chunkBytes = computed(() => props.chunkSize * 1024 * 1024); // 分片大小（字节）
const fileBytes = computed(() => selectedFile.value ? selectedFile.value.size : 0);
const chunkTotal = computed(() => Math.ceil(fileBytes.value / chunkBytes.value));

// 开始上传
async function startUpload() {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件');
    return;
  }
  try {
    isUploading.value = true;
    uploadStatus.value = '';
    uploadProgressInfo.message = '开始初始化上传...';
    partETags.value = [];

    const chunks = [];
    for (let start = 0; start < selectedFile.value.size; start += chunkBytes.value) {
      chunks.push(selectedFile.value.slice(start, start + chunkBytes.value));
    }
    // 1. 初始化上传
    const { data } = await initMultipartUpload({
      fileName: selectedFile.value.name,
      fileSize: selectedFile.value.size,
    });

    if (!data || !data.uploadId || !data.filePath) {
      throw new Error('初始化上传失败');
    }

    uploadId.value = data.uploadId;
    filePath.value = data.filePath;
    uploadProgressInfo.message = '初始化成功，开始上传分片...';

    // 2. 并发上传所有分片
    const concurrency = props.maxConcurrency;
    let current = 0;
    let completed = 0;
    let errorOccurred = false;
    const total = chunks.length;

    async function uploadChunk(i) {
      if (errorOccurred) return;
      const chunk = chunks[i];
      try {
        const { data: chunkResponse } = await uploadFileChunk(uploadId.value, filePath.value, i, chunk);
        if (!chunkResponse || !chunkResponse.etag) {
          throw new Error('服务器返回的分片信息无效');
        }
        partETags.value.push({
          partNumber: i + 1,
          etag: chunkResponse.etag
        });
        completed++;
        uploadProgress.value = Math.round((completed / chunkTotal.value) * 100);
        uploadProgressInfo.currentChunk = completed;
        uploadProgressInfo.message = `已上传 ${uploadProgress.value}% (分片 ${completed}/${chunkTotal.value})`;
        await new Promise(resolve => setTimeout(resolve, 100));
        // 启动下一个
        if (current < total) {
          await uploadChunk(current++);
        }
      } catch (error) {
        errorOccurred = true;
        console.error('分片上传失败:', error);
        throw new Error(`分片 ${i + 1} 上传失败: ${error.message}`);
      }
    }

    // 启动并发上传
    const tasks = [];
    while (current < concurrency && current < total) {
      tasks.push(uploadChunk(current++));
    }
    await Promise.all(tasks);
    if (errorOccurred) throw new Error('有分片上传失败');

    // 3. 完成上传
    uploadProgressInfo.message = '正在合并分片...';
    partETags.value.sort((a, b) => a.partNumber - b.partNumber);
    const formattedPartETags = partETags.value.map(item => ({ partNumber: item.partNumber, ETag: item.etag }));
    const { data: completeResult } = await completeMultipartUpload({
      uploadId: uploadId.value,
      filePath: filePath.value,
      fileSize: selectedFile.value.size,
      fileName: selectedFile.value.name,
      partETags: formattedPartETags,
    });
    uploadStatus.value = 'success';
    uploadProgressInfo.message = '上传完成';
    ElMessage.success('文件上传成功');
    emits('update:modelValue', completeResult);
  } catch (error) {
    uploadStatus.value = 'exception';
    uploadProgressInfo.message = `上传失败: ${error.message}`;
    ElMessage.error(`文件上传失败: ${error.message}`);
    console.error('分片上传失败', error);
  } finally {
    isUploading.value = false;
  }
}

// 重置上传状态
function resetUpload() {
  selectedFile.value = null;
  fileInfo.fileName = '';
  fileInfo.fileSize = 0;
  fileInfo.totalChunks = 0;
  uploadProgress.value = 0;
  uploadStatus.value = '';
  uploadProgressInfo.currentChunk = 0;
  uploadProgressInfo.message = '';
  uploadId.value = '';
  filePath.value = '';
  partETags.value = [];
}

</script>
<template>
  <div>
    <el-card class="custom-file-info-card">
      <template #header>
        <div class="file-details">
          <div class="detail-item">
            <span class="detail-label">文件大小:</span>
            <span class="detail-value">{{ fileInfo.fileSize ?? '0' }} MB</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">总分片数:</span>
            <span class="detail-value">{{ fileInfo.totalChunks ?? '0' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">分片大小:</span>
            <span class="detail-value">{{ chunkSize ?? 0 }} MB</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">并发数量:</span>
            <span class="detail-value">{{ maxConcurrency ?? 0 }}</span>
          </div>
        </div>
      </template>
      <el-upload class="custom-upload-area" drag :show-file-list="false" :before-upload="handleBeforeUpload">
        <div class="upload-content">
          <i class="el-icon-upload el-icon--primary upload-icon"></i>
          <div class="upload-text">将文件拖到此处，或<em class="upload-link">点击上传</em></div>
          <div class="upload-tip">支持拖拽上传，最大文件500MB</div>
          <i class="el-icon-document file-icon"></i>
          <span class="file-name">{{ fileInfo.fileName || '未选择文件' }}</span>
        </div>
      </el-upload>
      <template #footer>
        <div>
          <el-progress :percentage="uploadProgress" :status="uploadStatus">
            <span style="margin-right: 10px;">{{ uploadProgressInfo.message || '等待上传...' }}</span>
            <span>分片: {{ uploadProgressInfo.currentChunk }} / {{ fileInfo.totalChunks || '0' }}</span>
          </el-progress>
          <div class="dialog-footer">
            <el-button @click="resetUpload" class="btn-cancel" icon="Refresh">重置</el-button>
            <el-button type="primary" :disabled="!selectedFile || isUploading" @click="startUpload" class="btn-upload"
              icon="Upload">
              <i class="el-icon-upload2" v-if="!isUploading"></i>
              <i class="el-icon-loading" v-else></i>
              {{ isUploading ? '上传中...' : '开始上传' }}
            </el-button>
          </div>
        </div>
      </template>
    </el-card>
  </div>
</template>
<style scoped lang="scss">
/* 自定义文件信息卡片 */
.custom-file-info-card {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 自定义上传区域样式 */
.custom-upload-area {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background-color: #fafbfc;
  transition: all 0.3s ease;
  cursor: pointer;

  :deep(.el-upload) {
    width: 100%;

    .el-upload-dragger {
      border: none;
    }
  }

  &:hover {
    border-color: #409eff;
    background-color: #f5f7fa;
  }

  .upload-content {
    text-align: center;

    .upload-icon {
      font-size: 48px;
      color: #409eff;
      margin-bottom: 12px;
      transition: transform 0.3s ease;
    }

    .upload-link {
      color: #409eff;
      font-style: normal;
      cursor: pointer;
      text-decoration: underline;
      transition: color 0.3s ease;

      &:hover {
        color: #3a8ee6;
      }
    }

    .upload-tip {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
    }

    .file-icon {
      font-size: 20px;
      margin-right: 8px;
      color: #409eff;
    }

    .file-name {
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

  }

}

.file-details {
  padding: 16px;
  display: flex;
  justify-content: space-between;

  .detail-item {
    padding: 6px 0;

    .detail-label {
      flex-shrink: 0;
      width: 80px;
      color: #606266;
      font-size: 14px;
    }

    .detail-value {
      color: #303133;
      font-size: 14px;
    }
  }

}

/* 自定义按钮 */
.dialog-footer {
  display: flex;
  justify-content: space-around;
  padding: 16px 30px;

  .btn-cancel {
    margin-right: 12px;
  }

  .btn-upload {
    min-width: 120px;
  }
}
</style>