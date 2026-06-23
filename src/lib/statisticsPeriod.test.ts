import { filterUsageByPeriod } from './statisticsPeriod'

const now = '2026-06-23T12:00:00.000Z'

const usages = [
  { id: 1, usageDate: '2026-06-23T09:00:00.000Z' },
  { id: 2, usageDate: '2026-06-20T09:00:00.000Z' },
  { id: 3, usageDate: '2026-06-10T09:00:00.000Z' },
  { id: 4, usageDate: '2026-05-01T09:00:00.000Z' },
]

describe('filterUsageByPeriod', () => {
  it('returns different usage ranges for day, week, month, and all time', () => {
    expect(filterUsageByPeriod(usages, 'day', now).map(usage => usage.id)).toEqual([1])
    expect(filterUsageByPeriod(usages, 'week', now).map(usage => usage.id)).toEqual([1, 2])
    expect(filterUsageByPeriod(usages, 'month', now).map(usage => usage.id)).toEqual([1, 2, 3])
    expect(filterUsageByPeriod(usages, 'all', now).map(usage => usage.id)).toEqual([1, 2, 3, 4])
  })

  it('does not show old records in current day, week, or month ranges', () => {
    const januaryUsages = [{ id: 1, usageDate: '2026-01-15T09:00:00.000Z' }]

    expect(filterUsageByPeriod(januaryUsages, 'day', now)).toEqual([])
    expect(filterUsageByPeriod(januaryUsages, 'week', now)).toEqual([])
    expect(filterUsageByPeriod(januaryUsages, 'month', now)).toEqual([])
    expect(filterUsageByPeriod(januaryUsages, 'all', now)).toEqual(januaryUsages)
  })
})
