<script setup lang="ts">
import { TreeNode } from './three-plus/ThreeHelper';
const props = defineProps<{
    modelthree: TreeNode[]
}>()
const treeProps = {
    children: 'children',
    label: 'label',
    value: 'id'
}
</script>
<template>
    <div>
        <div>模型树 <el-button @click="$emit('refresh')" size="small">重新加载模型树</el-button></div>
        <div style="overflow: auto;height: 100%;">
            <el-tree-v2 style="height: 100%;background: none;" :data="modelthree" node-key="id" :props="treeProps"
                @node-click="$emit('handleNodeClick', $event)" :expand-on-click-node="false">
            </el-tree-v2>
        </div>
    </div>
</template>