<template>
  <div v-loading="isView" class="flow-containers" :class="{ 'view-mode': isView }"
    @contextmenu.capture="handleContextMenu">
    <el-container style="height: 100%">
      <el-header style="border-bottom: 1px solid rgb(218 218 218);height: auto;padding-left:0">
        <div style="display: flex; padding: 10px 0; justify-content: space-between;">
          <el-button-group>
            <el-upload action="" :before-upload="openBpmn" style="margin-right: 10px; display:inline-block;">
              <el-tooltip effect="dark" content="加载xml" placement="bottom">
                <el-button icon="FolderOpened" />
              </el-tooltip>
            </el-upload>
            <el-tooltip effect="dark" content="新建" placement="bottom">
              <el-button icon="CirclePlus" @click="newDiagram" />
            </el-tooltip>
            <el-tooltip effect="dark" content="自适应屏幕" placement="bottom">
              <el-button icon="Rank" @click="fitViewport" />
            </el-tooltip>
            <el-tooltip effect="dark" content="放大" placement="bottom">
              <el-button icon="ZoomIn" @click="zoomViewport(true)" />
            </el-tooltip>
            <el-tooltip effect="dark" content="缩小" placement="bottom">
              <el-button icon="ZoomOut" @click="zoomViewport(false)" />
            </el-tooltip>
            <el-tooltip effect="dark" content="后退" placement="bottom">
              <el-button icon="Back" @click="modeler.get('commandStack').undo()" />
            </el-tooltip>
            <el-tooltip effect="dark" content="前进" placement="bottom">
              <el-button icon="Right" @click="modeler.get('commandStack').redo()" />
            </el-tooltip>
          </el-button-group>
          <el-button-group>
            <el-button icon="view" @click="showXML">查看xml</el-button>
            <el-button icon="download" @click="saveXML(true)">下载xml</el-button>
            <el-button icon="picture" @click="saveImg('svg', true)">下载svg</el-button>
            <el-button type="primary" @click="save">保存模型</el-button>
            <el-button type="danger" @click="goBack">关闭</el-button>
          </el-button-group>
        </div>
      </el-header>
      <!-- 流程设计页面 -->
      <el-container style="align-items: stretch; position: relative;">
        <el-main>
          <div ref="canvas" class="canvas" />
        </el-main>

        <!--右侧属性栏-->
        <designer v-if="loadCanvas" class="normalPanel"></designer>
      </el-container>

      <div v-if="contextMenu.visible" ref="contextMenuRef" class="process-context-menu" :style="contextMenuStyle"
        @contextmenu.prevent>
        <div class="process-context-menu__title">{{ contextMenu.title }}</div>
        <button v-for="item in contextMenu.items" :key="item.key" type="button" class="process-context-menu__item"
          @click.stop="runContextMenuAction(item)">
          <i v-if="item.iconClass" :class="item.iconClass" class="process-context-menu__icon"></i>
          <span>{{ item.label }}</span>
        </button>
      </div>
    </el-container>
  </div>
</template>

<script setup lang="ts">
// 汉化
import customTranslate from './customPanel/customTranslate'
import Modeler from 'bpmn-js/lib/Modeler'
import Designer from './designer'
import getInitStr from './flowable/init'
import { StrUtil } from '@ruoyi/core/utils/StrUtil'
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, watch } from 'vue'
// 引入flowable的节点文件
import FlowableModule from './flowable/flowable.json'
import customControlsModule from './customPanel'
import modelerStore from '@ruoyi/module-flowable/components/Process/common/global'
import type {
  BpmnBusinessObjectLike,
  CanvasLike,
  BpmnElementLike,
  ElementRegistryLike,
  ModelerLike,
  ProcessInfo,
  ProcessSaveResult,
  TabControllerLike
} from './common/types'

defineOptions({
  name: 'BpmnModel'
})

const emit = defineEmits<{
  (e: 'save', result: ProcessSaveResult): void
  (e: 'showXML', xmlStr: string): void
}>()

const vm = getCurrentInstance()?.proxy as (TabControllerLike & { $tab?: TabControllerLike }) | undefined

/** 组件传值  */
const props = withDefaults(defineProps<{
  xml?: string
  isView?: boolean
}>(), {
  xml: '',
  isView: false
})

const canvas = ref<HTMLElement | null>(null)
const modeler = ref<ModelerLike | null>(null)
const zoom = ref(1)
const loadCanvas = ref(false) // 当前组件渲染然后再加载canvas
const contextMenuRef = ref<HTMLElement | null>(null)

interface ProcessContextMenuItem {
  key: string
  label: string
  iconClass?: string
  action: () => void
}

interface ProcessContextMenuState {
  visible: boolean
  x: number
  y: number
  title: string
  items: ProcessContextMenuItem[]
}

interface ContextPadEntryLike {
  className?: string
  title?: string
  separator?: boolean
  action?: {
    click?: (event: { x?: number; y?: number } | unknown, element: BpmnElementLike) => void
    dragstart?: (event: unknown, element: BpmnElementLike) => void
  }
}

interface ContextPadLike {
  getEntries(element: BpmnElementLike): Record<string, ContextPadEntryLike>
}

const CONTEXT_MENU_MARGIN = 12
const CONTEXT_MENU_WIDTH = 240
const CONTEXT_MENU_ITEM_HEIGHT = 36

const contextMenu = ref<ProcessContextMenuState>({
  visible: false,
  x: 0,
  y: 0,
  title: '',
  items: []
})

const contextMenuStyle = computed(() => ({
  left: `${contextMenu.value.x}px`,
  top: `${contextMenu.value.y}px`
}))

let selectionChangedCleanup: (() => void) | null = null
let importDoneCleanup: (() => void) | null = null
let documentPointerDownCleanup: (() => void) | null = null
let escapeKeyDownCleanup: (() => void) | null = null

const additionalModules = computed<unknown[]>(() => {
  const modules: unknown[] = []
  modules.push(customControlsModule)
  modules.push({ //汉化
    translate: ['value', customTranslate]
  })
  return modules
})

/** 传值监听 */
watch(() => props.xml, (newVal: string) => {
  if (StrUtil.isNotBlank(newVal)) {
    void createNewDiagram(newVal)
  } else {
    newDiagram()
  }
}, {
  immediate: true, // 立即生效
})

onMounted(() => {
  /** 创建bpmn 实例 */
  const modelerInstance = new Modeler({
    container: canvas.value as HTMLElement,
    additionalModules: additionalModules.value,
    moddleExtensions: {
      flowable: FlowableModule
    },
  }) as unknown as ModelerLike
  modeler.value = modelerInstance
  // 注册 modeler 相关信息
  modelerStore.modeler = modelerInstance
  modelerStore.modeling = modelerInstance.get('modeling')
  modelerStore.moddle = modelerInstance.get('moddle')
  modelerStore.canvas = modelerInstance.get('canvas') as CanvasLike
  modelerStore.bpmnFactory = modelerInstance.get('bpmnFactory')
  modelerStore.elRegistry = modelerInstance.get('elementRegistry')
  registerContextMenuGuards(modelerInstance)
  // 直接点击新建按钮时,进行新增流程图
  if (StrUtil.isBlank(props.xml)) {
    newDiagram()
  } else {
    void createNewDiagram(props.xml)
  }
})

onBeforeUnmount(() => {
  hideContextMenu()
  selectionChangedCleanup?.()
  importDoneCleanup?.()
  documentPointerDownCleanup?.()
  escapeKeyDownCleanup?.()
})

// 根据默认文件初始化流程图
function newDiagram(): void {
  void createNewDiagram(getInitStr())
}

// 根据提供的xml创建流程图
async function createNewDiagram(data: string): Promise<void> {
  // 将字符串转换成图显示出来
  // data = data.replace(/<!\[CDATA\[(.+?)]]>/g, '&lt;![CDATA[$1]]&gt;')
  if (modelerStore.modeler) {
    data = data.replace(/<!\[CDATA\[(.+?)]]>/g, function (_match, str: string) {
      return str.replace(/</g, '&lt;')
    })
    try {
      await modelerStore.modeler.importXML(data)
      fitViewport()
    } catch (error) {
      reportModelerError('导入流程图失败', error)
    }
  }
}

// 让图能自适应屏幕
function fitViewport(): void {
  const canvasInstance = modelerStore.canvas
  if (!canvasInstance) return

  zoom.value = canvasInstance.zoom('fit-viewport')
  const viewportElement = document.querySelector<SVGGraphicsElement>('.flow-containers .viewport')
  if (!viewportElement) {
    loadCanvas.value = true
    return
  }

  const bbox = viewportElement.getBBox()
  const currentViewBox = canvasInstance.viewbox()
  const elementMid = {
    x: bbox.x + bbox.width / 2 - 65,
    y: bbox.y + bbox.height / 2
  }
  canvasInstance.viewbox({
    x: elementMid.x - currentViewBox.width / 2,
    y: elementMid.y - currentViewBox.height / 2,
    width: currentViewBox.width,
    height: currentViewBox.height
  })
  zoom.value = bbox.width / currentViewBox.width * 1.8
  loadCanvas.value = true
}

function hideContextMenu(): void {
  contextMenu.value.visible = false
}

function clampContextMenuPosition(clientX: number, clientY: number, itemCount: number): { x: number; y: number } {
  const estimatedHeight = 44 + itemCount * CONTEXT_MENU_ITEM_HEIGHT
  const maxX = Math.max(CONTEXT_MENU_MARGIN, window.innerWidth - CONTEXT_MENU_WIDTH - CONTEXT_MENU_MARGIN)
  const maxY = Math.max(CONTEXT_MENU_MARGIN, window.innerHeight - estimatedHeight - CONTEXT_MENU_MARGIN)

  return {
    x: Math.min(Math.max(clientX, CONTEXT_MENU_MARGIN), maxX),
    y: Math.min(Math.max(clientY, CONTEXT_MENU_MARGIN), maxY)
  }
}

function buildCanvasContextMenuItems(): ProcessContextMenuItem[] {
  const items: ProcessContextMenuItem[] = [
    {
      key: 'fitViewport',
      label: '自适应屏幕',
      action: () => fitViewport()
    },
    {
      key: 'showXML',
      label: '查看 XML',
      action: () => {
        void showXML()
      }
    }
  ]

  if (!props.isView) {
    items.push({
      key: 'save',
      label: '保存模型',
      action: () => {
        void save()
      }
    })
  }

  return items
}

function resolveContextPadEntries(element: BpmnElementLike): Record<string, ContextPadEntryLike> {
  const contextPad = modelerStore.modeler?.get('contextPad') as ContextPadLike | undefined
  if (!contextPad) return {}

  return contextPad.getEntries(element)
}

function buildElementContextMenuItems(element: BpmnElementLike, clientX: number, clientY: number): ProcessContextMenuItem[] {
  const entries = resolveContextPadEntries(element)

  return Object.entries(entries)
    .filter(([, entry]) => !entry.separator && typeof entry.action?.click === 'function')
    .map(([key, entry]) => ({
      key,
      label: entry.title ?? key,
      iconClass: entry.className,
      action: () => {
        entry.action?.click?.({ x: clientX, y: clientY }, element)
      }
    }))
}

function openContextMenu(title: string, items: ProcessContextMenuItem[], clientX: number, clientY: number): void {
  if (items.length === 0) return

  const position = clampContextMenuPosition(clientX, clientY, items.length)
  contextMenu.value = {
    visible: true,
    x: position.x,
    y: position.y,
    title,
    items
  }
}

function runContextMenuAction(item: ProcessContextMenuItem): void {
  hideContextMenu()
  item.action()
}

function resolveBpmnElement(target: Element): BpmnElementLike | null {
  const gfx = target.closest('.djs-element')
  if (!gfx) return null

  const elementRegistry = (modelerStore.elRegistry ?? modelerStore.modeler?.get('elementRegistry')) as ElementRegistryLike | null
  if (!elementRegistry) return null

  return elementRegistry.get(gfx) ?? null
}

function isEditableRightClickTarget(target: Element): boolean {
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"], .el-input, .el-textarea, .djs-direct-editing-parent, .djs-direct-editing-content'))
}

function handleContextMenu(event: MouseEvent): void {
  const target = event.target
  if (!(target instanceof Element)) return

  if (!target.closest('.canvas')) {
    return
  }

  if (isEditableRightClickTarget(target)) {
    return
  }

  const element = resolveBpmnElement(target)
  const items = element
    ? buildElementContextMenuItems(element, event.clientX, event.clientY)
    : buildCanvasContextMenuItems()

  if (items.length === 0) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  openContextMenu(element?.businessObject?.name?.trim() ? `${element.businessObject.name}` : element?.id ?? '画布快捷操作', items, event.clientX, event.clientY)
}

function registerContextMenuGuards(modelerInstance: ModelerLike): void {
  const closeOnSelectionChange = (): void => hideContextMenu()
  const closeOnImportDone = (): void => hideContextMenu()
  const closeOnPointerDown = (event: PointerEvent): void => {
    if (!contextMenu.value.visible) return

    const target = event.target
    if (target instanceof Node && contextMenuRef.value?.contains(target)) {
      return
    }

    hideContextMenu()
  }
  const closeOnEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      hideContextMenu()
    }
  }

  modelerInstance.on('selection.changed', closeOnSelectionChange)
  modelerInstance.on('import.done', closeOnImportDone)
  selectionChangedCleanup = () => {
    modelerInstance.off?.('selection.changed', closeOnSelectionChange)
  }
  importDoneCleanup = () => {
    modelerInstance.off?.('import.done', closeOnImportDone)
  }

  document.addEventListener('pointerdown', closeOnPointerDown, true)
  window.addEventListener('keydown', closeOnEscape)

  documentPointerDownCleanup = () => {
    document.removeEventListener('pointerdown', closeOnPointerDown, true)
  }
  escapeKeyDownCleanup = () => {
    window.removeEventListener('keydown', closeOnEscape)
  }
}

// 放大缩小
function zoomViewport(zoomIn = true): void {
  const canvasInstance = modelerStore.canvas
  if (!canvasInstance) return

  zoom.value = canvasInstance.zoom()
  zoom.value += (zoomIn ? 0.1 : -0.1)
  canvasInstance.zoom(zoom.value)
}

// 获取流程基础信息
function getProcess(): ProcessInfo {
  const element = getProcessElement()
  return {
    id: element?.id,
    name: element?.name,
    category: element?.processCategory
  }
}

// 获取流程主面板节点
function getProcessElement(): BpmnBusinessObjectLike | undefined {
  const rootElements = modelerStore.modeler?.getDefinitions().rootElements ?? []
  return rootElements.find(element => element.$type === 'bpmn:Process')
}

// 保存xml
async function saveXML(download = false): Promise<string | undefined> {
  if (!modelerStore.modeler) return undefined

  try {
    const { xml } = await modelerStore.modeler.saveXML({ format: true })
    if (download) {
      downloadFile(`${getProcessElement()?.name ?? 'process'}.bpmn20.xml`, xml, 'application/xml')
    }
    return xml
  } catch (error) {
    reportModelerError('导出 XML 失败', error)
    return undefined
  }
}

// 在线查看xml
async function showXML(): Promise<void> {
  try {
    const xmlStr = await saveXML()
    if (xmlStr) emit('showXML', xmlStr)
  } catch (error) {
    reportModelerError('展示 XML 失败', error)
  }
}

// 保存流程图为svg
async function saveImg(type = 'svg', download = false): Promise<string | undefined> {
  if (!modelerStore.modeler) return undefined

  try {
    const { svg } = await modelerStore.modeler.saveSVG({ format: true })
    if (download) {
      downloadFile(getProcessElement()?.name ?? type, svg, 'image/svg+xml')
    }
    return svg
  } catch (error) {
    reportModelerError('导出 SVG 失败', error)
    return undefined
  }
}

// 保存流程图
async function save(): Promise<void> {
  const process = getProcess()
  const xml = await saveXML()
  const svg = await saveImg()
  const result: ProcessSaveResult = { process, xml, svg }
  emit('save', result)
  postSaveResultSafely(result)
  goBack()
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return '未知错误'
}

function reportModelerError(context: string, error: unknown): void {
  console.error(`[ProcessModeler] ${context}: ${getErrorMessage(error)}`)
}

function resolveParentMessageOrigin(): string | null {
  if (window.parent === window) return null

  try {
    return window.parent.location.origin === window.location.origin
      ? window.location.origin
      : null
  } catch (_error) {
    return null
  }
}

function postSaveResultSafely(result: ProcessSaveResult): void {
  const targetOrigin = resolveParentMessageOrigin()
  if (!targetOrigin) return

  window.parent.postMessage(result, targetOrigin)
}

// 打开流程文件
function openBpmn(file: File): boolean {
  const reader = new FileReader()
  reader.readAsText(file, 'utf-8')
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      void createNewDiagram(reader.result)
    }
  }
  return false
}

// 下载流程文件
function downloadFile(filename: string, data: string | undefined, type: string): void {
  if (data == null) return

  const a = document.createElement('a')
  const url = window.URL.createObjectURL(new Blob([data], { type }))
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

/** 关闭当前标签页并返回上个页面 */
function goBack(): void {
  const obj = { path: '/flowable/definition', query: { t: Date.now() } }
  vm?.$tab?.closeOpenPage(obj)
}
</script>
<style scoped lang="scss">
.normalPanel {
  position: absolute;
  width: 460px;
  right: 20px;
  max-height: 100%;
}

.process-context-menu {
  position: fixed;
  z-index: 4000;
  min-width: 240px;
  max-width: 280px;
  padding: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
  backdrop-filter: blur(8px);
}

.process-context-menu__title {
  margin-bottom: 6px;
  padding: 2px 8px 8px;
  font-size: 12px;
  line-height: 16px;
  color: var(--el-text-color-secondary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.process-context-menu__item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 10px;
  margin-top: 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 20px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--el-fill-color-light);
    color: var(--el-color-primary);
  }
}

.process-context-menu__icon {
  margin-right: 8px;
  font-size: 14px;
  line-height: 1;
}
</style>
<style lang="scss">
/*左边工具栏以及编辑节点的样式*/
@import "bpmn-js/dist/assets/diagram-js.css";
@import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
@import "bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css";
@import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";

@import "bpmn-js-bpmnlint/dist/assets/css/bpmn-js-bpmnlint.css";

.view-mode {

  .el-header,
  .el-aside,
  .djs-palette,
  .bjs-powered-by {
    display: none;
  }

  .el-loading-mask {
    background-color: initial;
  }

  .el-loading-spinner {
    display: none;
  }
}

.flow-containers {
  width: 100%;
  height: 100%;

  .canvas {
    min-height: 850px;
    width: 100%;
    height: 100%;
    background: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMTBoNDBNMTAgMHY0ME0wIDIwaDQwTTIwIDB2NDBNMCAzMGg0ME0zMCAwdjQwIiBmaWxsPSJub25lIiBzdHJva2U9IiNlMGUwZTAiIG9wYWNpdHk9Ii4yIi8+PHBhdGggZD0iTTQwIDBIMHY0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTBlMGUwIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+")
  }

  .panel {
    position: absolute;
    right: 0;
    top: 50px;
    width: 300px;
  }

  .load {
    margin-right: 10px;
  }

  .el-main {
    position: relative;
    padding: 0;
  }

  .el-main .button-group {
    display: flex;
    flex-direction: column;
    position: absolute;
    width: auto;
    height: auto;
    top: 10px;
    right: 10px;
  }

  .button-group .el-button {
    width: 100%;
    margin: 0 0 5px;
  }
}
</style>
