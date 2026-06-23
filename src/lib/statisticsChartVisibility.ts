import type { StatisticsPeriod } from './statisticsPeriod'

export interface StatisticsChartVisibility {
  hour: boolean
  weekday: boolean
  kits: boolean
  topMedicines: boolean
}

export function getStatisticsChartVisibility(period: StatisticsPeriod): StatisticsChartVisibility {
  return {
    hour: period === 'day',
    weekday: period === 'week',
    kits: period === 'month' || period === 'all',
    topMedicines: period === 'month' || period === 'all',
  }
}
