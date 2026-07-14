import GraphContextPad from './GraphContextPad'
import GraphLayouter from './GraphLayouter'
import GraphRenderer from './GraphRenderer'
import GraphRules from './GraphRules'
import CroppingConnectionDocking from 'diagram-js/lib/layout/CroppingConnectionDocking'

const graphDesignerModule = {
  __init__: ['graphRules', 'graphContextPad', 'graphRenderer'],
  graphRules: ['type', GraphRules],
  graphContextPad: ['type', GraphContextPad],
  graphRenderer: ['type', GraphRenderer],
  layouter: ['type', GraphLayouter],
  connectionDocking: ['type', CroppingConnectionDocking]
} as const

export default graphDesignerModule
