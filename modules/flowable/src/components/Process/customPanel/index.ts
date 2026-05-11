import CustomContextPad from './CustomContextPad'
import CustomPalette from './CustomPalette'

const customControlsModule = {
  __init__: ['paletteProvider', 'contextPadProvider'],
  paletteProvider: ['type', CustomPalette],
  contextPadProvider: ['type', CustomContextPad]
} as const

export default customControlsModule
