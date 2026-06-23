import dayjs from 'dayjs'
import { calculatePlanAdherence } from './planAdherence'
import { filterUsageByPeriod, type StatisticsPeriod } from './statisticsPeriod'

type ReminderFrequency = 'once' | 'daily' | 'weekly'

interface UsageLike {
  medicineId: number
  usageDate: string
  notes: string | null
}

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

interface CalculatePremiumPeriodDynamicsParams {
  usages: UsageLike[]
  reminders: ReminderLike[]
  reminderMedicines: ReminderMedicineLike[]
  period: StatisticsPeriod
  now?: string | Date
}

interface PremiumPeriodMetric {
  intakes: number
  adherencePercentage: number
  missed: number
}

export interface PremiumPeriodDynamics {
  current: PremiumPeriodMetric
  previous: PremiumPeriodMetric
}

export function calculatePremiumPeriodDynamics(params: CalculatePremiumPeriodDynamicsParams): PremiumPeriodDynamics | null {
  const { usages, reminders, reminderMedicines, period, now = new Date() } = params
  const previousNow = getPreviousPeriodNow(period, now)

  if (!previousNow) {
    return null
  }

  return {
    current: calculatePeriodMetric({ usages, reminders, reminderMedicines, period, now }),
    previous: calculatePeriodMetric({ usages, reminders, reminderMedicines, period, now: previousNow }),
  }
}

function calculatePeriodMetric(params: CalculatePremiumPeriodDynamicsParams): PremiumPeriodMetric {
  const { usages, reminders, reminderMedicines, period, now = new Date() } = params
  const filteredUsages = filterUsageByPeriod(usages, period, now)
  const adherence = calculatePlanAdherence({ reminders, reminderMedicines, usages, period, now })

  return {
    intakes: filteredUsages.length,
    adherencePercentage: adherence.percentage,
    missed: adherence.missed,
  }
}

function getPreviousPeriodNow(period: StatisticsPeriod, now: string | Date): Date | null {
  const currentDate = dayjs(now)

  if (period === 'day') {
    return currentDate.subtract(1, 'day').toDate()
  }

  if (period === 'week') {
    return currentDate.subtract(7, 'day').toDate()
  }

  if (period === 'month') {
    return currentDate.subtract(30, 'day').toDate()
  }

  return null
}
