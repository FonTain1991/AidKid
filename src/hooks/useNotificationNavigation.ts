import { useEffect } from 'react'
import notifee, { EventType, Event } from '@notifee/react-native'
import { NavigationContainerRef } from '@react-navigation/native'
import type { MainList } from '@/navigation/AppNavigation'

export function useNotificationNavigation(navigationRef: React.RefObject<NavigationContainerRef<MainList> | null>) {
  useEffect(() => {
    const navigateToScreen = (screenName: keyof MainList) => {
      if (!navigationRef.current) {
        return false
      }

      try {
        navigationRef.current.navigate(screenName as never)
        return true
      } catch (error) {
        console.error('Navigation error:', error)
        return false
      }
    }

    const handleNotificationPress = (data?: any) => {
      if (!data) {
        return
      }

      const notificationType = data.type
      let targetScreen: keyof MainList | null = null

      // Определяем целевой экран
      switch (notificationType) {
        case 'reminder':
          targetScreen = 'today'
          break
        case 'expired':
        case 'expiry':
          targetScreen = 'expiringMedicines'
          break
        case 'lowStock':
          targetScreen = 'lowStockMedicines'
          break
        default:
          console.log('Unknown notification type:', notificationType)
          return
      }

      if (!targetScreen) {
        return
      }

      // Функция для выполнения навигации с проверкой готовности
      let attempts = 0
      const maxAttempts = 20

      const performNavigation = () => {
        attempts++

        if (navigateToScreen(targetScreen!)) {
          return // Успешно навигировали
        }

        if (attempts < maxAttempts) {
          // Если навигация еще не готова, пробуем еще раз через 200мс
          setTimeout(performNavigation, 200)
          return
        }

        console.warn('Navigation not ready after max attempts')
      }

      // Задержка для гарантии готовности навигации
      setTimeout(performNavigation, 500)
    }

    // Обработка событий уведомлений когда приложение на переднем плане
    notifee.onForegroundEvent(({ type, detail }: Event) => {
      if (type === EventType.PRESS) {
        handleNotificationPress(detail.notification?.data)
      }
    })

    // Проверяем, было ли приложение открыто через уведомление
    notifee.getInitialNotification().then(initialNotification => {
      if (initialNotification?.notification?.data) {
        // Небольшая задержка для полной инициализации приложения
        setTimeout(() => {
          handleNotificationPress(initialNotification.notification.data)
        }, 1000)
      }
    })
  }, [navigationRef])
}

