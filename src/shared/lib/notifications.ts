import notifee, {
  AndroidImportance,
  TriggerType
} from '@notifee/react-native'
import { Platform, Alert, Linking } from 'react-native'
import { Medicine, MedicineStock } from '@/entities/medicine/model/types'

import { MedicineKit } from '@/entities/kit/model/types'

class NotificationService {
  // Канал по умолчанию для мгновенных уведомлений
  private defaultChannelId = 'medicine-general'
  // Канал для напоминаний списка покупок
  private shoppingListChannelId = 'shopping-list-reminders'

  /**
   * Инициализация сервиса уведомлений
   * @returns {Promise<void>} Promise
   */
  async init(): Promise<void> {
    if (Platform.OS === 'android') {
      await this.createDefaultChannel()
      await this.createShoppingListChannel()
    }
  }

  /**
   * Создание канала по умолчанию для Android
   * @returns {Promise<void>} Promise
   */
  private async createDefaultChannel(): Promise<void> {
    await notifee.createChannel({
      id: this.defaultChannelId,
      name: 'Общие уведомления',
      description: 'Общие уведомления о лекарствах',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      lightColor: '#3A944E',
    })
  }

  /**
   * Создание канала для напоминаний списка покупок
   * @returns {Promise<void>} Promise
   */
  private async createShoppingListChannel(): Promise<void> {
    await notifee.createChannel({
      id: this.shoppingListChannelId,
      name: 'Напоминания о покупках',
      description: 'Напоминания о необходимости совершить покупки',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      lightColor: '#FF9800',
    })
  }

  /**
   * Создание или обновление канала для конкретной аптечки
   * @param {MedicineKit} kit Данные аптечки
   * @returns {Promise<string>} ID созданного канала
   */
  async createKitChannel(kit: MedicineKit): Promise<string> {
    if (Platform.OS !== 'android') {
      return kit.id
    }

    const channelId = `medicine-kit-${kit.id}`

    await notifee.createChannel({
      id: channelId,
      name: kit.name,
      description: `Уведомления о лекарствах из аптечки "${kit.name}"`,
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      lightColor: '#3A944E',
    })

    return channelId
  }

  /**
   * Удаление канала аптечки
   * @param {string} kitId ID аптечки
   * @returns {Promise<void>} Promise
   */
  async deleteKitChannel(kitId: string): Promise<void> {
    if (Platform.OS !== 'android') {
      return
    }

    const channelId = `medicine-kit-${kitId}`

    try {
      await notifee.deleteChannel(channelId)
    } catch (error) {
      console.error('Failed to delete channel:', error)
    }
  }

  /**
   * Получение ID канала для аптечки
   * @param {string} kitId ID аптечки
   * @returns {string} ID канала
   */
  getKitChannelId(kitId: string): string {
    return `medicine-kit-${kitId}`
  }

  /**
   * Запрос разрешения на отправку уведомлений
   * @returns {Promise<boolean>} Разрешение получено
   */
  async requestPermission(): Promise<boolean> {
    const settings = await notifee.requestPermission()
    return settings.authorizationStatus >= 1 // 1 = authorized
  }

  /**
   * Проверка разрешения на уведомления
   * @returns {Promise<boolean>} Есть разрешение
   */
  async checkPermission(): Promise<boolean> {
    const settings = await notifee.getNotificationSettings()
    return settings.authorizationStatus >= 1
  }

  /**
   * Отображение мгновенного уведомления
   * @param {string} title Заголовок уведомления
   * @param {string} body Текст уведомления
   * @param {any} data Дополнительные данные
   * @returns {Promise<void>} Promise
   */
  async displayNotification(title: string, body: string, data?: any): Promise<void> {
    const hasPermission = await this.checkPermission()
    if (!hasPermission) {
      console.log('No notification permission')
      return
    }

    await notifee.displayNotification({
      title,
      body,
      data,
      android: {
        channelId: this.defaultChannelId,
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_notification',
        color: '#3A944E',
        pressAction: {
          id: 'default',
        },
      },
      ios: {
        sound: 'default',
      },
    })
  }

  /**
   * Планирование одного уведомления о сроке годности лекарства
   * @param {string} notificationId ID уведомления
   * @param {object} options Опции уведомления
   * @param {string} options.title Заголовок
   * @param {string} options.body Текст уведомления
   * @param {Date} options.notificationDate Дата уведомления
   * @param {object} options.data Дополнительные данные
   * @param {string} options.kitId ID аптечки
   * @param {boolean} options.critical Критическое уведомление (для iOS)
   * @returns {Promise<boolean>} Успешно запланировано
   */
  async scheduleNotification(
    notificationId: string,
    options: {
      title: string
      body: string
      notificationDate: Date
      data: any
      kitId: string
      critical?: boolean
    }
  ): Promise<boolean> {
    const { title, body, notificationDate, data, kitId, critical = false } = options
    const hasPermission = await this.checkPermission()
    if (!hasPermission) {
      return false
    }

    const canSchedule = await this.canScheduleExactAlarms()
    if (!canSchedule) {
      console.warn('No SCHEDULE_EXACT_ALARM permission - notifications may not work when app is closed')
    }

    const now = new Date()
    if (notificationDate <= now) {
      return false
    }

    const channelId = this.getKitChannelId(kitId)

    try {
      await notifee.createTriggerNotification(
        {
          id: notificationId,
          title,
          body,
          data,
          android: {
            channelId,
            importance: critical ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
            smallIcon: 'ic_notification',
            color: '#3A944E',
            pressAction: {
              id: 'default',
            },
          },
          ios: {
            sound: 'default',
            critical,
            categoryId: kitId,
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: notificationDate.getTime(),
          alarmManager: {
            allowWhileIdle: true,
          },
        }
      )

      return true
    } catch (error) {
      console.error('Failed to schedule notification:', error)
      return false
    }
  }

  /**
   * Отмена уведомления по ID
   * @param {string} notificationId ID уведомления
   * @returns {Promise<void>} Promise
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await notifee.cancelNotification(notificationId)
    } catch (error) {
      console.error('Failed to cancel notification:', error)
    }
  }

  /**
   * Отмена всех уведомлений для лекарства
   * @param {string} medicineId ID лекарства
   * @returns {Promise<void>} Promise
   */
  async cancelMedicineNotifications(medicineId: string): Promise<void> {
    try {
      const notifications = await notifee.getTriggerNotifications()
      const medicineNotifications = notifications.filter(n => n.notification.data?.medicineId === medicineId)

      for (const notification of medicineNotifications) {
        if (notification.notification.id) {
          await notifee.cancelNotification(notification.notification.id)
        }
      }
    } catch (error) {
      console.error('Failed to cancel medicine notifications:', error)
    }
  }

  /**
   * Отмена уведомлений для конкретного напоминания на сегодня
   * @param {string} reminderId ID напоминания
   * @param {string} scheduledTime Время напоминания (HH:MM)
   * @returns {Promise<void>} Promise
   */
  async cancelTodayReminderNotification(reminderId: string, scheduledTime: string): Promise<void> {
    try {
      const notifications = await notifee.getTriggerNotifications()

      // Ищем уведомление для этого напоминания на сегодня
      for (const item of notifications) {
        const { notification } = item
        const data = notification.data as any

        // Проверяем что это уведомление для нашего напоминания
        if (data?.type === 'reminder' && data?.reminderId === reminderId) {
          // Проверяем время срабатывания
          const trigger = item.trigger as any
          if (trigger?.timestamp) {
            const notifDate = new Date(trigger.timestamp)
            const notifTime = `${String(notifDate.getHours()).padStart(2, '0')}:${String(notifDate.getMinutes()).padStart(2, '0')}`
            const notifDateStr = notifDate.toDateString()
            const todayStr = new Date().toDateString()

            // Если это сегодняшнее уведомление с нужным временем - удаляем
            if (notifDateStr === todayStr && notifTime === scheduledTime) {
              console.log(`🔕 Cancelling notification for reminder ${reminderId} at ${scheduledTime}`)
              if (notification.id) {
                await notifee.cancelNotification(notification.id)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to cancel reminder notification:', error)
    }
  }

  /**
   * Отмена всех уведомлений
   * @returns {Promise<void>} Promise
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await notifee.cancelAllNotifications()
    } catch (error) {
      console.error('Failed to cancel all notifications:', error)
    }
  }

  /**
   * Получение списка запланированных уведомлений
   * @returns {Promise<any[]>} Список уведомлений
   */
  async getTriggerNotifications(): Promise<any[]> {
    try {
      return await notifee.getTriggerNotifications()
    } catch (error) {
      console.error('Failed to get trigger notifications:', error)
      return []
    }
  }


  /**
   * Получение лекарств с истекающим сроком годности
   * @param {Medicine[]} medicines Список лекарств
   * @param {Map<string, MedicineStock>} stocks Карта запасов
   * @param {number} daysThreshold Порог дней
   * @returns {Array} Список истекающих лекарств
   */
  getExpiringMedicines(
    medicines: Medicine[],
    stocks: Map<string, MedicineStock>,
    daysThreshold: number = 30
  ): Array<{ medicine: Medicine; stock: MedicineStock; daysUntilExpiry: number }> {
    const now = new Date()
    const expiringMedicines: Array<{ medicine: Medicine; stock: MedicineStock; daysUntilExpiry: number }> = []

    for (const medicine of medicines) {
      const stock = stocks.get(medicine.id)
      if (stock && stock.expiryDate) {
        const daysUntilExpiry = Math.ceil((stock.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntilExpiry <= daysThreshold && daysUntilExpiry >= 0) {
          expiringMedicines.push({ medicine, stock, daysUntilExpiry })
        }
      }
    }

    return expiringMedicines.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
  }

  /**
   * Проверка ограничений фоновой работы (Battery Optimization)
   * @returns {Promise<boolean>} true если оптимизация включена (плохо для уведомлений)
   */
  async checkBatteryOptimization(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false
    }

    try {
      return await notifee.isBatteryOptimizationEnabled()
    } catch (error) {
      console.error('Failed to check battery optimization:', error)
      return false
    }
  }

  /**
   * Запрос отключения оптимизации батареи с диалогом
   * @returns {Promise<void>} Promise
   */
  async requestBatteryOptimizationExemption(): Promise<void> {
    if (Platform.OS !== 'android') {
      return
    }

    try {
      const isEnabled = await notifee.isBatteryOptimizationEnabled()

      if (isEnabled) {
        Alert.alert(
          'Настройка уведомлений',
          'Для гарантированной доставки уведомлений о лекарствах, пожалуйста, отключите оптимизацию батареи для приложения.',
          [
            {
              text: 'Открыть настройки',
              onPress: async () => {
                await notifee.openBatteryOptimizationSettings()
              },
            },
            {
              text: 'Позже',
              style: 'cancel',
            },
          ]
        )
      }
    } catch (error) {
      console.error('Failed to request battery optimization exemption:', error)
    }
  }

  /**
   * Проверка Power Manager ограничений (для Xiaomi, Huawei и др.)
   * @returns {Promise<void>} Promise
   */
  async checkPowerManagerRestrictions(): Promise<void> {
    if (Platform.OS !== 'android') {
      return
    }

    try {
      const powerManagerInfo = await notifee.getPowerManagerInfo()

      if (powerManagerInfo.activity) {
        Alert.alert(
          'Требуются настройки',
          'Для надежной работы уведомлений, пожалуйста, настройте параметры энергосбережения.\n\n' +
          'Обычно нужно:\n' +
          '• Включить автозапуск\n' +
          '• Отключить ограничения фона\n' +
          '• Добавить в исключения',
          [
            {
              text: 'Открыть настройки',
              onPress: async () => {
                await notifee.openPowerManagerSettings()
              },
            },
            {
              text: 'Позже',
              style: 'cancel',
            },
          ]
        )
      }
    } catch (error) {
      console.error('Failed to check power manager:', error)
    }
  }

  /**
   * Проверка разрешения на точные alarm'ы (Android 12+)
   * @returns {Promise<boolean>} true если разрешение есть
   */
  async canScheduleExactAlarms(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true
    }

    try {
      const settings = await notifee.getNotificationSettings()
      return settings.android.alarm === 1
    } catch (error) {
      console.error('Failed to check exact alarm permission:', error)
      return false
    }
  }

  /**
   * Запрос разрешения на точные alarm'ы (Android 12+)
   * @returns {Promise<void>} Promise
   */
  async requestExactAlarmPermission(): Promise<void> {
    if (Platform.OS !== 'android') {
      return
    }

    try {
      const canSchedule = await this.canScheduleExactAlarms()

      if (!canSchedule) {
        Alert.alert(
          '⚠️ Требуется разрешение',
          'Для точного времени уведомлений необходимо разрешение "Alarms & reminders".\n\n' +
          'Без него уведомления могут задерживаться или не приходить когда приложение закрыто.',
          [
            {
              text: 'Открыть настройки',
              onPress: async () => {
                // Открываем настройки alarm'ов
                await Linking.openSettings()
              },
            },
            {
              text: 'Позже',
              style: 'cancel',
            },
          ]
        )
      }
    } catch (error) {
      console.error('Failed to request exact alarm permission:', error)
    }
  }

  /**
   * Комплексная проверка всех ограничений и предложение настроить
   * Вызывайте при первом запуске или в настройках
   * @returns {Promise<void>} Promise
   */
  async checkAllBackgroundRestrictions(): Promise<void> {
    if (Platform.OS !== 'android') {
      return
    }

    try {
      // 1. Проверяем разрешение на точные alarm'ы (КРИТИЧНО для Android 12+)
      const canScheduleAlarms = await this.canScheduleExactAlarms()
      console.log('🔍 canScheduleExactAlarms:', canScheduleAlarms)

      // 2. Проверяем Battery Optimization
      const batteryOptEnabled = await notifee.isBatteryOptimizationEnabled()
      console.log('🔍 batteryOptEnabled:', batteryOptEnabled)

      // Показываем диалоги по приоритету

      // ПРИОРИТЕТ 1: Exact Alarms (Android 12+) - БЕЗ ЭТОГО НИЧЕГО НЕ РАБОТАЕТ!
      if (!canScheduleAlarms) {
        console.log('🚨 Showing exact alarm permission dialog')
        Alert.alert(
          '🚨 Критично: Разрешение на уведомления',
          'Для работы уведомлений о лекарствах необходимо разрешение "Alarms & reminders".\n\n' +
          'Без него уведомления НЕ будут приходить когда приложение закрыто!',
          [
            {
              text: 'Открыть настройки',
              onPress: async () => {
                await Linking.openSettings()
              },
            },
            {
              text: 'Позже',
              style: 'cancel',
            },
          ]
        )
        return // Сначала это, потом остальное
      }
      console.log('batteryOptEnabled', batteryOptEnabled)

      // ПРИОРИТЕТ 2: Battery Optimization
      if (batteryOptEnabled) {
        // На эмуляторе всегда true, поэтому показываем информационный диалог
        const isEmulator = __DEV__ && batteryOptEnabled
        const title = isEmulator ? 'ℹ️ Информация об эмуляторе' : '⚠️ Настройка уведомлений'
        const message = isEmulator
          ? 'На эмуляторе оптимизация батареи всегда включена.\n\n' +
          'На реальном устройстве рекомендуется отключить оптимизацию для надежной работы уведомлений.'
          : 'Обнаружена оптимизация батареи.\n\n' +
          'Уведомления о лекарствах могут не приходить когда приложение закрыто.\n\n' +
          'Рекомендуем отключить оптимизацию.'

        Alert.alert(
          title,
          message,
          [
            {
              text: 'Открыть настройки',
              onPress: async () => {
                await notifee.openBatteryOptimizationSettings()
              },
            },
            {
              text: 'Позже',
              style: 'cancel',
            },
          ]
        )
      }
    } catch (error) {
      console.error('Failed to check background restrictions:', error)
    }
  }

  /**
   * Тестовое уведомление через 5 секунд (только в режиме разработки)
   * @param {string} kitId ID аптечки
   * @returns {Promise<string | null>} ID уведомления или null
   */
  async sendTestNotification(kitId: string): Promise<string | null> {
    if (!__DEV__) {
      console.log('Test notifications only available in development mode')
      return null
    }

    const testDate = new Date()
    testDate.setSeconds(testDate.getSeconds() + 5)

    const notificationId = `test-notification-${Date.now()}`

    console.log('🔍 Scheduling test notification:', {
      notificationId,
      testDate: testDate.toLocaleString('ru-RU'),
      kitId,
      now: new Date().toLocaleString('ru-RU')
    })

    const success = await this.scheduleNotification(notificationId, {
      title: '🧪 Тестовое уведомление',
      body: 'Это тестовое уведомление придёт через 5 секунд',
      notificationDate: testDate,
      data: {
        type: 'test',
        testId: notificationId,
      },
      kitId,
      critical: false,
    })

    if (success) {
      console.log(`✅ Тестовое уведомление запланировано на ${testDate.toLocaleTimeString('ru-RU')}`)

      // Проверяем что уведомление действительно запланировано
      setTimeout(async () => {
        try {
          const notifications = await this.getTriggerNotifications()
          const testNotification = notifications.find(n => n.notification.id === notificationId)
          console.log('🔍 Test notification status:', testNotification ? 'Found' : 'Not found')
        } catch (error) {
          console.error('❌ Error checking test notification:', error)
        }
      }, 1000)

      return notificationId
    }

    console.log('❌ Не удалось запланировать тестовое уведомление')
    return null
  }

  /**
   * Критическое тестовое уведомление через 3 секунды (только в режиме разработки)
   * @param {string} kitId ID аптечки
   * @returns {Promise<string | null>} ID уведомления или null
   */
  async sendTestCriticalNotification(kitId: string): Promise<string | null> {
    if (!__DEV__) {
      console.log('Test notifications only available in development mode')
      return null
    }

    const testDate = new Date()
    testDate.setSeconds(testDate.getSeconds() + 3)

    const notificationId = `test-critical-${Date.now()}`

    console.log('🔍 Scheduling critical test notification:', {
      notificationId,
      testDate: testDate.toLocaleString('ru-RU'),
      kitId,
      now: new Date().toLocaleString('ru-RU')
    })

    const success = await this.scheduleNotification(notificationId, {
      title: '🚨 Тест: Критическое уведомление',
      body: 'Это критическое тестовое уведомление (с вибрацией)',
      notificationDate: testDate,
      data: {
        type: 'test-critical',
        testId: notificationId,
      },
      kitId,
      critical: true,
    })

    if (success) {
      console.log(`✅ Критическое уведомление запланировано на ${testDate.toLocaleTimeString('ru-RU')}`)

      // Проверяем что уведомление действительно запланировано
      setTimeout(async () => {
        try {
          const notifications = await this.getTriggerNotifications()
          const testNotification = notifications.find(n => n.notification.id === notificationId)
          console.log('🔍 Critical test notification status:', testNotification ? 'Found' : 'Not found')
        } catch (error) {
          console.error('❌ Error checking critical test notification:', error)
        }
      }, 1000)

      return notificationId
    }

    console.log('❌ Не удалось запланировать критическое уведомление')
    return null
  }

  /**
   * Мгновенное тестовое уведомление (только в режиме разработки)
   * @param {string} title Заголовок уведомления
   * @param {string} body Текст уведомления
   * @returns {Promise<void>} Promise
   */
  async sendInstantTestNotification(
    title: string = '⚡ Мгновенное тестовое уведомление',
    body: string = 'Это уведомление пришло сразу'
  ): Promise<void> {
    if (!__DEV__) {
      console.log('Test notifications only available in development mode')
      return
    }

    await this.displayNotification(title, body, {
      type: 'instant-test',
      timestamp: Date.now(),
    })
    console.log('✅ Мгновенное тестовое уведомление отправлено')
  }

  /**
   * Отмена всех тестовых уведомлений (только в режиме разработки)
   * @returns {Promise<void>} Promise
   */
  async cancelAllTestNotifications(): Promise<void> {
    if (!__DEV__) {
      console.log('Test notifications only available in development mode')
      return
    }

    try {
      const notifications = await this.getTriggerNotifications()
      let cancelledCount = 0

      for (const item of notifications) {
        const notificationId = item.notification.id
        const data = item.notification.data as any

        if (notificationId?.includes('test-') || data?.type?.includes('test')) {
          await this.cancelNotification(notificationId!)
          cancelledCount++
        }
      }
      console.log(`✅ Отменено тестовых уведомлений: ${cancelledCount}`)
    } catch (error) {
      console.error('❌ Ошибка при отмене тестовых уведомлений:', error)
    }
  }

  /**
   * Отладка запланированных уведомлений (только в режиме разработки)
   * @returns {Promise<void>} Promise
   */
  async debugScheduledNotifications(): Promise<void> {
    if (!__DEV__) {
      console.log('Debug functions only available in development mode')
      return
    }

    try {
      const notifications = await this.getTriggerNotifications()
      console.log(`\n📋 Запланировано уведомлений: ${notifications.length}\n`)

      notifications.forEach((item, index) => {
        const { notification } = item
        const trigger = item.trigger as any
        const triggerDate = trigger?.timestamp ? new Date(trigger.timestamp) : null

        console.log(`${index + 1}. ${notification.title}`)
        console.log(`   ID: ${notification.id}`)
        console.log(`   Время: ${triggerDate?.toLocaleString('ru-RU') || 'N/A'}`)
        console.log(`   Канал: ${notification.android?.channelId || notification.ios?.categoryId || 'N/A'}`)
        console.log('   Данные:', notification.data)
        console.log('')
      })
    } catch (error) {
      console.error('❌ Ошибка при получении запланированных уведомлений:', error)
    }
  }

  /**
   * Планирование напоминания для списка покупок
   * @param {Date} reminderDate Дата и время напоминания
   * @returns {Promise<boolean>} Успешно запланировано
   */
  async scheduleShoppingListReminder(reminderDate: Date): Promise<boolean> {
    const hasPermission = await this.checkPermission()
    if (!hasPermission) {
      return false
    }

    const canSchedule = await this.canScheduleExactAlarms()
    if (!canSchedule) {
      console.warn('No SCHEDULE_EXACT_ALARM permission - notifications may not work when app is closed')
    }

    const now = new Date()
    if (reminderDate <= now) {
      return false
    }

    const notificationId = 'shopping-list-reminder'

    try {
      // Отменяем предыдущее напоминание если оно есть
      await this.cancelNotification(notificationId)

      await notifee.createTriggerNotification(
        {
          id: notificationId,
          title: '🛒 Напоминание о покупках',
          body: 'Не забудьте купить необходимые товары',
          data: {
            type: 'shopping-list-reminder',
            screen: 'ShoppingList',
          },
          android: {
            channelId: this.shoppingListChannelId,
            importance: AndroidImportance.HIGH,
            smallIcon: 'ic_notification',
            color: '#FF9800',
            pressAction: {
              id: 'default',
            },
          },
          ios: {
            sound: 'default',
            categoryId: 'shopping-list',
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: reminderDate.getTime(),
          alarmManager: {
            allowWhileIdle: true,
          },
        }
      )

      console.log('✅ Напоминание списка покупок запланировано на', reminderDate.toLocaleString('ru-RU'))
      return true
    } catch (error) {
      console.error('Failed to schedule shopping list reminder:', error)
      return false
    }
  }

  /**
   * Отмена напоминания списка покупок
   * @returns {Promise<void>} Promise
   */
  async cancelShoppingListReminder(): Promise<void> {
    try {
      await this.cancelNotification('shopping-list-reminder')
      console.log('✅ Напоминание списка покупок отменено')
    } catch (error) {
      console.error('Failed to cancel shopping list reminder:', error)
    }
  }

  /**
   * Получение текущего запланированного напоминания списка покупок
   * @returns {Promise<Date | null>} Дата напоминания или null
   */
  async getShoppingListReminder(): Promise<Date | null> {
    try {
      const notifications = await this.getTriggerNotifications()
      const shoppingReminder = notifications.find(n => n.notification.id === 'shopping-list-reminder')

      if (shoppingReminder && shoppingReminder.trigger) {
        const trigger = shoppingReminder.trigger as any
        if (trigger.timestamp) {
          return new Date(trigger.timestamp)
        }
      }

      return null
    } catch (error) {
      console.error('Failed to get shopping list reminder:', error)
      return null
    }
  }
}

export const notificationService = new NotificationService()

