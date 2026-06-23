import { calculateActivityHeatmap } from './activityHeatmap'

describe('calculateActivityHeatmap', () => {
  it('builds a 30 day monthly heatmap with usage counts', () => {
    const result = calculateActivityHeatmap({
      usages: [
        { usageDate: '2026-06-22T09:00:00.000Z' },
        { usageDate: '2026-06-22T12:00:00.000Z' },
        { usageDate: '2026-06-23T09:00:00.000Z' },
      ],
      period: 'month',
      now: '2026-06-23T12:00:00.000Z',
    })

    expect(result).toHaveLength(30)
    expect(result[result.length - 2]).toEqual({ date: '2026-06-22', count: 2, level: 2 })
    expect(result[result.length - 1]).toEqual({ date: '2026-06-23', count: 1, level: 1 })
  })

  it('does not build heatmap for day or week periods', () => {
    expect(calculateActivityHeatmap({ usages: [], period: 'day' })).toEqual([])
    expect(calculateActivityHeatmap({ usages: [], period: 'week' })).toEqual([])
  })
})
