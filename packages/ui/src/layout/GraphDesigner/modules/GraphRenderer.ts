import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer'
import { componentsToPath } from 'diagram-js/lib/util/RenderUtil'

const RENDER_PRIORITY = 2000
const DEFAULT_NODE_COLOR = '#409EFF'
const DEFAULT_CONNECTION_COLOR = '#909399'
const SVG_NS = 'http://www.w3.org/2000/svg'

function svgCreate(tagName: string) {
  return document.createElementNS(SVG_NS, tagName)
}

function svgAttr(element: Element, attributes: Record<string, string | number>) {
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, String(value))
  })
}

function svgAppend(parent: Element, child: Element) {
  parent.appendChild(child)
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value
}

function sanitizeMarkerColor(color: string) {
  return color.replace(/[^a-zA-Z0-9_-]/g, '-')
}

function getMidPoint(waypoints: Array<{ x: number; y: number }>) {
  if (waypoints.length <= 2) {
    const [start, end] = waypoints
    return {
      x: ((start?.x || 0) + (end?.x || 0)) / 2,
      y: ((start?.y || 0) + (end?.y || 0)) / 2
    }
  }

  const middleIndex = Math.floor((waypoints.length - 1) / 2)
  const start = waypoints[middleIndex]
  const end = waypoints[middleIndex + 1] || start
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  }
}

function ensureArrowMarker(visuals: SVGElement, color: string) {
  const svgRoot = visuals.ownerSVGElement
  const markerId = `graph-connection-arrow-${sanitizeMarkerColor(color)}`
  if (!svgRoot) {
    return markerId
  }

  if (svgRoot.querySelector(`#${markerId}`)) {
    return markerId
  }

  const defs = svgCreate('defs')
  const marker = svgCreate('marker')
  const path = svgCreate('path')

  svgAttr(marker, {
    id: markerId,
    viewBox: '0 0 10 10',
    refX: 9,
    refY: 5,
    markerWidth: 7,
    markerHeight: 7,
    orient: 'auto-start-reverse'
  })

  svgAttr(path, {
    d: 'M 0 0 L 10 5 L 0 10 z',
    fill: color
  })

  svgAppend(marker, path)
  svgAppend(defs, marker)
  svgAppend(svgRoot, defs)
  return markerId
}

function buildConnectionPath(waypoints: Array<{ x: number; y: number; original?: { x: number; y: number } }>, useOriginal = false) {
  return componentsToPath(
    waypoints.map((point, index) => {
      const resolvedPoint = useOriginal ? (point.original || point) : point
      return [
        index === 0 ? 'M' : 'L',
        resolvedPoint.x,
        resolvedPoint.y
      ]
    })
  )
}

export default class GraphRenderer extends BaseRenderer {
  static $inject = ['eventBus']

  constructor(eventBus: any) {
    super(eventBus, RENDER_PRIORITY)
  }

  canRender(element: any) {
    return element?.graphKind === 'node' || element?.graphKind === 'connection'
  }

  drawShape(visuals: SVGElement, element: any) {
    const shadow = svgCreate('rect')
    const rect = svgCreate('rect')
    const accent = svgCreate('rect')
    const title = truncateText(String(element.graphLabel || '未命名节点'), 18)
    const subtitle = truncateText(String(element.graphSubtitle || element.graphType || ''), 24)
    const color = element.graphColor || DEFAULT_NODE_COLOR

    svgAttr(shadow, {
      x: 0,
      y: 2,
      width: element.width || 200,
      height: element.height || 92,
      rx: 12,
      ry: 12,
      fill: 'rgba(17, 24, 39, 0.06)'
    })
    svgAppend(visuals, shadow)

    svgAttr(rect, {
      x: 0,
      y: 0,
      width: element.width || 200,
      height: element.height || 92,
      rx: 12,
      ry: 12,
      fill: '#FFFFFF',
      stroke: '#D0D7E2',
      'stroke-width': 1.5
    })
    svgAppend(visuals, rect)

    svgAttr(accent, {
      x: 0,
      y: 0,
      width: element.width || 200,
      height: 6,
      rx: 12,
      ry: 12,
      fill: color
    })
    svgAppend(visuals, accent)

    const titleText = svgCreate('text')
    svgAttr(titleText, {
      x: (element.width || 200) / 2,
      y: (element.height || 92) / 2 - 8,
      'text-anchor': 'middle',
      'font-size': 14,
      'font-weight': 600,
      fill: '#303133'
    })
    titleText.textContent = title
    svgAppend(visuals, titleText)

    const subtitleText = svgCreate('text')
    svgAttr(subtitleText, {
      x: (element.width || 200) / 2,
      y: (element.height || 92) / 2 + 14,
      'text-anchor': 'middle',
      'font-size': 12,
      fill: '#909399'
    })
    subtitleText.textContent = subtitle
    svgAppend(visuals, subtitleText)

    return rect
  }

  drawConnection(visuals: SVGElement, element: any) {
    const color = element.graphColor || DEFAULT_CONNECTION_COLOR
    const markerId = ensureArrowMarker(visuals, color)

    const line = svgCreate('path')
    const waypoints = Array.isArray(element.waypoints) ? element.waypoints : []
    svgAttr(line, {
      d: buildConnectionPath(waypoints),
      fill: 'none',
      stroke: color,
      'stroke-width': 2,
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
      'marker-end': `url(#${markerId})`
    })
    svgAppend(visuals, line)

    const label = truncateText(String(element.graphLabel || element.graphType || ''), 18)
    if (label) {
      const midpoint = getMidPoint(waypoints)
      const text = svgCreate('text')
      svgAttr(text, {
        x: midpoint.x,
        y: midpoint.y - 8,
        'text-anchor': 'middle',
        'font-size': 12,
        fill: '#606266'
      })
      text.textContent = label
      svgAppend(visuals, text)
    }

    return line
  }

  getShapePath(shape: any) {
    const { x, y, width, height } = shape
    return componentsToPath([
      ['M', x, y],
      ['l', width, 0],
      ['l', 0, height],
      ['l', -width, 0],
      ['z']
    ])
  }

  getConnectionPath(connection: any) {
    const waypoints = Array.isArray(connection.waypoints) ? connection.waypoints : []
    return buildConnectionPath(waypoints, true)
  }
}
