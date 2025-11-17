import { databaseService } from '@/services'
import { useEffect } from 'react'

export function useAppInit() {
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize database
        await databaseService.init()
      } catch (error) {
        console.error('Failed to initialize database:', error)
      }
    }
    init()
  }, [])
}