import notifee, {
  AndroidImportance,
  TriggerType
} from '@notifee/react-native'
import { Platform, Alert, Linking } from 'react-native'
import { MedicineKit } from '@/services/models'


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
      return String(kit.id ?? '')
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
      // Error handled silently
    }
  }

  /**
   * Получение ID канала для аптечки
   * @param {string} kitId ID аптечки
   * @returns {string} ID канала
   */
  getKitChannelId(kitId: number): string {
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
   * @param {number} options.medicineKitId ID аптечки
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
      medicineKitId: number
      critical?: boolean
    }
  ): Promise<boolean> {
    const { title, body, notificationDate, data, medicineKitId, critical = false } = options

    // Инициализируем сервис (создаем каналы)
    await this.init()

    const hasPermission = await this.checkPermission()
    if (!hasPermission) {
      return false
    }

    await this.canScheduleExactAlarms()

    const now = new Date()
    if (notificationDate <= now) {
      return false
    }

    const channelId = this.getKitChannelId(medicineKitId)

    // Создаем канал, если его нет (для Android)
    if (Platform.OS === 'android') {
      try {
        await notifee.createChannel({
          id: channelId,
          name: `Аптечка ${medicineKitId}`,
          description: `Уведомления о лекарствах из аптечки ${medicineKitId}`,
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
          lightColor: '#3A944E',
        })
      } catch (error) {
        // Channel may already exist
      }
    }

    try {
      const triggerTimestamp = notificationDate.getTime()

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
            categoryId: String(medicineKitId),
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: triggerTimestamp,
          alarmManager: {
            allowWhileIdle: true,
          },
        }
      )

      return true
    } catch (error) {
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
      // Error handled silently
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
      // Error handled silently
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
      const todayStr = new Date().toDateString()
      for (const item of notifications) {
        const { notification } = item
        const data = notification.data as any
        const trigger = item.trigger as any

        // Проверяем что это уведомление для нашего напоминания и есть timestamp
        const isReminderMatch = data?.type === 'reminder' && data?.reminderId === reminderId
        if (isReminderMatch && trigger?.timestamp && notification.id) {
          const notifDate = new Date(trigger.timestamp)
          const notifTime = `${String(notifDate.getHours()).padStart(2, '0')}:${String(notifDate.getMinutes()).padStart(2, '0')}`
          const notifDateStr = notifDate.toDateString()

          // Если это сегодняшнее уведомление с нужным временем - удаляем
          if (notifDateStr === todayStr && notifTime === scheduledTime) {
            await notifee.cancelNotification(notification.id)
          }
        }
      }
    } catch (error) {
      // Error handled silently
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
      // Error handled silently
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
      return []
    }
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
      // Просто открываем настройки без алерта
      await notifee.openBatteryOptimizationSettings()
    } catch (error) {
      // Error handled silently
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
        // Просто открываем настройки без алерта
        await notifee.openPowerManagerSettings()
      }
    } catch (error) {
      // Error handled silently
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
      // Error handled silently
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

      // Показываем диалоги по приоритету

      // ПРИОРИТЕТ 1: Exact Alarms (Android 12+) - БЕЗ ЭТОГО НИЧЕГО НЕ РАБОТАЕТ!
      if (!canScheduleAlarms) {
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
      }

      // ПРИОРИТЕТ 2: Battery Optimization - Убрали алерт
      // if (batteryOptEnabled) {
      //   // Пользователь может настроить в экране настроек уведомлений
      // }
    } catch (error) {
      // Error handled silently
    }
  }

  /**
   * Показать диалог об эмуляторе после онбординга
   * @returns {Promise<void>} Promise
   */
  async showEmulatorInfoDialog(): Promise<void> {
    // Убрали алерт - пользователь может настроить в экране настроек уведомлений
  }

  /**
   * Тестовое уведомление через 5 секунд (только в режиме разработки)
   * @param {string} kitId ID аптечки
   * @returns {Promise<string | null>} ID уведомления или null
   */
  async sendTestNotification(kitId: string): Promise<string | null> {
    if (!__DEV__) {
      return null
    }

    const testDate = new Date()
    testDate.setSeconds(testDate.getSeconds() + 5)

    const notificationId = `test-notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const success = await this.scheduleNotification(notificationId, {
      title: '🧪 Тестовое уведомление',
      body: 'Это тестовое уведомление придёт через 5 секунд',
      notificationDate: testDate,
      data: {
        type: 'test',
        testId: notificationId,
      },
      medicineKitId: Number(kitId),
      critical: false,
    })

    if (success) {
      return notificationId
    }

    return null
  }

  /**
   * Критическое тестовое уведомление через 3 секунды (только в режиме разработки)
   * @param {string} kitId ID аптечки
   * @returns {Promise<string | null>} ID уведомления или null
   */
  async sendTestCriticalNotification(kitId: string): Promise<string | null> {
    if (!__DEV__) {
      return null
    }

    const testDate = new Date()
    testDate.setSeconds(testDate.getSeconds() + 3)

    const notificationId = `test-critical-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const success = await this.scheduleNotification(notificationId, {
      title: '🚨 Тест: Критическое уведомление',
      body: 'Это критическое тестовое уведомление (с вибрацией)',
      notificationDate: testDate,
      data: {
        type: 'test-critical',
        testId: notificationId,
      },
      medicineKitId: Number(kitId),
      critical: true,
    })

    if (success) {
      return notificationId
    }

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
      return
    }

    await this.displayNotification(title, body, {
      type: 'instant-test',
      timestamp: Date.now(),
    })
  }

  /**
   * Отмена всех тестовых уведомлений (только в режиме разработки)
   * @returns {Promise<void>} Promise
   */
  async cancelAllTestNotifications(): Promise<void> {
    if (!__DEV__) {
      return
    }

    try {
      const notifications = await this.getTriggerNotifications()

      for (const item of notifications) {
        const notificationId = item.notification.id
        const data = item.notification.data as any

        if (notificationId?.includes('test-') || data?.type?.includes('test')) {
          await this.cancelNotification(notificationId!)
        }
      }
    } catch (error) {
      // Error handled silently
    }
  }

  /**
   * Отладка запланированных уведомлений (только в режиме разработки)
   * @returns {Promise<void>} Promise
   */
  async debugScheduledNotifications(): Promise<void> {
    if (!__DEV__) {
      return
    }

    try {
      await this.getTriggerNotifications()
    } catch (error) {
      // Error handled silently
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

    await this.canScheduleExactAlarms()

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

      return true
    } catch (error) {
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
    } catch (error) {
      // Error handled silently
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
      return null
    }
  }
}

export const notificationService = new NotificationService()

