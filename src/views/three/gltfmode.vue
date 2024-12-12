<script setup name="Index" lang="ts">
import * as THREE from 'three'
import { DragControls } from 'three/examples/jsm/controls/DragControls.js'
import { loadModel, Director, TreeNode, initExplodeModel, explodeModel } from './three-plus/ThreeHelper'
import { onMounted, ref, watch } from 'vue';
import ModelPanel from './ModelPanel.vue'
import ThreePanel from './ThreePanel.vue'
import CAPS from './three-plus/CapsControls';

const canvas = ref()
const FPS = ref(30)
watch(FPS, () => director ? director.FPS = FPS.value : void 0)
let director: Director | undefined
const modelthree = ref(new Array<TreeNode>())
const selected = ref()
const handleNodeClick = (node: TreeNode) => {
    if (!director?.scene) return
    const obj = director.getObjectByUUID(node.id)

    if (obj) {
        director.selectControls.outlinePass.selectedObjects = [obj]
        selected.value = obj
    }
}
const LoadModelLoading = ref(false)
const LoadModelStatus = ref("加载模型")
async function handelLoadModel() {
    if (!director) return
    LoadModelLoading.value = true
    const m = await loadModel({ gltf: '/glb/2.glb' }, "glb", progress => {
        // 当前进度
        LoadModelStatus.value = `当前进度${Math.round(progress.loaded / progress.total * 100)}%`
    })
    m.scale.set(0.3, 0.3, 0.3)
    director.scene.add(m)
    modelthree.value = director.generateTreeData()
    // const dControls = new DragControls([], director.camera, director.renderer.domElement)
    // dControls.objects = [m]
    // dControls.addEventListener('dragstart', function () {
    //     if (director) director.controls.enabled = false
    // })
    // dControls.addEventListener('dragend', function () {
    //     if (director) director.controls.enabled = true
    // })
    LoadModelStatus.value = "完成"
    LoadModelLoading.value = false
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
    const caps = new CAPS.Simulation(director.renderer,director.camera,director.scene,director.controls)
    director.startRender(()=>{
        caps.update()
    })
    director.stats.dom.style.position = 'absolute'
    director.renderer.domElement.parentElement!.appendChild(director.stats.dom)
    director.scene.background = new THREE.TextureLoader().load("/glb/environment/bg.jpeg")
    ambientLight.value = director.ambientLight
    // 创建轮廓效果Pass
    director.selectControls.onSelect = (obj: THREE.Object3D, event: MouseEvent) => {
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
        <label><input id="showCaps" type="checkbox" checked /> Show caps</label>
        <canvas id="canvas" ref="canvas" style="border: 1px solid;" />
        <div class="panel" style="left: 10px;top: 100px;width: 200px;">
            <el-form label-width="80px" size="small">
                <el-form-item label="加载模型">
                    <el-button @click="handelLoadModel" v-loading="LoadModelLoading">
                        {{ LoadModelStatus }}
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
        <div class="panel" style="right: 10px;top: 100px;width: 200px;">
            <ThreePanel :modelthree="modelthree" @handleNodeClick="handleNodeClick" />
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
    max-height: 300px;

    &:hover {
        background-color: rgba(0, 0, 0, 0.8);
    }
}
</style>