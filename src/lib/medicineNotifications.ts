/* eslint-disable no-await-in-loop */
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
    { days: 30, emoji: '📅', title: 'Напоминание о сроке годности', critical: false },
    { days: 14, emoji: '⏰', title: 'Напоминание о сроке годности', critical: false },
    { days: 7, emoji: '⚠️', title: 'Внимание! Скоро истекает срок годности', critical: false },
    { days: 3, emoji: '⚠️', title: 'Внимание! Скоро истекает срок годности', critical: false },
    { days: 2, emoji: '🔴', title: 'Срочно! Истекает срок годности', critical: false },
    { days: 1, emoji: '🔴', title: 'Срочно! Истекает срок годности завтра', critical: false },
  ]

  // Планируем уведомления до истечения
  const now = new Date()
  for (const schedule of schedules) {
    const notificationDate = new Date(expiryDate)
    notificationDate.setDate(notificationDate.getDate() - schedule.days)

    // Пропускаем уведомления, дата которых уже прошла
    if (notificationDate > now) {
      const notificationId = `medicine-expiry-${medicine.id}-${schedule.days}d`
      const daysText = schedule.days === 1 ? 'день' : schedule.days < 5 ? 'дня' : 'дней'

      const success = await notificationService.scheduleNotification(notificationId, {
        title: `${schedule.emoji} ${schedule.title}`,
        body: `${medicine.name} истекает через ${schedule.days} ${daysText} (${expiryDate.toLocaleDateString('ru-RU')})`,
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
      const title = dayAfter === 0 ? '🚨 Срок годности истёк!' : '🚨 Просроченное лекарство!'
      const body = dayAfter === 0
        ? `${medicine.name} - срок годности истёк сегодня!`
        : `${medicine.name} просрочено ${dayAfter} ${dayAfter === 1 ? 'день' : dayAfter < 5 ? 'дня' : 'дней'}. Утилизируйте лекарство!`

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

