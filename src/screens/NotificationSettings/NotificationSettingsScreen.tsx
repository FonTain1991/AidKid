import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/app/providers/theme'
import { notificationService } from '@/shared/lib'
import { useEvent } from '@/shared/hooks'

export function NotificationSettingsScreen() {
  const { colors } = useTheme()
  const [hasPermission, setHasPermission] = useState(false)
  const [canScheduleAlarms, setCanScheduleAlarms] = useState(false)
  const [batteryOptimized, setBatteryOptimized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadSettings = useEvent(async () => {
    try {
      setIsLoading(true)

      const permission = await notificationService.checkPermission()
      const canSchedule = await notificationService.canScheduleExactAlarms()
      const batteryOpt = await notificationService.checkBatteryOptimization()

      setHasPermission(permission)
      setCanScheduleAlarms(canSchedule)
      setBatteryOptimized(batteryOpt)
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    } finally {
      setIsLoading(false)
    }
  })

  useEffect(() => {
    loadSettings()
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

  const openBatterySettings = useEvent(async () => {
    await notificationService.requestBatteryOptimizationExemption()
  })

  const openAlarmSettings = useEvent(async () => {
    await notificationService.requestExactAlarmPermission()
  })


  const testNotification = useEvent(async () => {
    try {
      await notificationService.displayNotification(
        '🧪 Тестовое уведомление',
        'Если вы видите это сообщение, уведомления работают корректно!',
        { type: 'test', timestamp: Date.now() }
      )
      Alert.alert('✅ Тест отправлен', 'Проверьте уведомления')
    } catch (error) {
      console.error('Failed to send test notification:', error)
      Alert.alert('Ошибка', 'Не удалось отправить тестовое уведомление')
    }
  })

  const testScheduledNotification = useEvent(async () => {
    try {
      const kitId = 'test-kit' // Используем тестовый ID
      const notificationId = await notificationService.sendTestNotification(kitId)
      if (notificationId) {
        Alert.alert(
          '✅ Тест запланирован',
          'Уведомление придёт через 5 секунд\n\n' +
          'Попробуйте:\n' +
          '• Свернуть приложение\n' +
          '• Закрыть приложение\n' +
          '• Проверить настройки батареи'
        )
      } else {
        Alert.alert('❌ Ошибка', 'Не удалось запланировать тестовое уведомление')
      }
    } catch (error) {
      console.error('Failed to send scheduled test notification:', error)
      Alert.alert('Ошибка', 'Не удалось отправить запланированное уведомление')
    }
  })

  const testCriticalNotification = useEvent(async () => {
    try {
      const kitId = 'test-kit' // Используем тестовый ID
      const notificationId = await notificationService.sendTestCriticalNotification(kitId)
      if (notificationId) {
        Alert.alert(
          '✅ Критический тест запланирован',
          'Уведомление придёт через 3 секунды\n\n' +
          'Попробуйте:\n' +
          '• Свернуть приложение\n' +
          '• Закрыть приложение\n' +
          '• Проверить настройки батареи'
        )
      } else {
        Alert.alert('❌ Ошибка', 'Не удалось запланировать критическое уведомление')
      }
    } catch (error) {
      console.error('Failed to send critical test notification:', error)
      Alert.alert('Ошибка', 'Не удалось отправить критическое уведомление')
    }
  })

  const cancelAllTests = useEvent(async () => {
    try {
      await notificationService.cancelAllTestNotifications()
      Alert.alert('✅ Тесты отменены', 'Все тестовые уведомления отменены')
    } catch (error) {
      console.error('Failed to cancel test notifications:', error)
      Alert.alert('Ошибка', 'Не удалось отменить тестовые уведомления')
    }
  })

  const debugScheduled = useEvent(async () => {
    try {
      await notificationService.debugScheduledNotifications()
      Alert.alert('🔍 Отладка', 'Информация о запланированных уведомлениях выведена в консоль')
    } catch (error) {
      console.error('Failed to debug notifications:', error)
      Alert.alert('Ошибка', 'Не удалось получить информацию об уведомлениях')
    }
  })

  const openAppSettings = useEvent(async () => {
    try {
      const { Linking } = require('react-native')
      await Linking.openSettings()
    } catch (error) {
      console.error('Failed to open app settings:', error)
      Alert.alert('Ошибка', 'Не удалось открыть настройки приложения')
    }
  })

  const getStatusIcon = (status: boolean) => status ? '✅' : '❌'
  const getStatusText = (status: boolean) => status ? 'Включено' : 'Отключено'

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Загрузка настроек...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Настройки уведомлений</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Управление уведомлениями о лекарствах
          </Text>
        </View>

        {/* Статус разрешений */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Статус разрешений</Text>

          <View style={[styles.statusItem, { borderBottomColor: colors.border }]}>
            <View style={styles.statusContent}>
              <Text style={styles.statusIcon}>{getStatusIcon(hasPermission)}</Text>
              <View style={styles.statusText}>
                <Text style={[styles.statusTitle, { color: colors.text }]}>
                  Основные уведомления
                </Text>
                <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
                  {getStatusText(hasPermission)}
                </Text>
              </View>
            </View>
            {!hasPermission && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={requestPermission}
              >
                <Text style={styles.actionButtonText}>Включить</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.statusItem, { borderBottomColor: colors.border }]}>
            <View style={styles.statusContent}>
              <Text style={styles.statusIcon}>{getStatusIcon(canScheduleAlarms)}</Text>
              <View style={styles.statusText}>
                <Text style={[styles.statusTitle, { color: colors.text }]}>
                  Точные уведомления (Android 12+)
                </Text>
                <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
                  {getStatusText(canScheduleAlarms)}
                </Text>
              </View>
            </View>
            {!canScheduleAlarms && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={openAlarmSettings}
              >
                <Text style={styles.actionButtonText}>Настроить</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.statusItem}>
            <View style={styles.statusContent}>
              <Text style={styles.statusIcon}>{getStatusIcon(!batteryOptimized)}</Text>
              <View style={styles.statusText}>
                <Text style={[styles.statusTitle, { color: colors.text }]}>
                  Оптимизация батареи
                </Text>
                <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
                  {batteryOptimized ? 'Включена (может блокировать)' : 'Отключена'}
                </Text>
              </View>
            </View>
            {batteryOptimized && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.warning }]}
                onPress={openBatterySettings}
              >
                <Text style={styles.actionButtonText}>Отключить</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>


        {/* Тестирование - только в режиме разработки */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Тестирование (DEV)</Text>

            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: colors.primary }]}
              onPress={testNotification}
            >
              <Text style={styles.testButtonText}>⚡ Мгновенное уведомление</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: colors.secondary, marginTop: 12 }]}
              onPress={testScheduledNotification}
            >
              <Text style={styles.testButtonText}>⏰ Запланированное (5 сек)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: colors.warning, marginTop: 12 }]}
              onPress={testCriticalNotification}
            >
              <Text style={styles.testButtonText}>🚨 Критическое (3 сек)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: colors.error, marginTop: 12 }]}
              onPress={cancelAllTests}
            >
              <Text style={styles.testButtonText}>❌ Отменить все тесты</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: colors.info, marginTop: 12 }]}
              onPress={debugScheduled}
            >
              <Text style={styles.testButtonText}>🔍 Показать запланированные</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Настройки приложения */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Настройки приложения</Text>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={openAppSettings}
          >
            <View style={styles.menuItemContent}>
              <Text style={styles.menuIcon}>⚙️</Text>
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  Открыть настройки приложения
                </Text>
                <Text style={[styles.menuDescription, { color: colors.textSecondary }]}>
                  Системные настройки уведомлений и разрешений
                </Text>
              </View>
              <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Информация */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>О уведомлениях</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Уведомления приходят за 30, 14, 7, 3, 2, 1 день до истечения срока годности{'\n'}
            • Критические уведомления приходят в день истечения и после{'\n'}
            • Для надежной работы отключите оптимизацию батареи{'\n'}
            • На Android 12+ требуется разрешение "Alarms & reminders"
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusDescription: {
    fontSize: 14,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  menuItem: {
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 14,
  },
  menuArrow: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  testButton: {
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
})
