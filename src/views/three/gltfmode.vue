<script setup name="Index" lang="ts">
import * as THREE from 'three'
import { Director, TreeNode } from './three-plus/ThreeHelper'
import { onMounted, ref, watch } from 'vue';
import ModelPanel from './ModelPanel.vue'
import ThreePanel from './ThreePanel.vue'
import { loadModel } from './three-plus/utils';
import { explodeModel, initExplodeModel } from './three-plus/ExplodeControls';

const canvas = ref()
const FPS = ref(30)
watch(FPS, () => director ? director.FPS = FPS.value : void 0)
let director: Director | undefined
const modelthree = ref(new Array<TreeNode>())
const selected = ref()
watch(selected, () => {
    if (director) {
        director.controls.dragControls.enabled = true
        director.controls.dragControls.objects = director.controls.selectControls.outlinePass.selectedObjects
    }
})
const handleNodeClick = (node: TreeNode) => {
    if (!director?.scene) return
    const obj = director.getObjectByUUID(node.id)
    if (obj) {
        director.controls.selectControls.outlinePass.selectedObjects = [obj]
        // director.controls.dragControls.objects = [obj]
        director.controls.dragControls.enabled = false
        director.controls.transformControls.attach(obj)
        selected.value = obj
    }
}
const LoadModelLoading = ref(false)
const LoadModelStatus = ref("加载模型")
function refreshThree() {
    if (!director) return
    modelthree.value = director.generateTreeData()
}
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
    if (director && globModel) {
        director.controls.capsControls.enabled = !director.controls.capsControls.enabled
        director.controls.capsControls.objects = globModel
    }
}
const ambientLight = ref({ intensity: 0 })
const baozha = ref(0)
watch(baozha, value => {
    if (director) {
        if (!!selected.value) {
            if (!selected.value.userData.canExplode) {
                initExplodeModel(selected.value)
            }
            explodeModel(selected.value, value)
        }
    }
})
const ThreeContainerRef = ref<HTMLElement | null>(null)
onMounted(() => {
    if (ThreeContainerRef.value == null) return
    // 获取ThreeContainerRef的宽高
    director = new Director({
        canvas: canvas.value,
        width: ThreeContainerRef.value.offsetWidth,
        height: ThreeContainerRef.value.offsetHeight
    })
    director.switchAxesHelper(true)
    director.switchGridHelper(true)
    director.startRender()
    director.stats.dom.style.position = 'absolute'
    director.renderer.domElement.parentElement!.appendChild(director.stats.dom)
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
        <div class="panel" style="left: 10px;top: 100px;width: 200px;">
            <el-form label-width="80px" size="small">
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
                <el-form-item label="爆炸距离" v-if="selected">
                    <el-slider v-model="baozha" :step="0.1" :max="30" :min="1" />
                </el-form-item>
            </el-form>
        </div>
        <div class="panel" style="right: 10px;top: 100px;width: 300px;">
            <ThreePanel :modelthree="modelthree" @handleNodeClick="handleNodeClick" @refresh="refreshThree" />
        </div>
        <div class="panel" style="bottom: 0;" v-if="selected">
            <ModelPanel :model="selected" />
        </div>
    </div>
</template>
<style scoped lang="scss">
.three-container {
    width: 100%;
    height: 100%;
}

.panel {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    z-index: 999;
    color: white;

    &:hover {
        background-color: rgba(0, 0, 0, 0.8);
    }
}
</style>