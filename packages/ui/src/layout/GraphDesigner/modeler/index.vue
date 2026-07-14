<script setup lang="ts">
import 'diagram-js/assets/diagram-js.css'

import Diagram from 'diagram-js/lib/Diagram'
import ConnectModule from 'diagram-js/lib/features/connect'
import ContextPadModule from 'diagram-js/lib/features/context-pad'
import KeyboardModule from 'diagram-js/lib/features/keyboard'
import ModelingModule from 'diagram-js/lib/features/modeling'
import MoveModule from 'diagram-js/lib/features/move'
import SelectionModule from 'diagram-js/lib/features/selection'
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas'
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type {
  GraphConnectionModel,
  GraphModelSnapshot,
  GraphModelerInstance,
  GraphNodeModel,
  GraphPrimitive,
  GraphSelection
} from '../common/types'
import GraphDesignerModule from '../modules'

defineOptions({
  name: 'GraphModeler'
})

type GraphConnectionDefaultsResolver =
  | Partial<GraphConnectionModel>
  | ((context: { source: GraphNodeModel; target: GraphNodeModel }) => Partial<GraphConnectionModel> | void)

const props = withDefaults(defineProps<{
  nodes?: GraphNodeModel[]
  connections?: GraphConnectionModel[]
  minHeight?: number
  autoFit?: boolean
  resolveConnectionDefaults?: GraphConnectionDefaultsResolver
}>(), {
  nodes: () => [],
  connections: () => [],
  minHeight: 520,
  autoFit: true,
  resolveConnectionDefaults: undefined
})

const emit = defineEmits<{
  (e: 'graph-change', snapshot: GraphModelSnapshot): void
  (e: 'selection-change', selection: GraphSelection): void
  (e: 'ready'): void
}>()

const containerRef = ref<HTMLElement>()

let diagram: any = null
let lastSignature = ''
let suppressChange = false
let resizeObserver: ResizeObserver | null = null

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null)) as T
}

function normalizePrimitive(value?: GraphPrimitive) {
  return value === undefined || value === null ? '' : String(value)
}

function buildConnectionIdentity(connection: Partial<GraphConnectionModel>) {
  if (connection.id !== undefined && connection.id !== null && connection.id !== '') {
    return `id:${normalizePrimitive(connection.id)}`
  }
  return [
    normalizePrimitive(connection.sourceId),
    normalizePrimitive(connection.targetId),
    connection.type || '',
    connection.label || ''
  ].join('::')
}

function buildSignature(nodes: GraphNodeModel[], connections: GraphConnectionModel[]) {
  const normalizedNodes = [...nodes]
    .map((node) => ({
      id: normalizePrimitive(node.id),
      type: node.type,
      label: node.label,
      subtitle: node.subtitle || '',
      x: Math.round(Number(node.x || 0)),
      y: Math.round(Number(node.y || 0)),
      width: Number(node.width || 0),
      height: Number(node.height || 0),
      color: node.color || '',
      data: node.data || {}
    }))
    .sort((left, right) => left.id.localeCompare(right.id))

  const normalizedConnections = [...connections]
    .map((connection) => ({
      identity: buildConnectionIdentity(connection),
      sourceId: normalizePrimitive(connection.sourceId),
      targetId: normalizePrimitive(connection.targetId),
      type: connection.type || '',
      label: connection.label || '',
      color: connection.color || '',
      data: connection.data || {}
    }))
    .sort((left, right) => left.identity.localeCompare(right.identity))

  return JSON.stringify({
    nodes: normalizedNodes,
    connections: normalizedConnections
  })
}

function getService<T = any>(serviceName: string) {
  return diagram?.get(serviceName, false) as T
}

function refreshCanvasSize() {
  const canvas = getService<any>('canvas')
  canvas?.resized?.()
}

function nodeElementId(nodeId: GraphPrimitive) {
  return `graph-node-${normalizePrimitive(nodeId)}`
}

function connectionElementId(connection: Partial<GraphConnectionModel>) {
  return `graph-connection-${buildConnectionIdentity(connection)}`
}

function isGraphNode(element: any) {
  return element?.graphKind === 'node'
}

function isGraphConnection(element: any) {
  return element?.graphKind === 'connection'
}

function findConnectionElement(connection: Partial<GraphConnectionModel>) {
  const elementRegistry = getService<any>('elementRegistry')
  const identity = buildConnectionIdentity(connection)
  return elementRegistry?.find?.((element: any) => {
    if (!isGraphConnection(element)) {
      return false
    }
    return buildConnectionIdentity(toGraphConnection(element)) === identity
  })
}

function buildFallbackWaypoints(source: any, target: any) {
  return [
    {
      x: source.x + source.width / 2,
      y: source.y + source.height / 2
    },
    {
      x: target.x + target.width / 2,
      y: target.y + target.height / 2
    }
  ]
}

function layoutConnectionWaypoints(source: any, target: any, connection: Record<string, any> = {}) {
  const layouter = getService<any>('layouter')
  const computedWaypoints = layouter?.layoutConnection?.(
    {
      ...connection,
      source,
      target
    },
    {
      source,
      target
    }
  )

  return Array.isArray(computedWaypoints) && computedWaypoints.length >= 2
    ? computedWaypoints
    : buildFallbackWaypoints(source, target)
}

function resolveConnectionDefaults(source: any, target: any): Partial<GraphConnectionModel> {
  if (!props.resolveConnectionDefaults) {
    return {}
  }

  if (typeof props.resolveConnectionDefaults === 'function') {
    return props.resolveConnectionDefaults({
      source: toGraphNode(source),
      target: toGraphNode(target)
    }) || {}
  }

  return props.resolveConnectionDefaults
}

function decorateConnection(connection: any, useModeling = true) {
  if (!connection?.source || !connection?.target) {
    return
  }

  const modeling = getService<any>('modeling')
  const eventBus = getService<any>('eventBus')
  const source = connection.source
  const target = connection.target
  const defaults = resolveConnectionDefaults(source, target)
  const fallbackType = source?.graphData?.defaultOutput || 'Success'

  connection.graphKind = 'connection'
  connection.graphId = connection.graphId
  connection.graphSourceId = source?.graphId
  connection.graphTargetId = target?.graphId
  connection.graphType = connection.graphType || defaults.type || fallbackType
  connection.graphLabel = connection.graphLabel || connection.graphType
  connection.graphColor = connection.graphColor || defaults.color || '#909399'
  connection.graphData = {
    ...(defaults.data || {}),
    ...(connection.graphData || {}),
    fromType: connection.graphType || fallbackType,
    typeName: connection.graphLabel || connection.graphType || fallbackType
  }

  const waypoints = layoutConnectionWaypoints(source, target, {
    ...connection,
    waypoints: Array.isArray(connection.waypoints) ? connection.waypoints : []
  })

  if (useModeling && modeling?.updateWaypoints && waypoints.length >= 2) {
    modeling.updateWaypoints(connection, waypoints)
  } else {
    connection.waypoints = waypoints
    eventBus?.fire?.('element.changed', { element: connection })
  }
}

function toGraphNode(element: any): GraphNodeModel {
  return {
    id: element.graphId ?? element.id,
    type: element.graphType || '',
    label: element.graphLabel || '',
    subtitle: element.graphSubtitle || '',
    x: Math.round(Number(element.x || 0)),
    y: Math.round(Number(element.y || 0)),
    width: Number(element.width || 200),
    height: Number(element.height || 92),
    color: element.graphColor,
    data: cloneValue(element.graphData || {})
  }
}

function toGraphConnection(element: any): GraphConnectionModel {
  return {
    id: element.graphId,
    sourceId: element.source?.graphId ?? element.graphSourceId,
    targetId: element.target?.graphId ?? element.graphTargetId,
    label: element.graphLabel,
    type: element.graphType,
    color: element.graphColor,
    data: cloneValue(element.graphData || {})
  }
}

function exportSnapshot(): GraphModelSnapshot {
  const elementRegistry = getService<any>('elementRegistry')
  const elements = elementRegistry?.getAll?.() || []

  return {
    nodes: elements
      .filter((element: any) => isGraphNode(element))
      .map((element: any) => toGraphNode(element))
      .sort((left: GraphNodeModel, right: GraphNodeModel) => normalizePrimitive(left.id).localeCompare(normalizePrimitive(right.id))),
    connections: elements
      .filter((element: any) => isGraphConnection(element))
      .map((element: any) => toGraphConnection(element))
      .sort((left: GraphConnectionModel, right: GraphConnectionModel) => buildConnectionIdentity(left).localeCompare(buildConnectionIdentity(right)))
  }
}

function emitGraphChange() {
  const snapshot = exportSnapshot()
  lastSignature = buildSignature(snapshot.nodes, snapshot.connections)
  emit('graph-change', snapshot)
}

function emitSelection(element?: any) {
  if (isGraphNode(element)) {
    emit('selection-change', {
      type: 'node',
      node: toGraphNode(element)
    })
    return
  }

  if (isGraphConnection(element)) {
    emit('selection-change', {
      type: 'connection',
      connection: toGraphConnection(element)
    })
    return
  }

  emit('selection-change', { type: null })
}

function importGraph(nodes: GraphNodeModel[], connections: GraphConnectionModel[]) {
  const canvas = getService<any>('canvas')
  const elementFactory = getService<any>('elementFactory')
  if (!canvas || !elementFactory) {
    return
  }

  suppressChange = true
  diagram.clear()

  const root = elementFactory.createRoot({
    id: 'graph-root',
    graphKind: 'root'
  })
  canvas.setRootElement(root)

  const shapeMap = new Map<string, any>()

  nodes.forEach((node) => {
    const shape = elementFactory.createShape({
      id: nodeElementId(node.id),
      x: Number(node.x || 0),
      y: Number(node.y || 0),
      width: Number(node.width || 200),
      height: Number(node.height || 92),
      graphKind: 'node',
      graphId: node.id,
      graphType: node.type,
      graphLabel: node.label,
      graphSubtitle: node.subtitle,
      graphColor: node.color,
      graphData: cloneValue(node.data || {})
    })

    canvas.addShape(shape, root)
    shapeMap.set(normalizePrimitive(node.id), shape)
  })

  connections.forEach((connection) => {
    const source = shapeMap.get(normalizePrimitive(connection.sourceId))
    const target = shapeMap.get(normalizePrimitive(connection.targetId))
    if (!source || !target) {
      return
    }

    const diagramConnection = elementFactory.createConnection({
      id: connectionElementId(connection),
      source,
      target,
      waypoints: layoutConnectionWaypoints(source, target, {
        source,
        target,
        waypoints: []
      }),
      graphKind: 'connection',
      graphId: connection.id,
      graphSourceId: connection.sourceId,
      graphTargetId: connection.targetId,
      graphType: connection.type,
      graphLabel: connection.label,
      graphColor: connection.color,
      graphData: cloneValue(connection.data || {})
    })

    canvas.addConnection(diagramConnection, root)
    decorateConnection(diagramConnection, false)
  })

  lastSignature = buildSignature(nodes, connections)

  nextTick(() => {
    if (props.autoFit && (nodes.length > 0 || connections.length > 0)) {
      fitViewport()
    }
    suppressChange = false
  })
}

function resolveAppendPosition(node: GraphNodeModel) {
  const canvas = getService<any>('canvas')
  const viewbox = canvas?.viewbox?.()
  const width = Number(node.width || 200)
  const height = Number(node.height || 92)

  if (!viewbox) {
    return {
      x: Number(node.x || 120),
      y: Number(node.y || 120)
    }
  }

  if (Number.isFinite(node.x) && Number.isFinite(node.y)) {
    return {
      x: Number(node.x),
      y: Number(node.y)
    }
  }

  return {
    x: Math.round(viewbox.x + viewbox.width / 2 - width / 2),
    y: Math.round(viewbox.y + viewbox.height / 2 - height / 2)
  }
}

function appendNode(node: GraphNodeModel) {
  const modeling = getService<any>('modeling')
  const canvas = getService<any>('canvas')
  if (!modeling || !canvas) {
    return
  }

  const root = canvas.getRootElement()
  const position = resolveAppendPosition(node)

  modeling.createShape(
    {
      id: nodeElementId(node.id),
      width: Number(node.width || 200),
      height: Number(node.height || 92),
      graphKind: 'node',
      graphId: node.id,
      graphType: node.type,
      graphLabel: node.label,
      graphSubtitle: node.subtitle,
      graphColor: node.color,
      graphData: cloneValue(node.data || {})
    },
    {
      x: position.x + Number(node.width || 200) / 2,
      y: position.y + Number(node.height || 92) / 2
    },
    root
  )
}

function updateNode(node: GraphNodeModel) {
  const elementRegistry = getService<any>('elementRegistry')
  const modeling = getService<any>('modeling')
  const eventBus = getService<any>('eventBus')
  const element = elementRegistry?.get?.(nodeElementId(node.id))
  if (!element) {
    return
  }

  const deltaX = Math.round(Number(node.x || 0) - Number(element.x || 0))
  const deltaY = Math.round(Number(node.y || 0) - Number(element.y || 0))

  if (deltaX !== 0 || deltaY !== 0) {
    modeling.moveShape(element, { x: deltaX, y: deltaY })
  }

  element.graphType = node.type
  element.graphLabel = node.label
  element.graphSubtitle = node.subtitle
  element.graphColor = node.color
  element.graphData = cloneValue(node.data || {})

  eventBus?.fire?.('element.changed', { element })
  emitGraphChange()
}

function removeNode(nodeId?: GraphPrimitive) {
  if (nodeId === undefined || nodeId === null) {
    return
  }

  const elementRegistry = getService<any>('elementRegistry')
  const modeling = getService<any>('modeling')
  const element = elementRegistry?.get?.(nodeElementId(nodeId))
  if (!element) {
    return
  }

  modeling.removeElements([element])
}

function createConnection(connection: GraphConnectionModel) {
  const elementRegistry = getService<any>('elementRegistry')
  const modeling = getService<any>('modeling')
  const canvas = getService<any>('canvas')
  const source = elementRegistry?.get?.(nodeElementId(connection.sourceId))
  const target = elementRegistry?.get?.(nodeElementId(connection.targetId))
  if (!source || !target || !modeling || !canvas) {
    return
  }

  modeling.createConnection(
    source,
    target,
    {
      id: connectionElementId(connection),
      graphKind: 'connection',
      graphId: connection.id,
      graphSourceId: connection.sourceId,
      graphTargetId: connection.targetId,
      graphType: connection.type,
      graphLabel: connection.label,
      graphColor: connection.color,
      graphData: cloneValue(connection.data || {})
    },
    canvas.getRootElement()
  )
}

function updateConnection(connection: GraphConnectionModel) {
  const eventBus = getService<any>('eventBus')
  const element = findConnectionElement(connection)
  if (!element) {
    return
  }

  element.graphType = connection.type
  element.graphLabel = connection.label
  element.graphColor = connection.color
  element.graphData = cloneValue(connection.data || {})

  eventBus?.fire?.('element.changed', { element })
  emitGraphChange()
}

function removeConnection(connection: Partial<GraphConnectionModel>) {
  const modeling = getService<any>('modeling')
  const element = findConnectionElement(connection)
  if (!element) {
    return
  }

  modeling.removeConnection(element)
}

function selectNode(nodeId?: GraphPrimitive) {
  const selection = getService<any>('selection')
  if (nodeId === undefined || nodeId === null) {
    selection?.select?.([])
    return
  }

  const elementRegistry = getService<any>('elementRegistry')
  const element = elementRegistry?.get?.(nodeElementId(nodeId))
  if (!element) {
    return
  }

  selection?.select?.(element)
}

function fitViewport() {
  const canvas = getService<any>('canvas')
  canvas?.zoom?.('fit-viewport')
}

function zoomBy(delta: number) {
  const canvas = getService<any>('canvas')
  const currentZoom = Number(canvas?.zoom?.() || 1)
  const nextZoom = Math.min(2.5, Math.max(0.3, currentZoom + delta))
  canvas?.zoom?.(nextZoom)
}

function zoomIn() {
  zoomBy(0.1)
}

function zoomOut() {
  zoomBy(-0.1)
}

function undo() {
  const commandStack = getService<any>('commandStack')
  commandStack?.undo?.()
}

function redo() {
  const commandStack = getService<any>('commandStack')
  commandStack?.redo?.()
}

function initializeDiagram() {
  if (!containerRef.value) {
    return
  }

  diagram = new Diagram({
    canvas: {
      container: containerRef.value,
      deferUpdate: false
    },
    modules: [
      ModelingModule,
      MoveModule,
      SelectionModule,
      ConnectModule,
      ContextPadModule,
      KeyboardModule,
      MoveCanvasModule,
      ZoomScrollModule,
      GraphDesignerModule
    ]
  })

  const eventBus = getService<any>('eventBus')
  eventBus?.on?.('commandStack.changed', () => {
    if (!suppressChange) {
      emitGraphChange()
    }
  })
  eventBus?.on?.('selection.changed', (event: any) => {
    if (!suppressChange) {
      emitSelection(event?.newSelection?.[0])
    }
  })
  eventBus?.on?.('commandStack.connection.create.executed', (event: any) => {
    const connection = event?.context?.connection
    if (!connection) {
      return
    }

    queueMicrotask(() => {
      decorateConnection(connection, false)
    })
  })

  importGraph(props.nodes, props.connections)
  emit('ready')
}

watch(
  () => [props.nodes, props.connections],
  () => {
    if (!diagram) {
      return
    }

    const signature = buildSignature(props.nodes, props.connections)
    if (signature !== lastSignature) {
      importGraph(props.nodes, props.connections)
    }
  }
)

onMounted(() => {
  initializeDiagram()

  if (containerRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      refreshCanvasSize()
    })
    resizeObserver.observe(containerRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  diagram?.destroy?.()
  diagram = null
})

defineExpose<GraphModelerInstance>({
  appendNode,
  updateNode,
  removeNode,
  createConnection,
  updateConnection,
  removeConnection,
  selectNode,
  fitViewport,
  zoomIn,
  zoomOut,
  undo,
  redo
})
</script>

<template>
  <div class="graph-modeler" :style="{ minHeight: `${minHeight}px` }">
    <div ref="containerRef" class="graph-modeler__canvas" />
  </div>
</template>

<style lang="scss" scoped>
.graph-modeler {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background:
    linear-gradient(90deg, rgba(64, 158, 255, 0.05) 1px, transparent 1px),
    linear-gradient(rgba(64, 158, 255, 0.05) 1px, transparent 1px),
    var(--el-fill-color-extra-light);
  background-size: 24px 24px;
}

.graph-modeler__canvas {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: inherit;
}

.graph-modeler :deep(.djs-container),
.graph-modeler :deep(.djs-container > svg),
.graph-modeler :deep(.djs-container > .djs-overlay-container) {
  width: 100%;
  height: 100%;
}

.graph-modeler :deep(.djs-container > svg) {
  display: block;
}

.graph-modeler :deep(.djs-context-pad .entry.graph-icon-connect::before) {
  content: '+';
  font-size: 18px;
  font-weight: 700;
}

.graph-modeler :deep(.djs-context-pad .entry.graph-icon-delete::before) {
  content: 'x';
  font-size: 14px;
  font-weight: 700;
}

.graph-modeler :deep(.djs-shape.selected .djs-visual > rect:nth-of-type(2)) {
  stroke: var(--el-color-primary) !important;
  stroke-width: 2 !important;
}

.graph-modeler :deep(.djs-connection.selected .djs-visual > :first-child) {
  stroke: var(--el-color-primary) !important;
}
</style>
