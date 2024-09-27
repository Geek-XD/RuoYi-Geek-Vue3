import { getConfigKey } from '@/api/system/config'

const setting = {
  /**
   * 网页标题
   */
  title: import.meta.env.VITE_APP_TITLE,
  /**
   * 主题色
   */
  theme: '#409EFF',
  /**
   * 侧边栏主题 深色主题theme-dark，浅色主题theme-light
   */
  sideTheme: 'theme-dark',
  /**
   * 是否系统布局配置
   */
  showSettings: false,

  /**
   * 是否显示顶部导航
   */
  topNav: false,

  /**
   * 是否显示 tagsView
   */
  tagsView: true,

  /**
   * 是否固定头部
   */
  fixedHeader: false,

  /**
   * 是否显示logo
   */
  sidebarLogo: true,

  /**
   * 是否显示动态标题
   */
  dynamicTitle: false,

  /**
   * @type {string | array} 'production' | ['production', 'development']
   * @description Need show err logs component.
   * The default is only used in the production env
   * If you want to also use it in dev, you can pass ['production', 'development']
   */
  errorLog: 'production',

  /**
   * 获取后端配置的设置
   * @returns Promise<Object>
   */
  async initSetting() {
    const config = (key,type=String) => getConfigKey(key).then(res => {
      if(type===String){
        return res.msg
      }else if(type===Number){
        return +res.msg
      }else if(type===Boolean){
        return res.msg==='true'
      }else if(type===Array){
        return res.msg.split(',')
      }else{
        return new type(res.msg)
      }
    })
    return {
      theme: await config("sys.index.theme"),
      sideTheme: await config("sys.index.sideTheme"),
      topNav: await config("sys.index.topNav",Boolean),
      tagsView: await config("sys.index.tagsView",Boolean),
      fixedHeader: await config("sys.index.fixedHeader",Boolean),
      sidebarLogo: await config("sys.index.sidebarLogo",Boolean),
      dynamicTitle: await config("sys.index.dynamicTitle"),
    }
  }
}


export default setting