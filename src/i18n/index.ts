import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getLocales } from 'react-native-localize'
import dayjs from 'dayjs'
import localeData from 'dayjs/plugin/localeData'
import 'dayjs/locale/ru'
import 'dayjs/locale/en'
import { ru } from './locales/ru'
import { en } from './locales/en'

dayjs.extend(localeData)

const LANGUAGE_KEY = '@aidkit_language'

const SUPPORTED_LANGUAGES = ['ru', 'en'] as const

/** Язык устройства (ru/en или ru по умолчанию) */
export function getDeviceLanguage(): string {
  try {
    const locales = getLocales()
    const deviceLang = locales[0]?.languageCode?.toLowerCase()
    if (deviceLang && SUPPORTED_LANGUAGES.includes(deviceLang as (typeof SUPPORTED_LANGUAGES)[number])) {
      return deviceLang
    }
  } catch {
    // ignore
  }
  return 'ru'
}

export const getStoredLanguage = async (): Promise<string> => {
  try {
    const lang = await AsyncStorage.getItem(LANGUAGE_KEY)
    return lang ?? getDeviceLanguage()
  } catch {
    return getDeviceLanguage()
  }
}

export const setStoredLanguage = async (lang: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang)
  } catch (e) {
    console.error('Failed to save language:', e)
  }
}

export const LANGUAGES = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: 'ru',
  fallbackLng: 'ru',
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', lng => {
  dayjs.locale(lng === 'ru' ? 'ru' : 'en')
})

export default i18n
