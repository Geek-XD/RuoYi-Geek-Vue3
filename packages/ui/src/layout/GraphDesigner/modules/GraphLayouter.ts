import { repairConnection, withoutRedundantPoints } from 'diagram-js/lib/layout/ManhattanLayout'
import { getMid } from 'diagram-js/lib/layout/LayoutUtil'

const DEFAULT_LAYOUTS = ['h:h', 'v:v']

function getConnectionDocking(point: { x: number; y: number; original?: { x: number; y: number } } | undefined, shape: any) {
  return point ? (point.original || point) : getMid(shape)
}

export default class GraphLayouter {
  layoutConnection(connection: any, hints: any = {}) {
    const source = hints.source || connection.source
    const target = hints.target || connection.target
    const waypoints = Array.isArray(connection?.waypoints) ? connection.waypoints : []
    let connectionStart = hints.connectionStart
    let connectionEnd = hints.connectionEnd

    if (!source || !target) {
      return waypoints
    }

    if (!connectionStart) {
      connectionStart = getConnectionDocking(waypoints[0], source)
    }

    if (!connectionEnd) {
      connectionEnd = getConnectionDocking(waypoints[waypoints.length - 1], target)
    }

    const layoutHints = {
      ...hints,
      preferredLayouts: hints.preferredLayouts || DEFAULT_LAYOUTS
    }

    const updatedWaypoints = withoutRedundantPoints(repairConnection(
      source,
      target,
      connectionStart,
      connectionEnd,
      waypoints,
      layoutHints
    ))

    return updatedWaypoints || [connectionStart, connectionEnd]
  }
}
