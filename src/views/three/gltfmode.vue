<script setup name="Index" lang="ts">
import * as THREE from 'three'
import { Director, TreeNode } from './three-plus/ThreeHelper'
import { customRef, onMounted, reactive, ref, shallowReactive, shallowRef, watch } from 'vue';
import ModelPanel from './ModelPanel.vue'
import ThreePanel from './ThreePanel.vue'
import { loadModel } from './three-plus/utils';
import { explodeModel, initExplodeModel } from './three-plus/ExplodeControls';
import { Delete } from '@element-plus/icons-vue'
import Panel from './Panel.vue';
let director: Director | undefined
const canvas = ref()
const FPS = ref(30)
watch(FPS, () => director ? director.FPS = FPS.value : void 0)
const modelthree = ref(new Array<TreeNode>())
function refreshThree() {
    if (!director) return
    modelthree.value = director.generateTreeData()
}
const handleNodeClick = (node: TreeNode) => {
    if (!director?.scene) return
    const obj = director.getObjectByUUID(node.id)
    transform.object = obj
}
const selected = shallowRef()
watch(selected, () => {
    if (!director) return
    if (director.controls.capsControls.enabled) return
    director.controls.dragControls.enabled = true
    director.controls.dragControls.objects = director.controls.selectControls.outlinePass.selectedObjects
})
const transform = shallowReactive<{
    mode: "translate" | "rotate" | "scale",
    object: THREE.Object3D | null,
    explode: number
}>({
    object: null,
    mode: 'translate',
    explode: 0,
})
watch(() => transform.mode, () => {
    if (!director) return
    director.controls.transformControls.setMode(transform.mode)
})
watch(() => transform.object, () => {
    if (!director) return
    if (transform.object) {
        director.controls.selectControls.outlinePass.selectedObjects = [transform.object]
        director.controls.transformControls.attach(transform.object)
        director.controls.selectControls.enabled = false
        director.controls.dragControls.enabled = false
        director.scene.add(director.controls.transformControls.getHelper())
        initExplodeModel(transform.object)
    } else {
        director.controls.selectControls.outlinePass.selectedObjects = []
        director.controls.transformControls.detach()
        director.controls.selectControls.enabled = true
        director.controls.dragControls.enabled = true
        director.scene.remove(director.controls.transformControls.getHelper())
    }
})
watch(() => transform.explode, value => {
    if (!director || !transform.object) return
    explodeModel(transform.object, value)
})
const LoadModelLoading = ref(false)
const LoadModelStatus = ref("加载模型")

let globModel: THREE.Object3D | null = null
async function handelLoadModel() {
    if (!director) return
    LoadModelLoading.value = true
    const m = await loadModel(
        { gltf: '/glb/1.glb' },
        "glb",
        progress => LoadModelStatus.value = `当前进度${Math.round(progress.loaded / progress.total * 100)}%`
    )
    m.scale.set(0.3, 0.3, 0.3)
    globModel = m
    director.scene.add(m)
    refreshThree()
    LoadModelStatus.value = "完成"
    LoadModelLoading.value = false
}
function handelCapModel() {
    if (!director || !globModel) return
    director.controls.capsControls.enabled = !director.controls.capsControls.enabled
    director.controls.dragControls.enabled = !director.controls.capsControls.enabled
    director.controls.capsControls.objects = globModel
}
const ambientLight = ref({ intensity: 0 })
const ThreeContainerRef = ref<HTMLElement | null>(null)
onMounted(() => {
    if (ThreeContainerRef.value == null) return
    // 获取ThreeContainerRef的宽高
    director = new Director({
        canvas: canvas.value,
        width: window.innerWidth,
        height: window.innerHeight,
    })
    director.switchAxesHelper(true)
    director.switchGridHelper(true)
    director.switchStats(true)
    director.startRender()
    director.scene.background = new THREE.TextureLoader().load("/glb/bg.jpeg")
    ambientLight.value = director.ambientLight
    // 创建轮廓效果Pass
    director.controls.selectControls.onSelect = (obj: THREE.Object3D, event: MouseEvent) => {
        selected.value = obj
        const label = document.createElement('div');
        label.textContent = obj.name;
        label.style.position = 'absolute';
        label.style.top = event.clientY + 'px';
        label.style.left = event.clientX + 'px';
        label.style.color = 'white';
        label.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        label.style.padding = '5px';
        label.style.borderRadius = '5px';
        document.body.appendChild(label);
        setTimeout(() => document.body.removeChild(label), 5000);
    }
})
</script>

<template>
    <div class="three-container" ref="ThreeContainerRef" id="showCaps" style="position: relative;">
        <canvas id="canvas" ref="canvas" style="border: 1px solid;" />
        <Panel style="left: 10px;top: 10px;width: 250px;">
            <el-form label-width="100px" size="small">
                <el-form-item label="加载模型">
                    <el-button @click="handelLoadModel" v-loading="LoadModelLoading">
                        {{ LoadModelStatus }}
                    </el-button>
                </el-form-item>
                <el-form-item label="刨面模型">
                    <el-button @click="handelCapModel">
                        刨面模型
                    </el-button>
                </el-form-item>
                <el-form-item label="FPS">
                    <el-select v-model="FPS" placeholder="Select" style="width: 100%">
                        <el-option v-for="item in [15, 30, 45, 60, 90, 120]" :key="item" :label="item" :value="item" />
                    </el-select>
                </el-form-item>
                <el-form-item label="环境光强度">
                    <el-slider v-model="ambientLight.intensity" :step="0.1" :max="30" />
                </el-form-item>
            </el-form>
        </Panel>
        <Panel style="left: 10px;top: 250px;width: 250px;">
            <el-form label-width="100px" size="small">
                <el-form-item label="当前选择的模型">
                    <div style="display: flex;justify-content: space-between;width: 100%;">
                        <span>
                            {{ transform.object ? transform.object.name ? transform.object.name : 'model' : '无' }}
                        </span>
                        <el-button type="danger" circle @click="transform.object = null" :icon="Delete" size="small" />
                    </div>
                </el-form-item>
                <el-form-item label="爆炸距离">
                    <el-slider v-model="transform.explode" :step="0.1" :max="30" :min="1" />
                </el-form-item>
                <el-form-item label="当前变换模式">
                    <el-select v-model="transform.mode">
                        <el-option label="translate" value="translate" />
                        <el-option label="rotate" value="rotate" />
                        <el-option label="scale" value="scale" />
                    </el-select>
                </el-form-item>
            </el-form>
        </Panel>
        <Panel style="right: 10px;top: 60px;width: 300px;">
            <ThreePanel :modelthree="modelthree" @handleNodeClick="handleNodeClick" @refresh="refreshThree" />
        </Panel>
        <Panel style="bottom: 10px;" v-if="selected">
            <ModelPanel :model="selected" />
        </Panel>
    </div>
</template>
<style scoped lang="scss">
.three-container {
    width: 100%;
    height: 100%;
}
</style>