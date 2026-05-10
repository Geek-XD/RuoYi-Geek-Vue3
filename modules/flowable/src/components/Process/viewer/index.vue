<template>
  <div class="containers">
    <el-container style="align-items: stretch">
      <el-main class="flow-viewer">
        <div class="process-status">
          <span class="intro">状态：</span>
          <div class="finish">已办理</div>
          <div class="processing">处理中</div>
          <div class="todo">未进行</div>
        </div>
        <!-- 流程图显示 -->
        <div v-loading="loading" class="canvas" ref="flowCanvas"></div>
        <!--  按钮区域  -->
        <el-button-group class="button-group">
          <el-tooltip effect="dark" content="适中" placement="bottom">
            <el-button size="small" icon="rank" @click="fitViewport" />
          </el-tooltip>
          <el-tooltip effect="dark" content="放大" placement="bottom">
            <el-button size="small" icon="zoom-in" @click="zoomViewport(true)" />
          </el-tooltip>
          <el-tooltip effect="dark" content="缩小" placement="bottom">
            <el-button size="small" icon="zoom-out" @click="zoomViewport(false)" />
          </el-tooltip>
        </el-button-group>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { type PropType, ref, watch } from 'vue'
import { CustomViewer as BpmnViewer } from '../common'
import type {
  BpmnFlowNodeLike,
  CanvasLike,
  FlowViewerData,
  FlowViewerNodeData,
  ViewerLike
} from '../common/types'

defineOptions({
  name: 'BpmnViewer'
})

/** 组件传值  */
const props = defineProps({
  // 回显数据传值
  flowData: {
    type: Object as PropType<Partial<FlowViewerData>>,
    default: () => ({}),
    required: false
  },
  procInsId: {
    type: String,
    default: ''
  },
})

const flowCanvas = ref<HTMLElement | null>(null)
const bpmnViewer = ref<ViewerLike | null>(null)
const loading = ref(true)
const zoom = ref(1)

/** 传值监听 */
watch(() => props.flowData, (newValue: Partial<FlowViewerData>) => {
  if (newValue?.xmlData) {
    const container = flowCanvas.value as HTMLElement | undefined
    if (!container) return

    // 生成实例
    bpmnViewer.value?.destroy()
    bpmnViewer.value = new BpmnViewer({
      container,
      height: 'calc(100vh - 200px)',
    }) as unknown as ViewerLike
    void loadFlowCanvas(newValue as FlowViewerData)
  }
})

// 加载流程图片
async function loadFlowCanvas(flowData: FlowViewerData): Promise<void> {
  if (!bpmnViewer.value) return

  try {
    await bpmnViewer.value.importXML(flowData.xmlData)
    fitViewport()
    // 流程线高亮设置
    if (flowData.nodeData !== undefined && flowData.nodeData.length > 0 && props.procInsId) {
      fillColor(flowData.nodeData)
    }
  } catch (error) {
    reportViewerError('导入流程图失败', error)
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return '未知错误'
}

function reportViewerError(context: string, error: unknown): void {
  console.error(`[ProcessViewer] ${context}: ${getErrorMessage(error)}`)
}

function addMarker(canvas: CanvasLike, id: string | undefined, marker: string): void {
  if (!id) return
  canvas.addMarker(id, marker)
}

// 让图能自适应屏幕
function fitViewport(): void {
  const canvas = bpmnViewer.value?.get<CanvasLike>('canvas')
  if (!canvas) return

  zoom.value = canvas.zoom('fit-viewport', 'auto')
  loading.value = false
}

// 放大缩小
function zoomViewport(zoomIn = true): void {
  const canvas = bpmnViewer.value?.get<CanvasLike>('canvas')
  if (!canvas) return

  zoom.value = canvas.zoom()
  zoom.value += (zoomIn ? 0.1 : -0.1)
  if (zoom.value >= 0.2) canvas.zoom(zoom.value)
}

// 设置高亮颜色的
function fillColor(nodeData: FlowViewerNodeData[]): void {
  const canvas = bpmnViewer.value?.get<CanvasLike>('canvas')
  const flowElements = bpmnViewer.value?.getDefinitions().rootElements?.[0]?.flowElements ?? []
  if (!canvas || flowElements.length === 0) return

  flowElements.forEach((n: BpmnFlowNodeLike) => {
    const completeTask = nodeData.find(m => m.key === n.id)
    const todoTask = nodeData.find(m => !m.completed)
    const endTask = nodeData[nodeData.length - 1]
    if (n.$type === 'bpmn:UserTask') {
      if (completeTask) {
        addMarker(canvas, n.id, completeTask.completed ? 'highlight' : 'highlight-todo')
        n.outgoing?.forEach(nn => {
          const targetId = nn.targetRef?.id
          if (!targetId) return

          const targetTask = nodeData.find(m => m.key === targetId)
          if (targetTask) {
            if (todoTask && completeTask.key === todoTask.key && !todoTask.completed) {
              addMarker(canvas, nn.id, todoTask.completed ? 'highlight' : 'highlight-todo')
              addMarker(canvas, targetId, todoTask.completed ? 'highlight' : 'highlight-todo')
            } else {
              addMarker(canvas, nn.id, targetTask.completed ? 'highlight' : 'highlight-todo')
              addMarker(canvas, targetId, targetTask.completed ? 'highlight' : 'highlight-todo')
            }
          }
        })
      }
    }
    // 排他网关
    else if (n.$type === 'bpmn:ExclusiveGateway') {
      if (completeTask) {
        addMarker(canvas, n.id, completeTask.completed ? 'highlight' : 'highlight-todo')
        n.outgoing?.forEach(nn => {
          const targetId = nn.targetRef?.id
          if (!targetId) return

          const targetTask = nodeData.find(m => m.key === targetId)
          if (targetTask) {
            addMarker(canvas, nn.id, targetTask.completed ? 'highlight' : 'highlight-todo')
            addMarker(canvas, targetId, targetTask.completed ? 'highlight' : 'highlight-todo')
          }
        })
      }
    }
    // 并行网关
    else if (n.$type === 'bpmn:ParallelGateway') {
      if (completeTask) {
        addMarker(canvas, n.id, completeTask.completed ? 'highlight' : 'highlight-todo')
        n.outgoing?.forEach(nn => {
          const targetId = nn.targetRef?.id
          if (!targetId) return

          const targetTask = nodeData.find(m => m.key === targetId)
          if (targetTask) {
            addMarker(canvas, nn.id, targetTask.completed ? 'highlight' : 'highlight-todo')
            addMarker(canvas, targetId, targetTask.completed ? 'highlight' : 'highlight-todo')
          }
        })
      }
    } else if (n.$type === 'bpmn:StartEvent') {
      n.outgoing?.forEach(nn => {
        const targetId = nn.targetRef?.id
        if (!targetId) return

        const completeTask = nodeData.find(m => m.key === targetId)
        if (completeTask) {
          addMarker(canvas, nn.id, 'highlight')
          addMarker(canvas, n.id, 'highlight')
          return;
        }
      })
    } else if (n.$type === 'bpmn:EndEvent') {
      if (endTask?.key === n.id && endTask.completed) {
        addMarker(canvas, n.id, 'highlight')
        return;
      }
    }
  })
}
</script>

<style lang="scss">
@use "../style/flow-viewer.scss" as *;
</style>
