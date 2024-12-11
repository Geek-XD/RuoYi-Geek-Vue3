<script setup name="Index" lang="ts">
import * as THREE from 'three'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js'
import { loadModel, Director, TreeNode, getWorldCenterPosition, initExplodeModel, explodeModel } from './ThreeHelper'
import { onMounted, ref, watch } from 'vue';
const treeProps = {
    children: 'children',
    label: 'label',
    value: 'id'
}
const canvas = ref()
const CanvasContainerRef = ref()
const FPS = ref(30)
watch(FPS, () => {
    if (director) {
        director.FPS = FPS.value
    }
})
let director: Director | undefined
const modelthree = ref(new Array<TreeNode>())
const reload = ref(1)
const selected = ref()
const handleNodeClick = (node: TreeNode) => {
    if (!director?.scene) return
    const obj = director.getObjectByUUID(node.id)
    console.log(obj);

    if (obj) {
        director.selected.selectedObjects = [obj]
        selected.value = obj
    }
}
const LoadModelLoading = ref(false)
const LoadModelStatus = ref("加载模型")
async function handelLoadModel() {
    if (!director) return
    LoadModelLoading.value = true
    const m = await loadModel({ gltf: '/glb/3.glb' }, "glb", progress => {
        // 当前进度
        LoadModelStatus.value = `当前进度${Math.round(progress.loaded / progress.total * 100)}%`
    })
    m.scale.set(0.3, 0.3, 0.3)
    initExplodeModel(m)
    reload.value++
    LoadModelLoading.value = false
    director.scene.add(m)
    modelthree.value = director.generateTreeData()
    console.log(modelthree.value);

    const dControls = new DragControls([], director.camera, director.renderer.domElement)
    dControls.objects = [m]
    dControls.addEventListener('dragstart', function () {
        if (director) director.controls.enabled = false
    })
    dControls.addEventListener('dragend', function () {
        if (director) director.controls.enabled = true
    })
}

const ambientLight = ref({ intensity: 0 })
const baozha = ref(0)
watch(baozha, value => {
    if (director) {
        if (!!director.selected.selectedObjects && director.selected.selectedObjects.length > 0) {
            if (!selected.value.userData.canExplode) {
                initExplodeModel(selected.value)
            }
            explodeModel(selected.value, value)
        }
    }
})
function main() {

}
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
    director.scene.background = new THREE.TextureLoader().load("/glb/environment/bg.jpeg")
    ambientLight.value = director.ambientLight
    // 创建轮廓效果Pass
    director.onSelect = (obj: THREE.Object3D, event: MouseEvent) => {
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
        setTimeout(() => {
            document.body.removeChild(label);
        }, 5000);
    }
})

import ModelPanel from './ModelPanel.vue'
</script>

<template>
    <div class="three-container" ref="ThreeContainerRef" style="position: relative;">
        <canvas id="canvas" ref="canvas" style="border: 1px solid;" />
        <div class="panel" style="left: 10px;top: 100px;width: 200px;">
            <el-form label-width="80px" size="small">
                <el-form-item label="加载模型">
                    <el-button @click="handelLoadModel" v-loading="LoadModelLoading">加载模型</el-button>
                </el-form-item>
                <el-form-item label="FPS">
                    <el-select v-model="FPS" placeholder="Select" style="width: 100%">
                        <el-option v-for="item in [15,30,45,60,90,120]" :key="item" :label="item" :value="item" />
                    </el-select>
                </el-form-item>
                <el-form-item label="环境光强度">
                    <el-slider v-model="ambientLight.intensity" :step="0.1" :max="30" />
                </el-form-item>
                <el-form-item label="爆炸距离" v-if="selected">
                    <el-slider v-model="baozha" :step="1" :max="30" :min="1" />
                </el-form-item>
            </el-form>
        </div>
        <div class="panel" style="right: 10px;top: 100px;width: 200px;">
            <div>模型树</div>
            <div style="overflow: auto;height: 100%;" :key="reload">
                <el-tree-v2 style="height: 100%;background: none;" :data="modelthree" node-key="id" :props="treeProps"
                    @node-click="handleNodeClick" :expand-on-click-node="false">
                </el-tree-v2>
            </div>
        </div>
        <div class="panel" style="bottom: 0;" v-if="selected">
            <ModelPanel :model="selected"></ModelPanel>
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