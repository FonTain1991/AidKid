import dayjs from 'dayjs'
import type { StatisticsPeriod } from './statisticsPeriod'

type ReminderFrequency = 'once' | 'daily' | 'weekly'

interface ReminderLike {
  id?: number | string | null
  frequency: ReminderFrequency
  time: string
  isActive: boolean
  createdAt?: number
  daysCount?: number | null
}

interface ReminderMedicineLike {
  reminderId?: number | string | null
  medicineId?: number | string | null
}

interface UsageLike {
  medicineId: number | string
  usageDate: string
  notes: string | null
}

interface CalculatePlanAdherenceParams {
  reminders: ReminderLike[]
  reminderMedicines: ReminderMedicineLike[]
  usages: UsageLike[]
  period: StatisticsPeriod
  now?: string | Date
}

export interface PlanAdherence {
  completed: number
  missed: number
  planned: number
  percentage: number
}

interface ReminderTime {
  hour: number
  minute: number
}

interface CountReminderAdherenceParams {
  reminder: ReminderLike
  medicinesByReminderId: Map<number, number[]>
  usages: UsageLike[]
  currentDate: dayjs.Dayjs
  startDate: dayjs.Dayjs
  endDate: dayjs.Dayjs
}

export function calculatePlanAdherence(params: CalculatePlanAdherenceParams): PlanAdherence {
  const { reminders, reminderMedicines, usages, period, now = new Date() } = params
  const currentDate = dayjs(now)
  const { startDate, endDate } = getPeriodBounds(period, currentDate, reminders)
  const medicinesByReminderId = buildMedicinesByReminderId(reminderMedicines)

  let planned = 0
  let completed = 0

  for (const reminder of reminders) {
    const reminderAdherence = countReminderAdherence({
      reminder,
      medicinesByReminderId,
      usages,
      currentDate,
      startDate,
      endDate,
    })

    planned += reminderAdherence.planned
    completed += reminderAdherence.completed
  }

  return {
    completed,
    missed: Math.max(0, planned - completed),
    planned,
    percentage: planned > 0 ? Math.round((completed / planned) * 100) : 0,
  }
}

function countReminderAdherence(params: CountReminderAdherenceParams): PlanAdherence {
  const { reminder, medicinesByReminderId, usages, currentDate, startDate, endDate } = params

  if (!reminder.id || !reminder.isActive) {
    return { completed: 0, missed: 0, planned: 0, percentage: 0 }
  }

  const medicineIds = medicinesByReminderId.get(Number(reminder.id)) || []

  if (medicineIds.length === 0) {
    return { completed: 0, missed: 0, planned: 0, percentage: 0 }
  }

  const reminderCreatedAt = dayjs(reminder.createdAt || currentDate)
  const times = parseReminderTimes(reminder.time)
  const reminderEndDate = getReminderEndDate(reminder, reminderCreatedAt)
  const planned = countPlannedScheduledTimes({ reminder, reminderCreatedAt, reminderEndDate, startDate, endDate, times })
  const completed = countCompletedScheduledTimes({ reminder, reminderCreatedAt, reminderEndDate, usages, medicineIds, startDate, endDate, times })

  return {
    completed,
    missed: Math.max(0, planned - completed),
    planned,
    percentage: planned > 0 ? Math.round((completed / planned) * 100) : 0,
  }
}

function countCompletedScheduledTimes(params: {
  reminder: ReminderLike
  reminderCreatedAt: dayjs.Dayjs
  reminderEndDate: dayjs.Dayjs
  usages: UsageLike[]
  medicineIds: number[]
  startDate: dayjs.Dayjs
  endDate: dayjs.Dayjs
  times: ReminderTime[]
}): number {
  const { reminder, reminderCreatedAt, reminderEndDate, usages, medicineIds, startDate, endDate, times } = params
  const medicineIdSet = new Set(medicineIds.map(Number))
  const scheduledTimes = new Set(times.map(formatReminderTime))
  const completedMedicineIdsBySlot = new Map<string, Set<number>>()

  for (const usage of usages) {
    const usageMedicineId = Number(usage.medicineId)

    if (!medicineIdSet.has(usageMedicineId)) {
      continue
    }

    const usageDate = dayjs(usage.usageDate)
    if (
      usageDate.isBefore(startDate, 'day') ||
      usageDate.isAfter(endDate, 'day') ||
      usageDate.isBefore(reminderCreatedAt, 'day') ||
      usageDate.isAfter(reminderEndDate, 'day') ||
      !isReminderScheduledForDate(reminder, usageDate)
    ) {
      continue
    }

    const scheduledTime = getScheduledTimeFromNotes(usage.notes)
    const slotTime = scheduledTime && scheduledTimes.has(scheduledTime)
      ? scheduledTime
      : findNearestReminderTime(usageDate, times)

    if (!slotTime) {
      continue
    }

    const slotKey = getScheduledSlotKey(usageDate, slotTime)
    const completedMedicineIds = completedMedicineIdsBySlot.get(slotKey) || new Set<number>()
    completedMedicineIds.add(usageMedicineId)
    completedMedicineIdsBySlot.set(slotKey, completedMedicineIds)
  }

  return completedMedicineIdsBySlot.size
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

function buildMedicinesByReminderId(reminderMedicines: ReminderMedicineLike[]): Map<number, number[]> {
  const medicinesByReminderId = new Map<number, number[]>()

  for (const item of reminderMedicines) {
    if (item.reminderId && item.medicineId) {
      const reminderId = Number(item.reminderId)
      const medicineId = Number(item.medicineId)
      const medicineIds = medicinesByReminderId.get(reminderId) || []
      medicinesByReminderId.set(reminderId, [...medicineIds, medicineId])
    }
  }

  return medicinesByReminderId
}

function getScheduledTimeFromNotes(notes: string | null): string | null {
  const match = notes?.match(/(?:Scheduled intake at|Запланированный прием в) (?<time>\d{2}:\d{2})/)
  return match?.groups?.time || null
}

function findNearestReminderTime(usageDate: dayjs.Dayjs, times: ReminderTime[]): string | null {
  const nearestTime = times
    .map(time => ({
      time,
      distance: Math.abs(usageDate.diff(usageDate.hour(time.hour).minute(time.minute).second(0).millisecond(0))),
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.time

  return nearestTime ? formatReminderTime(nearestTime) : null
}

function getScheduledSlotKey(date: dayjs.Dayjs, time: string): string {
  return `${date.format('YYYY-MM-DD')}|${time}`
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

