import { getDefaultSettings, getSettingsRuntime } from '../settings'
import useSettingsStore from '@/store/modules/settings'
import { StrUtil } from "@ruoyi/core/utils/str";

/**
 * 动态修改标题
 */
export function useDynamicTitle() {
  const defaultSettings = getDefaultSettings();
  const settingsRuntime = getSettingsRuntime();
  const appTitle = settingsRuntime.title || defaultSettings.title;
  const settingsStore = useSettingsStore();
  if (settingsStore.dynamicTitle && StrUtil.isNotBlank(settingsStore.title)) {
    document.title = settingsStore.title + ' - ' + appTitle;
  } else {
    document.title = appTitle;
  }
}