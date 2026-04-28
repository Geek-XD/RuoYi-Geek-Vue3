import * as Vue from 'vue'
import designerSource from './designer.umd.js?raw'

let cachedPlugin

function requireDesignerDependency(id) {
  if (id === 'vue') {
    return Vue
  }

  throw new Error(`[vform] Unsupported dependency: ${id}`)
}

function loadDesignerPlugin() {
  if (cachedPlugin) {
    return cachedPlugin
  }

  const runtimeModule = { exports: {} }
  const evaluateDesigner = new Function('module', 'exports', 'require', designerSource)

  evaluateDesigner(runtimeModule, runtimeModule.exports, requireDesignerDependency)
  cachedPlugin = runtimeModule.exports?.default ?? runtimeModule.exports

  return cachedPlugin
}

const VForm3 = loadDesignerPlugin()

export default VForm3
export const VFormDesigner = VForm3.VFormDesigner
export const VFormRender = VForm3.VFormRender