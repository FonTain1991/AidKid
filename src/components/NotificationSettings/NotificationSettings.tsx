import { useEvent } from '@/hooks'
import { useTranslation } from 'react-i18next'
import { notificationService } from '@/lib'
import { memo, useEffect, useState } from 'react'
import { Alert, AppState, Linking, TouchableOpacity, View } from 'react-native'
import { Text } from '../Text'
import { useStyles } from './useStyles'

export const NotificationSettings = memo(() => {
  const styles = useStyles()
  const { t } = useTranslation()

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
        Alert.alert(t('notifications.permissionGranted'), t('notifications.notificationsEnabled'))
      } else {
        Alert.alert(t('notifications.permissionDenied'), t('notifications.notificationsDisabled'))
      }
    } catch (error) {
      console.error('Failed to request permission:', error)
      Alert.alert(t('support.error'), t('notifications.failedToRequest'))
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
      Alert.alert(t('support.error'), t('notifications.failedToOpenSettings'))
    }
  })

  const getStatusIcon = useEvent((status: boolean) => (status ? '✅' : '❌'))
  const getStatusText = useEvent((status: boolean) => (status ? t('notifications.enabled') : t('notifications.disabled')))

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          {t('notificationSettings.loading')}
        </Text>
      </View>
    )
  }

  return (
    <>
      {/* Статус разрешений */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notificationSettings.permissionStatus')}</Text>

        <View style={styles.statusItem}>
          <View style={styles.statusContent}>
            <Text style={styles.statusIcon}>{getStatusIcon(hasPermission)}</Text>
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>
                {t('notificationSettings.mainNotifications')}
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
              <Text style={styles.actionButtonText}>{t('notificationSettings.enable')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statusItem}>
          <View style={styles.statusContent}>
            <Text style={styles.statusIcon}>{getStatusIcon(canScheduleAlarms)}</Text>
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>
                {t('notificationSettings.exactAlarms')}
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
              <Text style={styles.actionButtonText}>{t('notificationSettings.configure')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Настройки приложения */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notificationSettings.appSettings')}</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={openAppSettings}
        >
          <View style={styles.menuItemContent}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>
                {t('notificationSettings.openAppSettings')}
              </Text>
              <Text style={styles.menuDescription}>
                {t('notificationSettings.appSettingsDesc')}
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Информация */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>{t('notificationSettings.aboutNotifications')}</Text>
        <Text style={styles.infoText}>
          {t('notificationSettings.aboutNotificationsText')}
        </Text>
      </View>
    </>
  )
})