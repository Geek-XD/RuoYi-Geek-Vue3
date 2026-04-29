import vue from '@vitejs/plugin-vue'
import glsl from "vite-plugin-glsl";
import createAutoImport from './auto-import'
import createSvgIcon from './svg-icon'
import createCompression from './compression'
import createSetupExtend from './setup-extend'

export default function createVitePlugins(viteEnv, isBuild = false, options = {}) {
    const vitePlugins = [vue(), glsl()]
    vitePlugins.push(createAutoImport())
    vitePlugins.push(createSetupExtend())
    vitePlugins.push(createSvgIcon(isBuild, options.svgIconOptions))
    isBuild && vitePlugins.push(...createCompression(viteEnv))
    return vitePlugins
}
