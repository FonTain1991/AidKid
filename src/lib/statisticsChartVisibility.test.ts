import { getStatisticsChartVisibility } from './statisticsChartVisibility'

describe('getStatisticsChartVisibility', () => {
  it('shows only relevant charts for each statistics period', () => {
    expect(getStatisticsChartVisibility('day')).toEqual({
      hour: true,
      weekday: false,
      kits: false,
      topMedicines: false,
    })

    expect(getStatisticsChartVisibility('week')).toEqual({
      hour: false,
      weekday: true,
      kits: false,
      topMedicines: false,
    })

    expect(getStatisticsChartVisibility('month')).toEqual({
      hour: false,
      weekday: false,
      kits: true,
      topMedicines: true,
    })

    expect(getStatisticsChartVisibility('all')).toEqual({
      hour: false,
      weekday: false,
      kits: true,
      topMedicines: true,
    })
  })
})
