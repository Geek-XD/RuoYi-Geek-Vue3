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
    director = new Director({ canvas: canvas.value, width: 800, height: 500 })
    director.switchAxesHelper(true)
    director.switchGridHelper(true)
    director.startRender(fps => FPS.value = fps)
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
}

onMounted(() => {
    main()
})

import ModelPanel from './ModelPanel.vue'
</script>

<template>
    <div class="app-container">
        <el-row>
            <el-col :span="4">
                <div>
                    <el-form>
                        <el-form-item label="加载模型">
                            <el-button @click="handelLoadModel" v-loading="LoadModelLoading">加载模型</el-button>
                        </el-form-item>
                        <el-form-item label="FPS">
                            {{ FPS }}
                        </el-form-item>
                        <el-form-item label="环境光强度">
                            <el-slider v-model="ambientLight.intensity" :step="0.1" :max="30" />
                        </el-form-item>
                        <el-form-item label="爆炸距离" v-if="selected">
                            <el-slider v-model="baozha" :step="1" :max="30" :min="1" />
                        </el-form-item>
                    </el-form>
                </div>
            </el-col>
            <el-col :span="16">
                <div class="canvas-container" ref="CanvasContainerRef">
                    <canvas id="canvas" ref="canvas" style="border: 1px solid;"></canvas>
                </div>
            </el-col>
            <el-col :span="4">
                <h1>模型树</h1>
                <div style="overflow: auto;height: 100%;" :key="reload">
                    <el-tree-v2 style="height: 100%" :data="modelthree" node-key="id" :props="treeProps"
                        @node-click="handleNodeClick" :expand-on-click-node="false">
                    </el-tree-v2>
                </div>
            </el-col>
        </el-row>
        <div v-if="selected">
            <ModelPanel :model="selected"></ModelPanel>
        </div>
    </div>
</template>
<style scoped lang="scss">
.canvas-container {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}
</style>