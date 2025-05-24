<template>
  <el-dialog v-model="visible" title="分片上传" width="600px" append-to-body class="custom-upload-dialog">
    <el-form :model="uploadForm" label-width="120px" class="upload-form">
      <el-form-item label="存储桶" prop="clientName">
        <el-select v-model="uploadForm.clientName" placeholder="请选择存储桶" clearable :loading="loadingClients"
                   class="el-select-custom">
          <el-option v-for="item in clientList" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="选择文件">
        <el-upload class="custom-upload-area" drag :show-file-list="false" :before-upload="handleBeforeUpload">
          <div class="upload-content">
            <i class="el-icon-upload el-icon--primary upload-icon"></i>
            <div class="upload-text">将文件拖到此处，或<em class="upload-link">点击上传</em></div>
            <div class="upload-tip">支持拖拽上传，最大文件500MB</div>
          </div>
        </el-upload>
      </el-form-item>
      
      <el-form-item label="分片大小">
        <el-input-number v-model="chunkSize" :min="1" :max="100" :step="1" 
          size="small" controls-position="right" @change="updateChunkInfo" class="el-input-number-custom"/>
        <span class="unit">MB</span>
      </el-form-item>
      
      <el-form-item label="文件信息">
        <el-card class="custom-file-info-card">
          <template #header>
            <div class="card-header">
              <i class="el-icon-document file-icon"></i>
              <span class="file-name">{{ fileInfo.fileName || '未选择文件' }}</span>
            </div>
          </template>
          <div class="file-details">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="detail-item">
                  <span class="detail-label">文件大小:</span>
                  <span class="detail-value">{{ fileInfo.fileSize || '0' }} MB</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="detail-item">
                  <span class="detail-label">总分片数:</span>
                  <span class="detail-value">{{ fileInfo.totalChunks || '0' }}</span>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-form-item>
      
      <!-- 上传进度 -->
      <el-form-item label="上传进度">
        <el-progress :percentage="uploadProgress" :status="uploadStatus" 
          :stroke-width="18" :show-text="false" class="custom-progress" />
        <div class="progress-info">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="progress-text">
                <i class="el-icon-loading progress-icon" v-if="isUploading"></i>
                <span class="progress-message">{{ uploadProgressInfo.message || '等待上传...' }}</span>
              </div>
            </el-col>
            <el-col :span="12" class="text-right">
              <div class="progress-text">
                <span>分片: {{ uploadProgressInfo.currentChunk + 1 }} / {{ fileInfo.totalChunks || '0' }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-form-item>
    </el-form>
    
    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" size="medium" class="btn-cancel">
          <i class="el-icon-close"></i> 取消
        </el-button>
        <el-button type="primary" :disabled="!selectedFile || isUploading || !uploadForm.clientName" 
          @click="startUpload" size="medium" class="btn-upload">
          <i class="el-icon-upload2" v-if="!isUploading"></i>
          <i class="el-icon-loading" v-else></i>
          {{ isUploading ? '上传中...' : '开始上传' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { initMultipartUpload, uploadFileChunk, completeMultipartUpload, getClientList } from '@/api/file/info';
import { ElMessage } from 'element-plus';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});
const emits = defineEmits(['update:modelValue', 'upload-success']);
const visible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
  }
});

const selectedFile = ref(null);
const uploadForm = reactive({
  clientName: '' // 存储桶名称
});
const fileInfo = reactive({
  fileName: '',
  fileSize: 0,
  totalChunks: 0
});
const chunkSize = ref(10); // 默认10MB
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
const clientList = ref([]);
const loadingClients = ref(false);

// 获取存储桶列表
async function fetchClientList() {
  loadingClients.value = true;
  try {
    const response = await getClientList();
    if (response.code === 200 && response.data) {     
      clientList.value = Object.entries(response.data).flatMap(([type, arr]) =>
        arr.map(client => ({ value: type,  label: `${type} - ${client}`, clientName: client  }))
      );
      if (clientList.value.length > 0) {
        uploadForm.clientName = clientList.value[0].value; // 如果有可用存储桶，选择第一个
      }
    }
  } catch (error) {
    console.error('获取存储桶列表失败', error);
  } finally {
    loadingClients.value = false;
  }
}

// 处理文件选择
function handleBeforeUpload(file) {
  selectedFile.value = file;
  fileInfo.fileName = file.name;
  fileInfo.fileSize = (file.size / (1024 * 1024)).toFixed(2);
  updateChunkInfo();
  return false; // 阻止默认上传
}

// 计算总分片数
function updateChunkInfo() {
  if (!selectedFile.value) return;
  const fileSizeInBytes = selectedFile.value.size;
  const chunkSizeInBytes = chunkSize.value * 1024 * 1024;
  fileInfo.totalChunks = Math.ceil(fileSizeInBytes / chunkSizeInBytes);
}

// 开始上传
async function startUpload() {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件');
    return;
  }
  if (!uploadForm.clientName) {
    ElMessage.warning('请选择存储桶');
    return;
  }
  try {
    isUploading.value = true;
    uploadStatus.value = '';
    uploadProgressInfo.message = '开始初始化上传...';
    partETags.value = [];
    
    const chunkSizeInBytes = chunkSize.value * 1024 * 1024;
    const chunks = [];
    let start = 0;
    while (start < selectedFile.value.size) {
      chunks.push(selectedFile.value.slice(start, start + chunkSizeInBytes));
      start += chunkSizeInBytes;
    }
    
    const totalChunks = chunks.length;
    let uploadedChunks = 0;
      // 1. 初始化上传
    const { data } = await initMultipartUpload({
      fileName: selectedFile.value.name,
      fileSize: selectedFile.value.size,
      fileType: selectedFile.value.name.split('.').pop(),
      clientName: uploadForm.clientName,
      bucketName: uploadForm.clientName // 新增：bucketName和clientName使用相同的值
    });
    
    if (!data || !data.uploadId || !data.filePath) {
      throw new Error('初始化上传失败');
    }
    
    uploadId.value = data.uploadId;
    filePath.value = data.filePath;
    uploadProgressInfo.message = '初始化成功，开始上传分片...';
    
    // 2. 上传所有分片
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];      const formData = new FormData();
      formData.append('chunk', new File([chunk], `${selectedFile.value.name}_${i}`, {
        type: selectedFile.value.type
      }));
        try {
        const { data: chunkResponse } = await uploadFileChunk(uploadId.value, filePath.value, i, chunk);
        if (!chunkResponse || !chunkResponse.etag) {
          throw new Error('服务器返回的分片信息无效');
        }
        partETags.value.push({
          partNumber: i + 1,
          etag: chunkResponse.etag
        });
        uploadedChunks++;
        uploadProgress.value = Math.round((uploadedChunks / totalChunks) * 100);
        uploadProgressInfo.currentChunk = i;
        uploadProgressInfo.message = `已上传 ${uploadProgress.value}% (分片 ${i + 1}/${totalChunks})`;
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('分片上传失败:', error);
        throw new Error(`分片 ${i + 1} 上传失败: ${error.message}`);
      }
    }
    
    // 3. 完成上传
    uploadProgressInfo.message = '正在合并分片...';
    partETags.value.sort((a, b) => a.partNumber - b.partNumber);
    const { data: completeResult } = await completeMultipartUpload({
      uploadId: uploadId.value,
      filePath: filePath.value,
      partETags: partETags.value,
      clientName: uploadForm.clientName // 只传递clientName
    });
    
    uploadStatus.value = 'success';
    uploadProgressInfo.message = '上传完成';
    ElMessage.success('文件上传成功');
    emits('upload-success', completeResult);
    handleClose();
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

// 关闭弹窗
function handleClose() {
  resetUpload();
  visible.value = false;
}

// 监听弹窗显示状态
watch(visible, (newVal) => {
  if (newVal) {
    if (clientList.value.length === 0) {
      fetchClientList();
    }
  } else {
    resetUpload();
  }
});

onMounted(() => {
  fetchClientList();
});
</script>

<style scoped>
/* 自定义弹窗样式 */
.custom-upload-dialog {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.upload-form {
  padding: 20px 30px;
}

/* 自定义选择器样式 */
.el-select-custom {
  width: 100%;
}

/* 自定义上传区域样式 */
.custom-upload-area {
  min-height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background-color: #fafbfc;
  transition: all 0.3s ease;
  cursor: pointer;
}

.custom-upload-area:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.upload-content {
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 12px;
  transition: transform 0.3s ease;
}

.custom-upload-area:hover .upload-icon {
  transform: scale(1.1);
}

.upload-text {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
}

.upload-link {
  color: #409eff;
  font-style: normal;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.3s ease;
}

.upload-link:hover {
  color: #3a8ee6;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 自定义文件信息卡片 */
.custom-file-info-card {
  border-radius: 8px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: #303133;
  padding: 12px 16px;
  background-color: #fafafa;
  border-bottom: 1px solid #ebeef5;
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

.file-details {
  padding: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  padding: 6px 0;
}

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

/* 自定义进度条 */
.custom-progress {
  margin-bottom: 12px;
}

.progress-info {
  font-size: 14px;
  color: #606266;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-right {
  text-align: right;
}

.progress-text {
  display: flex;
  align-items: center;
}

.progress-icon {
  margin-right: 5px;
}

.progress-message {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unit {
  margin-left: 5px;
  color: #606266;
}

/* 自定义按钮 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 30px;
  background-color: #fafbfc;
  border-top: 1px solid #ebeef5;
}

.btn-cancel {
  margin-right: 12px;
}

.btn-upload {
  min-width: 120px;
}

/* 自定义数字输入框 */
.el-input-number-custom {
  width: 120px;
}
</style>    