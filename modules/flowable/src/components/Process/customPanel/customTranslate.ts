import translations from '../lang/zh'
import type { TranslateReplacements } from '../common/types'

export default function customTranslate(template: string, replacements: TranslateReplacements = {}): string {
  const translationMap = translations as Record<string, string>
  const translatedTemplate = translationMap[template] ?? template

  return translatedTemplate.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const replacement = replacements[key]
    return replacement == null ? `{${key}}` : `${replacement}`
  })
}
