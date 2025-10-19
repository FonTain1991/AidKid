import { useEffect, useRef, useCallback } from 'react'
import notifee, { Event, EventType } from '@notifee/react-native'
import { useNavigation } from '@react-navigation/native'

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigation = useNavigation()
  const isNavigationReady = useRef(false)

  const handleNotificationPress = useCallback((data: any) => {
    if (!isNavigationReady.current) {
      // Если навигация не готова, пробуем позже
      setTimeout(() => handleNotificationPress(data), 100)
      return
    }

    console.log('📲 Handling notification press:', data)
    const notificationType = data.type

    if (notificationType === 'reminder' && data.reminderId) {
      // Уведомление о напоминании - открываем экран "Сегодня"
      console.log('📲 Navigating to Today screen');
      (navigation as any).navigate('Today')
    } else if (notificationType === 'expiry' || notificationType === 'expired') {
      // Уведомление об истечении срока годности - открываем экран с лекарствами
      console.log('📲 Navigating to KitDetails screen')
      if (data.kitId) {
        (navigation as any).navigate('KitDetails', { kitId: data.kitId })
      }
    } else if (notificationType === 'shopping-list-reminder') {
      // Уведомление о покупках - открываем список покупок
      console.log('📲 Navigating to ShoppingList screen');
      (navigation as any).navigate('ShoppingList')
    }
  }, [navigation])

  useEffect(() => {
    // Отмечаем навигацию как готовую
    isNavigationReady.current = true

    // Обработчик нажатий на уведомления когда приложение на переднем плане
    const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }: Event) => {
      if (type === EventType.PRESS && detail.notification?.data) {
        console.log('📲 Foreground notification pressed')
        handleNotificationPress(detail.notification.data)
      }
    })

    // Обработчик нажатий на уведомления когда приложение в фоне/закрыто
    notifee.onBackgroundEvent(({ type, detail }: Event) => {
      if (type === EventType.PRESS && detail.notification?.data) {
        console.log('📲 Background notification pressed')
        // Данные сохраняются, навигация произойдет при открытии через onForegroundEvent
      }
      return Promise.resolve()
    })

    return () => {
      unsubscribeForeground()
      isNavigationReady.current = false
    }
  }, [handleNotificationPress])

  return <>{children}</>
}

