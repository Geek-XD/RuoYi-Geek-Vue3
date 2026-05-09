export type MenuLayout = 'left' | 'mix' | 'top'

export const resolveMenuLayout = (menuLayout?: string | null, topNav?: boolean): MenuLayout =>
  menuLayout === 'left' || menuLayout === 'mix' || menuLayout === 'top'
    ? menuLayout
    : topNav ? 'mix' : 'left'

export default {
  /** 标题 */
  title: import.meta.env.VITE_APP_TITLE,
  /** 主题色 */
  theme: '#409EFF',
  /** 侧边栏主题 深色主题theme-dark | 浅色主题theme-light */
  sideTheme: 'theme-dark',
  /** 菜单布局模式：left 左侧菜单 | mix 混合菜单 | top 顶部菜单 */
  menuLayout: 'left' as MenuLayout,
  /** 是否顶部导航 */
  topNav: false,
  /** 是否显示 Tags-Views */
  tagsView: true,
  /** 是否固定头部 */
  fixedHeader: false,
  /** 是否显示 Logo */
  sidebarLogo: true,
  /** 是否显示动态标题 */
  dynamicTitle: false,
  /** 是否显示底部版权 */
  footerVisible: true,
  /** 底部版权文本内容 */
  footerContent: 'Copyright © 2018-2026 RuoYi-Geek. All Rights Reserved.',
  /** 错误日志类型 */
  errorLog: 'production',
}
