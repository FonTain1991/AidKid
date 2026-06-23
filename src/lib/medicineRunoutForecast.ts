import dayjs from 'dayjs'
import type { StatisticsPeriod } from './statisticsPeriod'
import { getUsageUnitValue } from './usageUnit'

interface UsageLike {
  medicineId: number
  quantityUsed: number
  usageDate: string
}

interface MedicineLike {
  id?: number | null
  name: string
  quantity?: number | null
  unitForQuantity?: string | null
  unit?: string | null
}

interface CalculateMedicineRunoutForecastParams {
  usages: UsageLike[]
  medicines: MedicineLike[]
  period: StatisticsPeriod
  now?: string | Date
  unknownMedicineName: string
  limit?: number
}

export interface MedicineRunoutForecastItem {
  medicineId: number
  medicineName: string
  daysLeft: number
  unitValue: string
}

export function calculateMedicineRunoutForecast(params: CalculateMedicineRunoutForecastParams): MedicineRunoutForecastItem[] {
  const { usages, medicines, period, now = new Date(), unknownMedicineName, limit = 5 } = params
  const periodDays = getPeriodDays(usages, period, now)
  const quantitiesByMedicineId = usages.reduce<Record<number, number>>((acc, usage) => {
    acc[usage.medicineId] = (acc[usage.medicineId] || 0) + usage.quantityUsed
    return acc
  }, {})

  return Object.entries(quantitiesByMedicineId)
    .map(([medicineId, consumedQuantity]) => {
      const medicine = medicines.find(item => item.id === Number(medicineId))
      const stockQuantity = medicine?.quantity || 0
      const averageDailyConsumption = consumedQuantity / periodDays

      if (stockQuantity <= 0 || averageDailyConsumption <= 0) {
        return null
      }

      return {
        medicineId: Number(medicineId),
        medicineName: medicine?.name || unknownMedicineName,
        daysLeft: Math.ceil(stockQuantity / averageDailyConsumption),
        unitValue: getUsageUnitValue(medicine),
      }
    })
    .filter((item): item is MedicineRunoutForecastItem => item !== null)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, limit)
}

function getPeriodDays(usages: UsageLike[], period: StatisticsPeriod, now: string | Date): number {
  if (period === 'day') {
    return 1
  }

  if (period === 'week') {
    return 7
  }

  if (period === 'month') {
    return 30
  }

  const currentDate = dayjs(now)
  const earliestUsageDate = usages.reduce<dayjs.Dayjs | null>((earliest, usage) => {
    const usageDate = dayjs(usage.usageDate)
    return !earliest || usageDate.isBefore(earliest) ? usageDate : earliest
  }, null)

  return Math.max(1, Math.ceil(currentDate.diff(earliestUsageDate || currentDate, 'day', true)))
}
