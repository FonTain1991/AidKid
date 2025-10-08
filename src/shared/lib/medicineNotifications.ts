import { Medicine, MedicineStock } from '@/entities/medicine/model/types'
import { notificationService } from './notifications'

/**
 * Планирование множественных уведомлений о сроке годности лекарства
 * Напоминания: за 30, 14, 7, 3, 2, 1 день и каждый день после истечения (7 дней)
 * @param {Medicine} medicine Данные лекарства
 * @param {MedicineStock} stock Запас лекарства
 * @returns {Promise<string[]>} Массив ID запланированных уведомлений
 */
export async function scheduleMedicineExpiryNotifications(
  medicine: Medicine,
  stock: MedicineStock
): Promise<string[]> {
  if (!stock.expiryDate) {
    return []
  }

  const expiryDate = new Date(stock.expiryDate)
  const notificationIds: string[] = []
  const { kitId } = medicine

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
  for (const schedule of schedules) {
    const notificationDate = new Date(expiryDate)
    notificationDate.setDate(notificationDate.getDate() - schedule.days)

    const notificationId = `medicine-expiry-${medicine.id}-${stock.id}-${schedule.days}d`
    const daysText = schedule.days === 1 ? 'день' : schedule.days < 5 ? 'дня' : 'дней'

    const success = await notificationService.scheduleNotification(notificationId, {
      title: `${schedule.emoji} ${schedule.title}`,
      body: `${medicine.name} истекает через ${schedule.days} ${daysText} (${expiryDate.toLocaleDateString('ru-RU')})`,
      notificationDate,
      data: {
        medicineId: medicine.id,
        stockId: stock.id,
        kitId,
        type: 'expiry',
        daysBeforeExpiry: schedule.days,
      },
      kitId,
      critical: schedule.critical,
    })

    if (success) {
      notificationIds.push(notificationId)
    }
  }

  // Планируем уведомления после истечения (каждый день в течение 7 дней)
  for (let dayAfter = 0; dayAfter <= 7; dayAfter++) {
    const notificationDate = new Date(expiryDate)
    notificationDate.setDate(notificationDate.getDate() + dayAfter)
    notificationDate.setHours(10, 0, 0, 0) // в 10:00 утра

    const notificationId = `medicine-expired-${medicine.id}-${stock.id}-${dayAfter}d`
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
        stockId: stock.id,
        kitId,
        type: 'expired',
        daysAfterExpiry: dayAfter,
      },
      kitId,
      critical: true, // критическое уведомление для iOS
    })

    if (success) {
      notificationIds.push(notificationId)
    }
  }

  return notificationIds
}

/**
 * Отмена всех уведомлений для конкретного лекарства
 * @param {string} medicineId ID лекарства
 * @param {string} stockId ID запаса
 * @returns {Promise<void>} Promise
 */
export async function cancelMedicineNotifications(
  medicineId: string,
  stockId: string
): Promise<void> {
  // Отменяем уведомления до истечения
  const daysSchedule = [30, 14, 7, 3, 2, 1]
  for (const days of daysSchedule) {
    const notificationId = `medicine-expiry-${medicineId}-${stockId}-${days}d`
    await notificationService.cancelNotification(notificationId)
  }

  // Отменяем уведомления после истечения
  for (let dayAfter = 0; dayAfter <= 7; dayAfter++) {
    const notificationId = `medicine-expired-${medicineId}-${stockId}-${dayAfter}d`
    await notificationService.cancelNotification(notificationId)
  }
}

