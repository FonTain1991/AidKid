import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useColorScheme } from 'react-native'
import { DARK_COLORS } from './dark'
import { LIGHT_COLORS } from './light'
import { ThemeColors } from './light/light'

const STORAGE_KEY = 'APP_THEME'

type ThemeType = 'light' | 'dark'

interface ThemeContextType {
  isDark: boolean
  colors: ThemeColors
  setColorScheme: (scheme: ThemeType) => void
}

const defaultValue: ThemeContextType = {
  isDark: false,
  colors: LIGHT_COLORS,
  setColorScheme: () => { },
}

export const ThemeContext = createContext<ThemeContextType>(defaultValue)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme()
  const [isDark, setIsDark] = useState<boolean>(false)

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY)
        if (stored === 'light' || stored === 'dark') {
          setIsDark(stored === 'dark')
        } else {
          setIsDark(false) // По умолчанию светлая тема
        }
      } catch (e) {
        console.warn('Failed to load theme from storage', e)
        setIsDark(false) // По умолчанию светлая тема
      }
    }

    loadTheme()
  }, [systemScheme])

  const setColorScheme = async (scheme: ThemeType) => {
    setIsDark(scheme === 'dark')
    await AsyncStorage.setItem(STORAGE_KEY, scheme)
  }

  const value = useMemo<ThemeContextType>(() => {
    return {
      isDark,
      colors: isDark ? DARK_COLORS : LIGHT_COLORS,
      setColorScheme
    }
  }, [isDark])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
