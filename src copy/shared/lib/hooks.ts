import { useEffect, useState } from 'react'
import BootSplash from 'react-native-bootsplash'
import { databaseService } from './database'

export const useDatabase = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initDatabase = async () => {
      try {
        await databaseService.init()
        setIsInitialized(true)
        console.log('База данных инициализирована')
      } catch (err) {
        console.error('Ошибка инициализации базы данных:', err)
        setError(err instanceof Error ? err.message : 'Ошибка инициализации базы данных')
      } finally {
        await BootSplash.hide()
        setIsInitialized(true)
      }
    }

    initDatabase()
  }, [])

  return { isInitialized, error }
}
