export interface KeyValueMap {
  [key: string]: unknown
}

export interface BpmnDocumentationLike {
  text?: string
}

export interface ExtensionElementLike extends KeyValueMap {
  $type?: string
  id?: string
  name?: string
  body?: string
  value?: string
  values?: ExtensionElementLike[]
}

export interface ExtensionElementsContainerLike {
  values?: ExtensionElementLike[] | null
}

export interface BpmnConnectionLike extends KeyValueMap {
  id?: string
  $type?: string
  targetRef?: BpmnElementLike | null
}

export interface BpmnBusinessObjectLike extends KeyValueMap {
  $type?: string
  id?: string
  name?: string
  processCategory?: string
  extensionElements?: ExtensionElementsContainerLike | null
  documentation?: BpmnDocumentationLike[] | null
  default?: BpmnElementLike | null
  sourceRef?: BpmnBusinessObjectLike | null
  flowElements?: BpmnFlowNodeLike[]
  eventDefinitions?: KeyValueMap[] | null
  loopCharacteristics?: KeyValueMap | null
  outgoing?: BpmnConnectionLike[] | null
}

export interface BpmnElementLike extends KeyValueMap {
  id?: string
  type?: string
  $type?: string
  name?: string
  height?: number
  width?: number
  source?: BpmnElementLike | null
  outgoing?: BpmnConnectionLike[] | null
  businessObject: BpmnBusinessObjectLike
}

export interface BpmnFlowNodeLike extends BpmnBusinessObjectLike {
  outgoing?: BpmnConnectionLike[] | null
}

export interface BpmnDefinitionsLike {
  rootElements?: BpmnBusinessObjectLike[]
}

export interface ViewboxLike {
  x: number
  y: number
  width: number
  height: number
}

export interface CanvasLike {
  zoom(level?: 'fit-viewport' | 'fit-content' | number, center?: 'auto' | { x: number; y: number }): number
  viewbox(box?: ViewboxLike): ViewboxLike
  addMarker(id: string, marker: string): void
}

export interface ModelingLike {
  updateProperties(element: BpmnElementLike | null | undefined, properties: KeyValueMap): void
  updateModdleProperties(element: BpmnElementLike | null | undefined, moddleElement: unknown, properties: KeyValueMap): void
}

export interface ModdleLike {
  create<T extends KeyValueMap = KeyValueMap>(type: string, attributes?: KeyValueMap): T
}

export interface ElementRegistryLike {
  find(matcher: (element: BpmnElementLike) => boolean): BpmnElementLike | undefined
  get(element: string | Element): BpmnElementLike | undefined
}

export interface ModelerLike {
  importXML(xml: string): Promise<unknown>
  saveXML(options?: KeyValueMap): Promise<{ xml: string }>
  saveSVG(options?: KeyValueMap): Promise<{ svg: string }>
  get<T = unknown>(name: string): T
  on(event: 'import.done', callback: (payload: ImportDoneEvent) => void): void
  on(event: 'selection.changed', callback: (payload: SelectionChangedEvent) => void): void
  on(event: 'element.changed', callback: (payload: ElementChangedEvent) => void): void
  on(event: string, callback: (payload: KeyValueMap) => void): void
  off?(event: 'import.done', callback: (payload: ImportDoneEvent) => void): void
  off?(event: 'selection.changed', callback: (payload: SelectionChangedEvent) => void): void
  off?(event: 'element.changed', callback: (payload: ElementChangedEvent) => void): void
  off?(event: string, callback: (payload: KeyValueMap) => void): void
  getDefinitions(): BpmnDefinitionsLike
}

export interface ViewerLike {
  importXML(xml: string): Promise<unknown>
  destroy(): void
  get<T = unknown>(name: string): T
  getDefinitions(): BpmnDefinitionsLike
}

export interface SelectionChangedEvent {
  newSelection?: BpmnElementLike[]
}

export interface ElementChangedEvent {
  element?: BpmnElementLike | null
}

export interface ImportDoneEvent extends KeyValueMap {}

export interface ProcessModelerStore {
  userList: KeyValueMap[]
  roleList: KeyValueMap[]
  expList: KeyValueMap[]
  modeler: ModelerLike | null
  modeling: ModelingLike | null
  moddle: ModdleLike | null
  canvas: CanvasLike | null
  bpmnFactory: KeyValueMap | null
  elRegistry: ElementRegistryLike | null
  element: BpmnElementLike | null
}

export type ListenerType = 'classListener' | 'expressionListener' | 'delegateExpressionListener' | 'scriptListener'
export type ListenerScriptType = 'inlineScript' | 'externalScript'
export type ListenerFieldType = 'string' | 'expression'

export interface ListenerFieldFormLike extends KeyValueMap {
  name?: string
  fieldType?: ListenerFieldType
  string?: string
  expression?: string
}

export interface ListenerScriptLike extends KeyValueMap {
  scriptFormat?: string
  value?: string
  resource?: string
}

export interface ListenerFormLike extends KeyValueMap {
  id?: string
  event?: string
  eventType?: string
  listenerType?: ListenerType
  valueType?: ListenerType
  class?: string
  expression?: string
  delegateExpression?: string
  value?: string
  scriptType?: ListenerScriptType
  scriptFormat?: string
  resource?: string
  fields?: ListenerFieldFormLike[]
  eventDefinitionType?: string
  eventTimeDefinitions?: string
  script?: ListenerScriptLike
}

export interface ProcessInfo {
  id?: string
  name?: string
  category?: string
}

export interface ProcessSaveResult {
  process: ProcessInfo
  xml?: string
  svg?: string
}

export interface FlowViewerNodeData {
  key: string
  completed?: boolean
}

export interface FlowViewerData {
  xmlData: string
  nodeData?: FlowViewerNodeData[]
}

export interface TabPagePayload {
  path: string
  query: {
    t: number
  }
}

export interface TabControllerLike {
  closeOpenPage(payload: TabPagePayload): void
}

export interface TranslateReplacements {
  [key: string]: string | number | undefined
}
