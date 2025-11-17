import { useEffect, useState } from 'react'
import { notificationService } from '@/shared/lib'
import { useEvent } from './useEvent'

/**
 * Хук для работы с уведомлениями
 * @returns {object} Объект с методами и состоянием уведомлений
 */
export function useNotifications() {
  const [hasPermission, setHasPermission] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const initialize = useEvent(async () => {
    try {
      await notificationService.init()
      const permission = await notificationService.checkPermission()
      setHasPermission(permission)
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize notifications:', error)
    }
  })

  useEffect(() => {
    initialize()
  }, [initialize])

  const requestPermission = useEvent(async () => {
    try {
      const granted = await notificationService.requestPermission()
      setHasPermission(granted)
      return granted
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  })

  const displayNotification = useEvent(async (title: string, body: string, data?: any) => {
    if (!hasPermission) {
      console.log('No permission to display notification')
      return
    }
    await notificationService.displayNotification(title, body, data)
  })

  const getTriggerNotifications = useEvent(async () => {
    return await notificationService.getTriggerNotifications()
  })

  const cancelAllNotifications = useEvent(async () => {
    await notificationService.cancelAllNotifications()
  })

  return {
    hasPermission,
    isInitialized,
    requestPermission,
    displayNotification,
    getTriggerNotifications,
    cancelAllNotifications,
  }
}

