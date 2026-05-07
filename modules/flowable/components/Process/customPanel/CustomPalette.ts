/**
 * 自定义左侧工具栏
 */
import { assign } from 'min-dash'
import type { TranslateReplacements } from '../common/types'

type ProviderActionHandler = (event: unknown, element?: PaletteShapeLike) => void

interface PaletteBusinessObjectLike {
  di?: {
    isExpanded?: boolean
  }
}

interface PaletteShapeLike {
  businessObject: PaletteBusinessObjectLike
}

interface PaletteCreateLike {
  start(event: unknown, shape: PaletteShapeLike): void
}

interface PaletteElementFactoryLike {
  createShape(config: Record<string, unknown>): PaletteShapeLike
}

interface PaletteRegisterLike {
  registerProvider(provider: unknown): void
}

interface ToolActivatorLike {
  activateSelection(event: unknown): void
}

interface HandToolLike {
  activateHand(event: unknown): void
}

interface GlobalConnectLike {
  start(event: unknown): void
}

interface PaletteEntryDescriptor {
  group: string
  className?: string
  title?: string
  separator?: boolean
  action?: {
    dragstart?: ProviderActionHandler
    click?: ProviderActionHandler
  }
}

type PaletteEntries = Record<string, PaletteEntryDescriptor>

interface PaletteProviderInstance {
  create: PaletteCreateLike
  elementFactory: PaletteElementFactoryLike
  handTool: HandToolLike
  lassoTool: ToolActivatorLike
  spaceTool: ToolActivatorLike
  globalConnect: GlobalConnectLike
  translate: (template: string, replacements?: TranslateReplacements) => string
}

interface CreateActionOptions {
  isExpanded?: boolean
  [key: string]: unknown
}

export default function CustomPalette(
  this: PaletteProviderInstance,
  palette: PaletteRegisterLike,
  create: PaletteCreateLike,
  elementFactory: PaletteElementFactoryLike,
  handTool: HandToolLike,
  lassoTool: ToolActivatorLike,
  spaceTool: ToolActivatorLike,
  globalConnect: GlobalConnectLike,
  translate: PaletteProviderInstance['translate']
): void {
  this.create = create
  this.elementFactory = elementFactory
  this.handTool = handTool
  this.lassoTool = lassoTool
  this.spaceTool = spaceTool
  this.globalConnect = globalConnect
  this.translate = translate

  palette.registerProvider(this)
}

CustomPalette.$inject = [
  'palette',
  'create',
  'elementFactory',
  'handTool',
  'lassoTool',
  'spaceTool',
  'globalConnect',
  'translate'
]

CustomPalette.prototype.getPaletteEntries = function(this: PaletteProviderInstance): PaletteEntries {
  const {
    create,
    elementFactory,
    handTool,
    lassoTool,
    spaceTool,
    globalConnect,
    translate
  } = this

  function createAction(
    type: string,
    group: string,
    className: string,
    title?: string,
    options?: CreateActionOptions
  ): PaletteEntryDescriptor {
    function createListener(event: unknown): void {
      const shape = elementFactory.createShape(assign({ type }, options ?? {}))

      if (options?.isExpanded != null) {
        shape.businessObject.di ??= {}
        shape.businessObject.di.isExpanded = options.isExpanded
      }

      create.start(event, shape)
    }

    const shortType = type.replace(/^bpmn:/, '')

    return {
      group,
      className,
      title: title ?? translate('Create {type}', { type: shortType }),
      action: {
        dragstart: createListener,
        click: createListener
      }
    }
  }

  return {
    'hand-tool': {
      group: 'tools',
      className: 'bpmn-icon-hand-tool',
      title: '激活抓手工具',
      action: {
        click(event: unknown): void {
          handTool.activateHand(event)
        }
      }
    },
    'lasso-tool': {
      group: 'tools',
      className: 'bpmn-icon-lasso-tool',
      title: '激活套索工具',
      action: {
        click(event: unknown): void {
          lassoTool.activateSelection(event)
        }
      }
    },
    'space-tool': {
      group: 'tools',
      className: 'bpmn-icon-space-tool',
      title: translate('Activate the create/remove space tool'),
      action: {
        click(event: unknown): void {
          spaceTool.activateSelection(event)
        }
      }
    },
    'global-connect-tool': {
      group: 'tools',
      className: 'bpmn-icon-connection-multi',
      title: translate('Activate the global connect tool'),
      action: {
        click(event: unknown): void {
          globalConnect.start(event)
        }
      }
    },
    'tool-separator': {
      group: 'tools',
      separator: true
    },
    'create.start-event': createAction('bpmn:StartEvent', 'event', 'bpmn-icon-start-event-none', '创建开始节点'),
    'create.end-event': createAction('bpmn:EndEvent', 'event', 'bpmn-icon-end-event-none', '创建结束节点'),
    'create.user-task': createAction('bpmn:UserTask', 'activity', 'bpmn-icon-user-task', '创建用户任务'),
    'create.exclusive-gateway': createAction('bpmn:ExclusiveGateway', 'gateway', 'bpmn-icon-gateway-xor', '创建排他网关')
  }
}
