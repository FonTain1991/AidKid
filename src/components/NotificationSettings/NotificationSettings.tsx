import { useEvent } from '@/hooks'
import { notificationService } from '@/lib'
import { memo, useEffect, useState } from 'react'
import { Alert, AppState, Linking, TouchableOpacity, View } from 'react-native'
import { Text } from '../Text'
import { useStyles } from './useStyles'

export const NotificationSettings = memo(() => {
  const styles = useStyles()

  const [hasPermission, setHasPermission] = useState(false)
  const [canScheduleAlarms, setCanScheduleAlarms] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadSettings = useEvent(async () => {
    try {
      setIsLoading(true)

      const [permission, canSchedule] = await Promise.all([
        notificationService.checkPermission(),
        notificationService.canScheduleExactAlarms()
      ])

      setHasPermission(permission)
      setCanScheduleAlarms(canSchedule)
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    } finally {
      setIsLoading(false)
    }
  })

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Обработка изменения состояния приложения
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Обновляем данные когда пользователь возвращается в приложение
        loadSettings()
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => {
      subscription?.remove()
    }
  }, [loadSettings])

  const requestPermission = useEvent(async () => {
    try {
      const granted = await notificationService.requestPermission()
      setHasPermission(granted)

      if (granted) {
        Alert.alert('✅ Разрешение получено', 'Уведомления включены!')
      } else {
        Alert.alert('❌ Разрешение отклонено', 'Уведомления будут отключены.')
      }
    } catch (error) {
      console.error('Failed to request permission:', error)
      Alert.alert('Ошибка', 'Не удалось запросить разрешение')
    }
  })

  const openAlarmSettings = useEvent(async () => {
    await notificationService.requestExactAlarmPermission()
  })

  const openAppSettings = useEvent(async () => {
    try {
      await Linking.openSettings()
    } catch (error) {
      console.error('Failed to open app settings:', error)
      Alert.alert('Ошибка', 'Не удалось открыть настройки приложения')
    }
  })

  const getStatusIcon = useEvent((status: boolean) => (status ? '✅' : '❌'))
  const getStatusText = useEvent((status: boolean) => (status ? 'Включено' : 'Отключено'))

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Загрузка настроек...
        </Text>
      </View>
    )
  }

  return (
    <>
      {/* Статус разрешений */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Статус разрешений</Text>

        <View style={styles.statusItem}>
          <View style={styles.statusContent}>
            <Text style={styles.statusIcon}>{getStatusIcon(hasPermission)}</Text>
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>
                Основные уведомления
              </Text>
              <Text style={styles.statusDescription}>
                {getStatusText(hasPermission)}
              </Text>
            </View>
          </View>
          {!hasPermission && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={requestPermission}
            >
              <Text style={styles.actionButtonText}>Включить</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statusItem}>
          <View style={styles.statusContent}>
            <Text style={styles.statusIcon}>{getStatusIcon(canScheduleAlarms)}</Text>
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>
                Точные уведомления (Android 12+)
              </Text>
              <Text style={styles.statusDescription}>
                {getStatusText(canScheduleAlarms)}
              </Text>
            </View>
          </View>
          {!canScheduleAlarms && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={openAlarmSettings}
            >
              <Text style={styles.actionButtonText}>Настроить</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Настройки приложения */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Настройки приложения</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={openAppSettings}
        >
          <View style={styles.menuItemContent}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>
                Открыть настройки приложения
              </Text>
              <Text style={styles.menuDescription}>
                Системные настройки уведомлений и разрешений
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Информация */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>О уведомлениях</Text>
        <Text style={styles.infoText}>
          • Уведомления приходят за 30, 14, 7, 3, 2, 1 день до истечения срока годности{'\n'}
          • Критические уведомления приходят в день истечения и после{'\n'}
          • Для надежной работы отключите оптимизацию батареи{'\n'}
          • На Android 12+ требуется разрешение "Alarms & reminders"
        </Text>
      </View>
    </>
  )
})