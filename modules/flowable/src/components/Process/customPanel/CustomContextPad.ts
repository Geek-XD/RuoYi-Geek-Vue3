/**
 * 自定义任务弹窗节点
 */
import { assign, forEach, isArray, every } from 'min-dash'
import { is } from 'bpmn-js/lib/util/ModelUtil'
import { isExpanded, isEventSubProcess } from 'bpmn-js/lib/util/DiUtil'
import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil'
import { getChildLanes } from 'bpmn-js/lib/features/modeling/util/LaneUtil'
import { hasPrimaryModifier } from 'diagram-js/lib/util/Mouse'
import type { TranslateReplacements } from '../common/types'

type ActionHandler = (event: unknown, element: ContextPadElementLike) => void
type DeleteAllowed = boolean | ContextPadElementLike[]

interface EventDefinitionLike {
  $type?: string
}

interface ContextPadBusinessObjectLike {
  isForCompensation?: boolean
  eventDefinitions?: EventDefinitionLike[]
  $instanceOf?(type: string): boolean
}

interface ContextPadElementLike {
  id?: string
  type?: string
  height?: number
  businessObject: ContextPadBusinessObjectLike
}

interface ContextPadEntryDescriptor {
  group: string
  className?: string
  title?: string
  separator?: boolean
  action?: {
    click?: ActionHandler
    dragstart?: ActionHandler
  }
}

type ContextPadEntries = Record<string, ContextPadEntryDescriptor>

interface ContextPadLike {
  registerProvider(provider: unknown): void
  isOpen(shape: ContextPadElementLike): boolean
  getEntries(shape: ContextPadElementLike): ContextPadEntries
  getPad(element: ContextPadElementLike): { html: HTMLElement }
  open(element: ContextPadElementLike, force?: boolean): void
}

interface ModelingLike {
  removeElements(elements: ContextPadElementLike[]): void
  splitLane(element: ContextPadElementLike, count: number): void
  addLane(element: ContextPadElementLike, position: 'top' | 'bottom'): void
}

interface ElementFactoryLike {
  createShape(config: Record<string, unknown>): ContextPadElementLike
}

interface ConnectLike {
  start(event: unknown, element: ContextPadElementLike): void
}

interface CreateLike {
  start(event: unknown, shape: ContextPadElementLike, context?: Record<string, unknown>): void
}

interface PopupMenuLike {
  isEmpty(element: ContextPadElementLike, menuName: string): boolean
  open(element: ContextPadElementLike, menuName: string, position: Record<string, unknown>, options: Record<string, unknown>): void
}

interface RulesLike {
  allowed(action: string, context: { elements: ContextPadElementLike[] }): DeleteAllowed
}

interface TranslateLike {
  (template: string, replacements?: TranslateReplacements): string
}

interface AutoPlaceLike {
  append(element: ContextPadElementLike, shape: ContextPadElementLike): void
}

interface InjectorLike {
  get(name: string, strict?: boolean): AutoPlaceLike | undefined
}

interface CreateEndEventLike {
  context: {
    shape: ContextPadElementLike
  }
  x?: number
  y?: number
}

interface EventBusLike {
  on(event: 'create.end', priority: number, callback: (event: CreateEndEventLike) => void): void
}

interface ContextPadProviderInstance {
  _contextPad: ContextPadLike
  _modeling: ModelingLike
  _elementFactory: ElementFactoryLike
  _connect: ConnectLike
  _create: CreateLike
  _popupMenu: PopupMenuLike
  _canvas: unknown
  _rules: RulesLike
  _translate: TranslateLike
  _autoPlace?: AutoPlaceLike
}

interface AppendActionOptions {
  eventDefinitionType?: string
  isForCompensation?: boolean
  [key: string]: unknown
}

/**
 * A provider for BPMN 2.0 elements context pad
 */
export default function ContextPadProvider(
  this: ContextPadProviderInstance,
  config: { autoPlace?: boolean } | undefined,
  injector: InjectorLike,
  eventBus: EventBusLike,
  contextPad: ContextPadLike,
  modeling: ModelingLike,
  elementFactory: ElementFactoryLike,
  connect: ConnectLike,
  create: CreateLike,
  popupMenu: PopupMenuLike,
  canvas: unknown,
  rules: RulesLike,
  translate: TranslateLike
): void {
  const resolvedConfig = config ?? {}

  contextPad.registerProvider(this)

  this._contextPad = contextPad
  this._modeling = modeling
  this._elementFactory = elementFactory
  this._connect = connect
  this._create = create
  this._popupMenu = popupMenu
  this._canvas = canvas
  this._rules = rules
  this._translate = translate

  if (resolvedConfig.autoPlace !== false) {
    this._autoPlace = injector.get('autoPlace', false)
  }

  eventBus.on('create.end', 250, event => {
    const shape = event.context.shape

    if (!hasPrimaryModifier(event) || !contextPad.isOpen(shape)) {
      return
    }

    const entries = contextPad.getEntries(shape)
    entries.replace?.action?.click?.(event, shape)
  })
}

ContextPadProvider.$inject = [
  'config.contextPad',
  'injector',
  'eventBus',
  'contextPad',
  'modeling',
  'elementFactory',
  'connect',
  'create',
  'popupMenu',
  'canvas',
  'rules',
  'translate'
]

ContextPadProvider.prototype.getMultiElementContextPadEntries = function(
  this: ContextPadProviderInstance,
  elements: ContextPadElementLike[]
): ContextPadEntries {
  const modeling = this._modeling
  const actions: ContextPadEntries = {}

  if (this._isDeleteAllowed(elements)) {
    assign(actions, {
      delete: {
        group: 'edit',
        className: 'bpmn-icon-trash',
        title: this._translate('Remove'),
        action: {
          click(_event: unknown, selectedElements: ContextPadElementLike): void {
            modeling.removeElements(Array.isArray(selectedElements) ? selectedElements.slice() : elements.slice())
          }
        }
      }
    })
  }

  return actions
}

ContextPadProvider.prototype._isDeleteAllowed = function(
  this: ContextPadProviderInstance,
  elements: ContextPadElementLike[]
): boolean {
  const baseAllowed = this._rules.allowed('elements.delete', {
    elements
  })

  if (isArray(baseAllowed)) {
    return every(elements, element => containsElement(baseAllowed, element))
  }

  return baseAllowed
}

ContextPadProvider.prototype.getContextPadEntries = function(
  this: ContextPadProviderInstance,
  element: ContextPadElementLike
): ContextPadEntries {
  const contextPad = this._contextPad
  const modeling = this._modeling
  const elementFactory = this._elementFactory
  const connect = this._connect
  const create = this._create
  const popupMenu = this._popupMenu
  const rules = this._rules
  const autoPlace = this._autoPlace
  const translate = this._translate

  const actions: ContextPadEntries = {}

  if (element.type === 'label') {
    return actions
  }

  const businessObject = element.businessObject

  function startConnect(event: unknown, currentElement: ContextPadElementLike): void {
    connect.start(event, currentElement)
  }

  function removeElement(_event: unknown, currentElement: ContextPadElementLike): void {
    modeling.removeElements([currentElement])
  }

  function getReplaceMenuPosition(currentElement: ContextPadElementLike): { x: number; y: number } {
    const Y_OFFSET = 5
    const pad = contextPad.getPad(currentElement).html
    const padRect = pad.getBoundingClientRect()

    return {
      x: padRect.left,
      y: padRect.bottom + Y_OFFSET
    }
  }

  function appendAction(
    type: string,
    className: string,
    title?: string | AppendActionOptions,
    options?: AppendActionOptions
  ): ContextPadEntryDescriptor {
    let resolvedTitle = title
    let resolvedOptions = options

    if (typeof resolvedTitle !== 'string') {
      resolvedOptions = resolvedTitle
      resolvedTitle = translate('Append {type}', { type: type.replace(/^bpmn:/, '') })
    }

    function createShape(): ContextPadElementLike {
      return elementFactory.createShape(assign({ type }, resolvedOptions ?? {}))
    }

    function appendStart(event: unknown, currentElement: ContextPadElementLike): void {
      const shape = createShape()
      create.start(event, shape, {
        source: currentElement
      })
    }

    const append = autoPlace
      ? function(event: unknown, currentElement: ContextPadElementLike): void {
          autoPlace.append(currentElement, createShape())
        }
      : appendStart

    return {
      group: 'model',
      className,
      title: resolvedTitle,
      action: {
        dragstart: appendStart,
        click: append
      }
    }
  }

  function splitLaneHandler(count: number): ActionHandler {
    return function(_event: unknown, currentElement: ContextPadElementLike): void {
      modeling.splitLane(currentElement, count)
      contextPad.open(currentElement, true)
    }
  }

  if (isAny(businessObject, ['bpmn:Lane', 'bpmn:Participant']) && isExpanded(element)) {
    const childLanes = getChildLanes(element)

    assign(actions, {
      'lane-insert-above': {
        group: 'lane-insert-above',
        className: 'bpmn-icon-lane-insert-above',
        title: translate('Add Lane above'),
        action: {
          click(_event: unknown, currentElement: ContextPadElementLike): void {
            modeling.addLane(currentElement, 'top')
          }
        }
      }
    })

    if (childLanes.length < 2) {
      if ((element.height ?? 0) >= 120) {
        assign(actions, {
          'lane-divide-two': {
            group: 'lane-divide',
            className: 'bpmn-icon-lane-divide-two',
            title: translate('Divide into two Lanes'),
            action: {
              click: splitLaneHandler(2)
            }
          }
        })
      }

      if ((element.height ?? 0) >= 180) {
        assign(actions, {
          'lane-divide-three': {
            group: 'lane-divide',
            className: 'bpmn-icon-lane-divide-three',
            title: translate('Divide into three Lanes'),
            action: {
              click: splitLaneHandler(3)
            }
          }
        })
      }
    }

    assign(actions, {
      'lane-insert-below': {
        group: 'lane-insert-below',
        className: 'bpmn-icon-lane-insert-below',
        title: translate('Add Lane below'),
        action: {
          click(_event: unknown, currentElement: ContextPadElementLike): void {
            modeling.addLane(currentElement, 'bottom')
          }
        }
      }
    })
  }

  if (is(businessObject, 'bpmn:FlowNode')) {
    if (is(businessObject, 'bpmn:EventBasedGateway')) {
      assign(actions, {
        'append.receive-task': appendAction('bpmn:ReceiveTask', 'bpmn-icon-receive-task', translate('Append ReceiveTask')),
        'append.message-intermediate-event': appendAction(
          'bpmn:IntermediateCatchEvent',
          'bpmn-icon-intermediate-event-catch-message',
          translate('Append MessageIntermediateCatchEvent'),
          { eventDefinitionType: 'bpmn:MessageEventDefinition' }
        ),
        'append.timer-intermediate-event': appendAction(
          'bpmn:IntermediateCatchEvent',
          'bpmn-icon-intermediate-event-catch-timer',
          translate('Append TimerIntermediateCatchEvent'),
          { eventDefinitionType: 'bpmn:TimerEventDefinition' }
        ),
        'append.condition-intermediate-event': appendAction(
          'bpmn:IntermediateCatchEvent',
          'bpmn-icon-intermediate-event-catch-condition',
          translate('Append ConditionIntermediateCatchEvent'),
          { eventDefinitionType: 'bpmn:ConditionalEventDefinition' }
        ),
        'append.signal-intermediate-event': appendAction(
          'bpmn:IntermediateCatchEvent',
          'bpmn-icon-intermediate-event-catch-signal',
          translate('Append SignalIntermediateCatchEvent'),
          { eventDefinitionType: 'bpmn:SignalEventDefinition' }
        )
      })
    } else if (isEventType(businessObject, 'bpmn:BoundaryEvent', 'bpmn:CompensateEventDefinition')) {
      assign(actions, {
        'append.compensation-activity': appendAction(
          'bpmn:Task',
          'bpmn-icon-task',
          translate('Append compensation activity'),
          { isForCompensation: true }
        )
      })
    } else if (
      !is(businessObject, 'bpmn:EndEvent') &&
      !businessObject.isForCompensation &&
      !isEventType(businessObject, 'bpmn:IntermediateThrowEvent', 'bpmn:LinkEventDefinition') &&
      !isEventSubProcess(businessObject)
    ) {
      assign(actions, {
        'append.end-event': appendAction('bpmn:EndEvent', 'bpmn-icon-end-event-none', translate('Append EndEvent')),
        'append.gateway': appendAction('bpmn:ExclusiveGateway', 'bpmn-icon-gateway-none', translate('Append Gateway')),
        'append.append-user-task': appendAction('bpmn:UserTask', 'bpmn-icon-user-task', '添加用户任务'),
        'append.intermediate-event': appendAction(
          'bpmn:IntermediateThrowEvent',
          'bpmn-icon-intermediate-event-none',
          translate('Append Intermediate/Boundary Event')
        )
      })
    }
  }

  if (!popupMenu.isEmpty(element, 'bpmn-replace')) {
    assign(actions, {
      replace: {
        group: 'edit',
        className: 'bpmn-icon-screw-wrench',
        title: translate('Change type'),
        action: {
          click(event: { x?: number; y?: number } | unknown, currentElement: ContextPadElementLike): void {
            const basePosition = getReplaceMenuPosition(currentElement)
            const cursor = typeof event === 'object' && event !== null
              ? { x: (event as { x?: number }).x, y: (event as { y?: number }).y }
              : { x: undefined, y: undefined }

            const position = assign(basePosition, { cursor })

            popupMenu.open(currentElement, 'bpmn-replace', position, {
              title: translate('Change element'),
              width: 300,
              search: true
            })
          }
        }
      }
    })
  }

  if (is(businessObject, 'bpmn:SequenceFlow')) {
    assign(actions, {
      'append.text-annotation': appendAction('bpmn:TextAnnotation', 'bpmn-icon-text-annotation')
    })
  }

  if (isAny(businessObject, ['bpmn:FlowNode', 'bpmn:InteractionNode', 'bpmn:DataObjectReference', 'bpmn:DataStoreReference'])) {
    assign(actions, {
      'append.text-annotation': appendAction('bpmn:TextAnnotation', 'bpmn-icon-text-annotation'),
      connect: {
        group: 'connect',
        className: 'bpmn-icon-connection-multi',
        title: translate(
          'Connect using ' +
          (businessObject.isForCompensation ? '' : 'Sequence/MessageFlow or ') +
          'Association'
        ),
        action: {
          click: startConnect,
          dragstart: startConnect
        }
      }
    })
  }

  if (is(businessObject, 'bpmn:TextAnnotation')) {
    assign(actions, {
      connect: {
        group: 'connect',
        className: 'bpmn-icon-connection-multi',
        title: translate('Connect using Association'),
        action: {
          click: startConnect,
          dragstart: startConnect
        }
      }
    })
  }

  if (isAny(businessObject, ['bpmn:DataObjectReference', 'bpmn:DataStoreReference'])) {
    assign(actions, {
      connect: {
        group: 'connect',
        className: 'bpmn-icon-connection-multi',
        title: translate('Connect using DataInputAssociation'),
        action: {
          click: startConnect,
          dragstart: startConnect
        }
      }
    })
  }

  if (is(businessObject, 'bpmn:Group')) {
    assign(actions, {
      'append.text-annotation': appendAction('bpmn:TextAnnotation', 'bpmn-icon-text-annotation')
    })
  }

  let deleteAllowed = rules.allowed('elements.delete', { elements: [element] })
  if (isArray(deleteAllowed)) {
    deleteAllowed = deleteAllowed[0] === element
  }

  if (deleteAllowed) {
    assign(actions, {
      delete: {
        group: 'edit',
        className: 'bpmn-icon-trash',
        title: translate('Remove'),
        action: {
          click: removeElement
        }
      }
    })
  }

  return actions
}

function isEventType(eventBo: ContextPadBusinessObjectLike, type: string, definition: string): boolean {
  const isType = eventBo.$instanceOf?.(type) ?? false
  let isDefinition = false

  const definitions = eventBo.eventDefinitions ?? []
  forEach(definitions, def => {
    if (def.$type === definition) {
      isDefinition = true
    }
  })

  return isType && isDefinition
}

function containsElement(array: ContextPadElementLike[], item: ContextPadElementLike): boolean {
  return array.indexOf(item) !== -1
}
