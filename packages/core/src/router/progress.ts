import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

/** 顶部进度条配置 */
export const configureNProgress = () => {
  NProgress.configure({
    easing: 'ease',
    speed: 600,
    showSpinner: false,
    trickleSpeed: 200,
    parent: 'body'
  })
}
