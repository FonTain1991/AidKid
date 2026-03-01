/* eslint-disable no-await-in-loop */
import i18n from '@/i18n'
import { Medicine } from '@/services/models'
import { notificationService } from './notifications'

/**
 * Планирование множественных уведомлений о сроке годности лекарства
 * Напоминания: за 30, 14, 7, 3, 2, 1 день и каждый день после истечения (7 дней)
 * @param {Medicine} medicine Данные лекарства
 * @returns {Promise<string[]>} Массив ID запланированных уведомлений
 */
export async function scheduleMedicineExpiryNotifications(medicine: Medicine,): Promise<string[]> {
  if (!medicine.expirationDate) {
    return []
  }

  const expiryDate = new Date(medicine.expirationDate)
  const notificationIds: string[] = []
  const { medicineKitId } = medicine

  // Расписание уведомлений: за сколько дней до истечения
  const schedules = [
    { days: 30, emoji: '📅', titleKey: 'notifications.expiryReminder', critical: false },
    { days: 14, emoji: '⏰', titleKey: 'notifications.expiryReminder', critical: false },
    { days: 7, emoji: '⚠️', titleKey: 'notifications.expiryWarning', critical: false },
    { days: 3, emoji: '⚠️', titleKey: 'notifications.expiryWarning', critical: false },
    { days: 2, emoji: '🔴', titleKey: 'notifications.expiryUrgent', critical: false },
    { days: 1, emoji: '🔴', titleKey: 'notifications.expiryTomorrow', critical: false },
  ]

  // Планируем уведомления до истечения
  const now = new Date()
  for (const schedule of schedules) {
    const notificationDate = new Date(expiryDate)
    notificationDate.setDate(notificationDate.getDate() - schedule.days)

    // Пропускаем уведомления, дата которых уже прошла
    if (notificationDate > now) {
      const notificationId = `medicine-expiry-${medicine.id}-${schedule.days}d`
      const daysText = i18n.t('expiry.days', { count: schedule.days })
      const dateStr = expiryDate.toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US')

      const success = await notificationService.scheduleNotification(notificationId, {
        title: `${schedule.emoji} ${i18n.t(schedule.titleKey)}`,
        body: i18n.t('expiry.expiresIn', {
          name: medicine.name,
          count: schedule.days,
          days: daysText,
          date: dateStr,
        }),
        notificationDate,
        data: {
          medicineId: medicine.id,
          medicineKitId,
          type: 'expiry',
          daysBeforeExpiry: schedule.days,
        },
        medicineKitId: Number(medicineKitId),
        critical: schedule.critical,
      })

      if (success) {
        notificationIds.push(notificationId)
      }
    }
  }

  // Планируем уведомления после истечения (каждый день в течение 7 дней)
  const oneDayAgo = new Date(now)
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)

  for (let dayAfter = 0; dayAfter <= 7; dayAfter++) {
    const notificationDate = new Date(expiryDate)
    notificationDate.setDate(notificationDate.getDate() + dayAfter)
    notificationDate.setHours(10, 0, 0, 0) // в 10:00 утра

    // Пропускаем уведомления, дата которых уже прошла более чем на 1 день
    // (оставляем только те, что сегодня или в будущем)
    if (notificationDate >= oneDayAgo) {
      const notificationId = `medicine-expired-${medicine.id}-${medicineKitId}-${dayAfter}d`
      const title = dayAfter === 0
        ? `🚨 ${i18n.t('notifications.expiredTitle')}`
        : `🚨 ${i18n.t('notifications.expiredMedicineTitle')}`
      const daysText = i18n.t('expiry.days', { count: dayAfter })
      const body = dayAfter === 0
        ? i18n.t('expiry.expiredToday', { name: medicine.name })
        : i18n.t('expiry.expiredDaysAgo', { name: medicine.name, count: dayAfter, days: daysText })

      const success = await notificationService.scheduleNotification(notificationId, {
        title,
        body,
        notificationDate,
        data: {
          medicineId: medicine.id,
          medicineKitId,
          type: 'expired',
          daysAfterExpiry: dayAfter,
        },
        medicineKitId: Number(medicineKitId),
        critical: true, // критическое уведомление для iOS
      })

      if (success) {
        notificationIds.push(notificationId)
      }
    }
  }

  return notificationIds
}

/**
 * Отмена всех уведомлений для конкретного лекарства
 * @param {number} medicineId ID лекарства
 * @param {number} medicineKitId ID аптечки
 * @returns {Promise<void>} Promise
 */
export async function cancelMedicineNotifications(
  medicineId: number,
  medicineKitId: number
): Promise<void> {
  // Отменяем уведомления до истечения
  // ВАЖНО: формат ID должен совпадать с форматом в scheduleMedicineExpiryNotifications
  const daysSchedule = [30, 14, 7, 3, 2, 1]
  for (const days of daysSchedule) {
    // Формат: medicine-expiry-${medicine.id}-${schedule.days}d (без medicineKitId)
    const notificationId = `medicine-expiry-${medicineId}-${days}d`
    await notificationService.cancelNotification(notificationId)
  }

  // Отменяем уведомления после истечения
  // Формат: medicine-expired-${medicine.id}-${medicineKitId}-${dayAfter}d
  for (let dayAfter = 0; dayAfter <= 7; dayAfter++) {
    const notificationId = `medicine-expired-${medicineId}-${medicineKitId}-${dayAfter}d`
    await notificationService.cancelNotification(notificationId)
  }
}

