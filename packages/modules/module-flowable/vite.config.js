import path from 'path'
import { fileURLToPath } from 'url'
import { defineQiankunModuleViteConfig } from '../../../vite/module-subapp.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

export default defineQiankunModuleViteConfig({
  currentDir,
  moduleKey: 'flowable',
  port: 7101
})