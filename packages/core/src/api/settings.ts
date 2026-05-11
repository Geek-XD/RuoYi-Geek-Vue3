import { getConfigKey } from '@/api/system/config'
import { resolveMenuLayout } from '@/settings'

const toString = (value: string) => value
const toBoolean = (value: string) => value === 'true'

async function getConfig<T>(key: string, transform: (value: string) => T, defaultValue: T): Promise<T> {
  try {
    return transform((await getConfigKey(key)).msg)
  } catch {
    return defaultValue
  }
}

export async function fetchDbSettings() {
  const [theme, sideTheme, topNav, menuLayout, tagsView, fixedHeader, sidebarLogo, dynamicTitle] = await Promise.all([
    getConfig('sys.index.theme', toString, '#409eff'),
    getConfig('sys.index.sideTheme', toString, 'theme-dark'),
    getConfig('sys.index.topNav', toBoolean, false),
    getConfig('sys.index.menuLayout', toString, ''),
    getConfig('sys.index.tagsView', toBoolean, true),
    getConfig('sys.index.fixedHeader', toBoolean, false),
    getConfig('sys.index.sidebarLogo', toBoolean, true),
    getConfig('sys.index.dynamicTitle', toBoolean, false),
  ])

  return {
    theme,
    sideTheme,
    menuLayout: resolveMenuLayout(menuLayout, topNav),
    topNav,
    tagsView,
    fixedHeader,
    sidebarLogo,
    dynamicTitle,
  }
}
