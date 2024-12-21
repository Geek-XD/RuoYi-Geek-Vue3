<script setup lang="ts">
import director, { transform, unselectObject } from './director';
import { Delete, MagicStick } from '@element-plus/icons-vue'
import { initExplodeModel } from './three-plus/ExplodeControls';
import { onMounted } from 'vue';
const reExplode = () => {
    if (!transform.object) return
    initExplodeModel(transform.object)
    transform.explode = 0
}

function handelCapModel() {
    if (!director || !transform.object) return
    director.controls.capsControls.enabled = !director.controls.capsControls.enabled
    director.controls.dragControls.enabled = !director.controls.capsControls.enabled
    director.controls.capsControls.objects = transform.object
}
</script>
<template>
    <el-form label-width="100px" size="small" label-position="left">
        <el-form-item label="当前选择的模型">
            <div style="display: flex;justify-content: space-between;width: 100%;">
                <span>
                    {{ transform.object ? transform.object.name ? transform.object.name : 'model' : '无' }}
                </span>
                <el-button type="danger" circle @click="unselectObject" :icon="Delete" size="small" />
            </div>
        </el-form-item>
        <el-form-item>
            <template #label>
                <div style="display: inline-flex;align-items: center;justify-content: space-between;width: 100%;">
                    <div>爆炸距离</div>
                    <el-button :icon="MagicStick" circle size="small" @click="reExplode" />
                </div>
            </template>
            <el-slider v-model="transform.explode" :step="0.1" :max="30" :min="1" />
        </el-form-item>
        <el-form-item label="当前变换模式">
            <el-select v-model="transform.mode">
                <el-option label="translate" value="translate" />
                <el-option label="rotate" value="rotate" />
                <el-option label="scale" value="scale" />
            </el-select>
        </el-form-item>
        <el-form-item label="刨面模型">
            <el-button @click="handelCapModel">
                刨面模型
            </el-button>
        </el-form-item>
    </el-form>
</template>