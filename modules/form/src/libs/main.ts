import type { App } from "vue"
import VForm3 from '@lib/vform/designer.umd.js'  //引入VForm 3库
import '@lib/vform/designer.style.css'  //引入VForm3样式
export default function AppPlugin(app: App<Element>): void {
  app.use(VForm3)
}