import dayjs from 'dayjs'
import type { StatisticsPeriod } from './statisticsPeriod'

interface UsageLike {
  usageDate: string
}

interface CalculateActivityHeatmapParams {
  usages: UsageLike[]
  period: StatisticsPeriod
  now?: string | Date
}

export interface ActivityHeatmapDay {
  date: string
  count: number
  level: number
}

export function calculateActivityHeatmap(params: CalculateActivityHeatmapParams): ActivityHeatmapDay[] {
  const { usages, period, now = new Date() } = params
  const daysCount = getHeatmapDaysCount(period)

  if (daysCount === 0) {
    return []
  }

  const currentDate = dayjs(now).startOf('day')
  const countsByDate = usages.reduce<Record<string, number>>((acc, usage) => {
    const dateKey = dayjs(usage.usageDate).format('YYYY-MM-DD')
    acc[dateKey] = (acc[dateKey] || 0) + 1
    return acc
  }, {})

  return Array.from({ length: daysCount }, (_, index) => {
    const date = currentDate.subtract(daysCount - 1 - index, 'day')
    const dateKey = date.format('YYYY-MM-DD')
    const count = countsByDate[dateKey] || 0

    return {
      date: dateKey,
      count,
      level: getHeatmapLevel(count),
    }
  })
}

function getHeatmapDaysCount(period: StatisticsPeriod): number {
  if (period === 'month') {
    return 30
  }

  if (period === 'all') {
    return 180
  }

  return 0
}

function getHeatmapLevel(count: number): number {
  if (count === 0) {
    return 0
  }

  return Math.min(4, count)
}
