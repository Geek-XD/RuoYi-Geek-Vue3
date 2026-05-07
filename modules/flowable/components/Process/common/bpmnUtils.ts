import { NodeName } from '../lang/zh'
import type {
  BpmnElementLike,
  ExtensionElementLike,
  KeyValueMap,
  ListenerFieldFormLike,
  ListenerFormLike,
  ListenerScriptLike,
  ListenerType,
  ModdleLike,
  ModelingLike
} from './types'

function resolveListenerType(options: ListenerFormLike): ListenerType | undefined {
  return options.listenerType ?? options.valueType
}

function buildScriptConfig(options: ListenerFormLike): ListenerScriptLike {
  return options.scriptType === 'externalScript'
    ? { scriptFormat: options.scriptFormat, resource: options.resource }
    : { scriptFormat: options.scriptFormat, value: options.value }
}

function applyListenerValue(listenerObject: KeyValueMap, options: ListenerFormLike): void {
  switch (resolveListenerType(options)) {
    case 'scriptListener':
      listenerObject.type = 'script'
      listenerObject.script = buildScriptConfig(options)
      break
    case 'expressionListener':
      listenerObject.expression = options.expression
      break
    case 'delegateExpressionListener':
      listenerObject.delegateExpression = options.delegateExpression ?? options.value
      break
    default:
      listenerObject.class = options.class ?? options.value
  }
}

function buildTimerEventDefinition(moddle: ModdleLike, options: ListenerFormLike): KeyValueMap | null {
  if (options.eventDefinitionType == null || options.eventDefinitionType === 'null' || options.eventTimeDefinitions == null) {
    return null
  }

  const timeDefinition = moddle.create('bpmn:FormalExpression', {
    body: options.eventTimeDefinitions
  })

  const timeFieldName = `time${options.eventDefinitionType.replace(/^\S/, value => value.toUpperCase())}`

  return moddle.create('bpmn:TimerEventDefinition', {
    id: `TimerEventDefinition_${uuid(8)}`,
    [timeFieldName]: timeDefinition
  })
}

function mapListenerFields(moddle: ModdleLike, fields: ListenerFieldFormLike[] | undefined, prefix: string): KeyValueMap[] | undefined {
  if (!fields?.length) return undefined
  return fields.map(field => createFieldObject(moddle, field, prefix))
}

export function createListenerObject(moddle: ModdleLike, options: ListenerFormLike, isTask: boolean, prefix: string): KeyValueMap {
  const listenerObject: KeyValueMap = Object.create(null)
  listenerObject.event = options.event

  if (isTask && options.id) {
    listenerObject.id = options.id
  }

  applyListenerValue(listenerObject, options)

  const fields = mapListenerFields(moddle, options.fields, prefix)
  if (fields) {
    listenerObject.fields = fields
  }

  if (isTask && options.event === 'timeout') {
    const timerEventDefinition = buildTimerEventDefinition(moddle, options)
    if (timerEventDefinition) {
      listenerObject.eventDefinitions = [timerEventDefinition]
    }
  }

  return moddle.create(`${prefix}:${isTask ? 'TaskListener' : 'ExecutionListener'}`, listenerObject)
}

export function createSystemListenerObject(moddle: ModdleLike, options: ListenerFormLike, isTask: boolean, prefix: string): KeyValueMap {
  const listenerObject: KeyValueMap = Object.create(null)
  listenerObject.event = options.eventType ?? options.event
  listenerObject.listenerType = resolveListenerType(options)
  applyListenerValue(listenerObject, options)
  return moddle.create(`${prefix}:${isTask ? 'TaskListener' : 'ExecutionListener'}`, listenerObject)
}

export function changeListenerObject(options: ListenerFormLike): ListenerFormLike {
  const listenerObject: ListenerFormLike = Object.create(null)
  listenerObject.event = options.eventType ?? options.event
  listenerObject.listenerType = resolveListenerType(options)

  if (options.fields?.length) {
    listenerObject.fields = [...options.fields]
  }

  if (listenerObject.listenerType === 'scriptListener') {
    const script = buildScriptConfig(options)
    listenerObject.script = script
    listenerObject.scriptType = script.resource ? 'externalScript' : 'inlineScript'
    listenerObject.scriptFormat = script.scriptFormat
    listenerObject.resource = script.resource
    listenerObject.value = script.value
    return listenerObject
  }

  listenerObject.class = options.class ?? options.value
  listenerObject.expression = options.expression
  listenerObject.delegateExpression = options.delegateExpression ?? options.value
  return listenerObject
}

export function createFieldObject(moddle: ModdleLike, option: ListenerFieldFormLike, prefix: string): KeyValueMap {
  const fieldConfig = option.fieldType === 'string'
    ? { name: option.name, string: option.string }
    : { name: option.name, expression: option.expression }
  return moddle.create(`${prefix}:Field`, fieldConfig)
}

export function createScriptObject(moddle: ModdleLike, options: ListenerFormLike, prefix: string): KeyValueMap {
  return moddle.create(`${prefix}:Script`, buildScriptConfig(options))
}

export function updateElementExtensions(
  moddle: ModdleLike | null,
  modeling: ModelingLike | null,
  element: BpmnElementLike | null,
  extensionList: ExtensionElementLike[]
): void {
  if (!moddle || !modeling || !element) return

  const extensions = moddle.create('bpmn:ExtensionElements', {
    values: extensionList
  })

  modeling.updateProperties(element, {
    extensionElements: extensions
  })
}

export function uuid(length = 8, chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'): string {
  let result = ''
  for (let index = length; index > 0; index -= 1) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export function translateNodeName(node: string): string {
  const nodeNameMap = NodeName as Record<string, string>
  return nodeNameMap[node] ?? node
}
