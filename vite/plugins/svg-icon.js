import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import path from 'path'
import fs from 'fs'

export default function createSvgIcon(isBuild, options = {}) {
    const { workspaceRoot = process.cwd(), iconDirs = [], customDomId } = options
    const baseIconDirs = [path.resolve(workspaceRoot, 'src/assets/icons/svg'), ...iconDirs]
    return createSvgIconsPlugin({
        iconDirs: [...new Set(baseIconDirs.map(iconDir => path.resolve(iconDir)))].filter(iconDir => fs.existsSync(iconDir)),
        symbolId: 'icon-[dir]-[name]',
        svgoOptions: isBuild,
        ...(customDomId ? { customDomId } : {})
    })
}
