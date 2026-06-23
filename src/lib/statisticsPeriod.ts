import dayjs from 'dayjs'

export type StatisticsPeriod = 'day' | 'week' | 'month' | 'all'

export interface UsageWithDate {
  usageDate: string
}

export function filterUsageByPeriod<T extends UsageWithDate>(
  usages: T[],
  period: StatisticsPeriod,
  now: string | Date = new Date()
): T[] {
  if (period === 'all') {
    return usages
  }

  const currentDate = dayjs(now)
  const endDate = currentDate.endOf('day')
  const startDate = {
    day: currentDate.startOf('day'),
    week: currentDate.subtract(6, 'day').startOf('day'),
    month: currentDate.subtract(29, 'day').startOf('day'),
  }[period]

  return usages.filter(usage => {
    const usageDate = dayjs(usage.usageDate)

    return (usageDate.isAfter(startDate) || usageDate.isSame(startDate)) &&
      (usageDate.isBefore(endDate) || usageDate.isSame(endDate))
  })
}
