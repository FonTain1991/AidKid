import dayjs from 'dayjs'
import type { StatisticsPeriod } from './statisticsPeriod'

type ReminderFrequency = 'once' | 'daily' | 'weekly'

interface ReminderLike {
  id?: number | null
  frequency: ReminderFrequency
  time: string
  isActive: boolean
  createdAt?: number
  daysCount?: number | null
}

interface ReminderMedicineLike {
  reminderId?: number | null
  medicineId?: number | null
}

interface UsageLike {
  medicineId: number
  usageDate: string
  notes: string | null
}

interface MedicineLike {
  id?: number | null
  name: string
}

interface CalculateMissedMedicineStatsParams {
  reminders: ReminderLike[]
  reminderMedicines: ReminderMedicineLike[]
  usages: UsageLike[]
  medicines: MedicineLike[]
  period: StatisticsPeriod
  now?: string | Date
  unknownMedicineName: string
  limit?: number
}

interface ReminderTime {
  hour: number
  minute: number
}

type ScheduledUsageIndex = Map<string, Set<number>>

interface ScheduledUsageEntry {
  date: dayjs.Dayjs
  time: string
  medicineIds: Set<number>
}

export interface MissedMedicineStatItem {
  medicineId: number
  medicineName: string
  missed: number
}

export function calculateMissedMedicineStats(params: CalculateMissedMedicineStatsParams): MissedMedicineStatItem[] {
  const { reminders, reminderMedicines, usages, medicines, period, now = new Date(), unknownMedicineName, limit = 5 } = params
  const currentDate = dayjs(now)
  const { startDate, endDate } = getPeriodBounds(period, currentDate, reminders)
  const medicinesByReminderId = buildMedicinesByReminderId(reminderMedicines)
  const scheduledUsageIndex = buildScheduledUsageIndex(usages)
  const scheduledUsageEntries = buildScheduledUsageEntries(scheduledUsageIndex)
  const missedByMedicineId = new Map<number, number>()

  for (const reminder of reminders) {
    countReminderMisses({
      reminder,
      medicinesByReminderId,
      scheduledUsageEntries,
      currentDate,
      startDate,
      endDate,
      missedByMedicineId,
    })
  }

  return Array.from(missedByMedicineId.entries())
    .filter(([, missed]) => missed > 0)
    .map(([medicineId, missed]) => {
      const medicine = medicines.find(item => item.id === medicineId)

      return {
        medicineId,
        medicineName: medicine?.name || unknownMedicineName,
        missed,
      }
    })
    .sort((a, b) => b.missed - a.missed)
    .slice(0, limit)
}

function countReminderMisses(params: {
  reminder: ReminderLike
  medicinesByReminderId: Map<number, number[]>
  scheduledUsageEntries: ScheduledUsageEntry[]
  currentDate: dayjs.Dayjs
  startDate: dayjs.Dayjs
  endDate: dayjs.Dayjs
  missedByMedicineId: Map<number, number>
}) {
  const { reminder, medicinesByReminderId, scheduledUsageEntries, currentDate, startDate, endDate, missedByMedicineId } = params

  if (!reminder.id || !reminder.isActive) {
    return
  }

  const medicineIds = medicinesByReminderId.get(reminder.id) || []
  if (medicineIds.length === 0) {
    return
  }

  const reminderCreatedAt = dayjs(reminder.createdAt || currentDate)
  const reminderEndDate = getReminderEndDate(reminder, reminderCreatedAt)
  const times = parseReminderTimes(reminder.time)
  const plannedCount = countPlannedScheduledTimes({ reminder, reminderCreatedAt, reminderEndDate, startDate, endDate, times })

  for (const medicineId of medicineIds) {
    missedByMedicineId.set(medicineId, (missedByMedicineId.get(medicineId) || 0) + plannedCount)
  }

  const completedByMedicineId = countCompletedMedicines({ reminder, reminderCreatedAt, reminderEndDate, scheduledUsageEntries, medicineIds, startDate, endDate, times })

  for (const [medicineId, completed] of completedByMedicineId.entries()) {
    missedByMedicineId.set(medicineId, Math.max(0, (missedByMedicineId.get(medicineId) || 0) - completed))
  }
}

function countCompletedMedicines(params: {
  reminder: ReminderLike
  reminderCreatedAt: dayjs.Dayjs
  reminderEndDate: dayjs.Dayjs
  scheduledUsageEntries: ScheduledUsageEntry[]
  medicineIds: number[]
  startDate: dayjs.Dayjs
  endDate: dayjs.Dayjs
  times: ReminderTime[]
}): Map<number, number> {
  const { reminder, reminderCreatedAt, reminderEndDate, scheduledUsageEntries, medicineIds, startDate, endDate, times } = params
  const scheduledTimes = new Set(times.map(formatReminderTime))
  const reminderMedicineIds = new Set(medicineIds)
  const completedByMedicineId = new Map<number, number>()

  for (const entry of scheduledUsageEntries) {
    const isRelevantEntry = scheduledTimes.has(entry.time) &&
      !entry.date.isBefore(startDate, 'day') &&
      !entry.date.isAfter(endDate, 'day') &&
      !entry.date.isBefore(reminderCreatedAt, 'day') &&
      !entry.date.isAfter(reminderEndDate, 'day') &&
      isReminderScheduledForDate(reminder, entry.date)

    if (isRelevantEntry) {
      for (const medicineId of entry.medicineIds) {
        if (reminderMedicineIds.has(medicineId)) {
          completedByMedicineId.set(medicineId, (completedByMedicineId.get(medicineId) || 0) + 1)
        }
      }
    }
  }

  return completedByMedicineId
}

function countPlannedScheduledTimes(params: {
  reminder: ReminderLike
  reminderCreatedAt: dayjs.Dayjs
  reminderEndDate: dayjs.Dayjs
  startDate: dayjs.Dayjs
  endDate: dayjs.Dayjs
  times: ReminderTime[]
}): number {
  const { reminder, reminderCreatedAt, reminderEndDate, startDate, endDate, times } = params
  const rangeStart = maxDayjs(startDate, reminderCreatedAt)
  const rangeEnd = minDayjs(endDate, reminderEndDate)

  if (rangeStart.isAfter(rangeEnd, 'day')) {
    return 0
  }

  if (reminder.frequency === 'once') {
    return reminderCreatedAt.isBefore(startDate, 'day') || reminderCreatedAt.isAfter(endDate, 'day') ? 0 : times.length
  }

  if (reminder.frequency === 'weekly') {
    return countWeekdaysInRange(rangeStart, rangeEnd, reminderCreatedAt.day()) * times.length
  }

  return countDaysInRange(rangeStart, rangeEnd) * times.length
}

function getPeriodBounds(period: StatisticsPeriod, now: dayjs.Dayjs, reminders: ReminderLike[]) {
  const endDate = now.endOf('day')

  if (period === 'all') {
    const firstReminderDate = reminders.reduce<dayjs.Dayjs | null>((earliest, reminder) => {
      if (!reminder.createdAt) {
        return earliest
      }

      const createdAt = dayjs(reminder.createdAt)
      return !earliest || createdAt.isBefore(earliest) ? createdAt : earliest
    }, null)

    return {
      startDate: (firstReminderDate || now).startOf('day'),
      endDate,
    }
  }

  return {
    startDate: {
      day: now.startOf('day'),
      week: now.subtract(6, 'day').startOf('day'),
      month: now.subtract(29, 'day').startOf('day'),
    }[period],
    endDate,
  }
}

function buildMedicinesByReminderId(reminderMedicines: ReminderMedicineLike[]): Map<number, number[]> {
  const medicinesByReminderId = new Map<number, number[]>()

  for (const item of reminderMedicines) {
    if (item.reminderId && item.medicineId) {
      const medicineIds = medicinesByReminderId.get(item.reminderId) || []
      medicinesByReminderId.set(item.reminderId, [...medicineIds, item.medicineId])
    }
  }

  return medicinesByReminderId
}

function buildScheduledUsageIndex(usages: UsageLike[]): ScheduledUsageIndex {
  const scheduledUsageIndex: ScheduledUsageIndex = new Map()

  for (const usage of usages) {
    const scheduledTime = getScheduledTimeFromNotes(usage.notes)

    if (scheduledTime) {
      const indexKey = getScheduledUsageIndexKey(dayjs(usage.usageDate), scheduledTime)
      const medicineIds = scheduledUsageIndex.get(indexKey) || new Set<number>()
      medicineIds.add(usage.medicineId)
      scheduledUsageIndex.set(indexKey, medicineIds)
    }
  }

  return scheduledUsageIndex
}

function buildScheduledUsageEntries(scheduledUsageIndex: ScheduledUsageIndex): ScheduledUsageEntry[] {
  return Array.from(scheduledUsageIndex.entries()).map(([key, medicineIds]) => {
    const [date, time] = key.split('|')

    return {
      date: dayjs(date),
      time,
      medicineIds,
    }
  })
}

function getScheduledTimeFromNotes(notes: string | null): string | null {
  const match = notes?.match(/(?:Scheduled intake at|Запланированный прием в) (?<time>\d{2}:\d{2})/)
  return match?.groups?.time || null
}

function parseReminderTimes(time: string): ReminderTime[] {
  try {
    const times = JSON.parse(time || '[]')
    return Array.isArray(times) ? times : []
  } catch {
    return []
  }
}

function formatReminderTime(time: ReminderTime): string {
  return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`
}

function countDaysInRange(startDate: dayjs.Dayjs, endDate: dayjs.Dayjs): number {
  return Math.max(0, endDate.startOf('day').diff(startDate.startOf('day'), 'day') + 1)
}

function countWeekdaysInRange(startDate: dayjs.Dayjs, endDate: dayjs.Dayjs, weekday: number): number {
  const daysCount = countDaysInRange(startDate, endDate)
  const offset = (weekday - startDate.day() + 7) % 7

  if (offset >= daysCount) {
    return 0
  }

  return Math.floor((daysCount - 1 - offset) / 7) + 1
}

function maxDayjs(first: dayjs.Dayjs, second: dayjs.Dayjs): dayjs.Dayjs {
  return first.isAfter(second) ? first : second
}

function minDayjs(first: dayjs.Dayjs, second: dayjs.Dayjs): dayjs.Dayjs {
  return first.isBefore(second) ? first : second
}

function getReminderEndDate(reminder: ReminderLike, startDate: dayjs.Dayjs): dayjs.Dayjs {
  if (!reminder.daysCount || reminder.daysCount <= 0) {
    return dayjs('9999-12-31')
  }

  return startDate.add(reminder.daysCount - 1, 'day').endOf('day')
}

function isReminderScheduledForDate(reminder: ReminderLike, date: dayjs.Dayjs): boolean {
  const createdAt = dayjs(reminder.createdAt || date)

  if (reminder.frequency === 'daily') {
    return true
  }

  if (reminder.frequency === 'weekly') {
    return createdAt.day() === date.day()
  }

  return createdAt.isSame(date, 'day')
}

function getScheduledUsageIndexKey(date: dayjs.Dayjs, time: string): string {
  return `${date.format('YYYY-MM-DD')}|${time}`
}
