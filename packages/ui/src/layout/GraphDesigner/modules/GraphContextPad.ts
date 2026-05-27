import type {
  GraphContextPadAction,
  GraphContextPadContext
} from '../common/types'

interface GraphContextPadConfig {
  createContextPadContext?: (element: any, event?: unknown) => GraphContextPadContext | null
  resolveContextPadEntries?: (context: GraphContextPadContext) => GraphContextPadAction[]
}

export default class GraphContextPad {
  static $inject = ['injector']

  private readonly contextPad: any | undefined
  private readonly modeling: any | undefined
  private readonly connect: any | undefined
  private readonly graphConfig: GraphContextPadConfig

  constructor(injector: any) {
    this.contextPad = injector.get('contextPad', false)
    this.modeling = injector.get('modeling', false)
    this.connect = injector.get('connect', false)
    this.graphConfig = injector.get('graphConfig', false) || {}

    this.contextPad?.registerProvider(this)
  }

  private toCustomEntry(entry: GraphContextPadAction, element: any) {
    return {
      group: entry.group,
      className: entry.className,
      title: entry.title,
      separator: entry.separator,
      action: entry.action ? {
        click: (event: unknown) => {
          const context = this.graphConfig.createContextPadContext?.(element, event)
          if (context) {
            entry.action?.click?.(context)
          }
        },
        dragstart: (event: unknown) => {
          const context = this.graphConfig.createContextPadContext?.(element, event)
          if (context) {
            entry.action?.dragstart?.(context)
          }
        }
      } : undefined
    }
  }

  getContextPadEntries(element: any) {
    if (element?.graphKind !== 'node') {
      return {}
    }

    const defaultEntries = {
      connect: {
        group: 'connect',
        className: 'graph-icon-connect',
        title: '连接节点',
        action: {
          click: (event: unknown, currentElement: any) => this.connect?.start?.(event, currentElement)
        }
      },
      delete: {
        group: 'edit',
        className: 'graph-icon-delete',
        title: '删除节点',
        action: {
          click: (_event: unknown, currentElement: any) => this.modeling?.removeElements?.([currentElement])
        }
      }
    }

    const context = this.graphConfig.createContextPadContext?.(element)
    const customEntries = context
      ? (this.graphConfig.resolveContextPadEntries?.(context) || []).reduce((acc, entry) => {
        acc[entry.key] = this.toCustomEntry(entry, element)
        return acc
      }, {} as Record<string, any>)
      : {}

    return {
      ...defaultEntries,
      ...customEntries
    }
  }
}
