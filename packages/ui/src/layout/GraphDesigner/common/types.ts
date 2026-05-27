export type GraphPrimitive = string | number

export interface GraphNodeModel {
  id: GraphPrimitive
  type: string
  label: string
  subtitle?: string
  x: number
  y: number
  width?: number
  height?: number
  color?: string
  data?: Record<string, any>
}

export interface GraphConnectionModel {
  id?: GraphPrimitive
  sourceId: GraphPrimitive
  targetId: GraphPrimitive
  label?: string
  type?: string
  color?: string
  data?: Record<string, any>
}

export interface GraphSelectedElement {
  type: 'node' | 'connection'
  node?: GraphNodeModel
  connection?: GraphConnectionModel
}

export interface GraphSelection {
  type: 'node' | 'connection' | 'multiple' | null
  node?: GraphNodeModel
  connection?: GraphConnectionModel
  elements?: GraphSelectedElement[]
}

export interface GraphCommandState {
  canUndo: boolean
  canRedo: boolean
}

export interface GraphViewportState {
  zoom: number
  viewbox?: {
    x: number
    y: number
    width: number
    height: number
    scale?: number
  }
}

export interface GraphContextActionContext {
  api: GraphModelerInstance
  selection: GraphSelection
  node?: GraphNodeModel
  connection?: GraphConnectionModel
}

export interface GraphContextPadContext extends GraphContextActionContext {
  node: GraphNodeModel
}

export interface GraphContextPadAction {
  key: string
  group: string
  className?: string
  title?: string
  separator?: boolean
  action?: {
    click?: (context: GraphContextPadContext) => void
    dragstart?: (context: GraphContextPadContext) => void
  }
}

export interface GraphContextMenuContext extends GraphContextActionContext {
  kind: 'canvas' | 'node' | 'connection' | 'multiple'
}

export interface GraphContextMenuAction {
  key: string
  label: string
  iconClass?: string
  action: (context: GraphContextMenuContext) => void
}

export interface GraphConnectionDefaultsContext {
  source: GraphNodeModel
  target: GraphNodeModel
  api: GraphModelerInstance
}

export type GraphConnectionDefaultsResolver =
  | Partial<GraphConnectionModel>
  | ((context: GraphConnectionDefaultsContext) => Partial<GraphConnectionModel> | void)

export interface GraphModelerReadyPayload {
  api: GraphModelerInstance
  commandState: GraphCommandState
  viewport: GraphViewportState
}

export interface GraphModelSnapshot {
  nodes: GraphNodeModel[]
  connections: GraphConnectionModel[]
}

export interface GraphModelerInstance {
  appendNode: (node: GraphNodeModel) => void
  updateNode: (node: GraphNodeModel) => void
  removeNode: (nodeId?: GraphPrimitive) => void
  createConnection: (connection: GraphConnectionModel) => void
  updateConnection: (connection: GraphConnectionModel) => void
  removeConnection: (connection: Partial<GraphConnectionModel>) => void
  selectNode: (nodeId?: GraphPrimitive) => void
  selectConnection: (connection: Partial<GraphConnectionModel>) => void
  clearSelection: () => void
  getSnapshot: () => GraphModelSnapshot
  getSelection: () => GraphSelection
  getCommandState: () => GraphCommandState
  fitViewport: () => void
  zoomIn: () => void
  zoomOut: () => void
  undo: () => void
  redo: () => void
}
