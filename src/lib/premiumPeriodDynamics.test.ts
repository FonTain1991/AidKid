import { calculatePremiumPeriodDynamics } from './premiumPeriodDynamics'

describe('calculatePremiumPeriodDynamics', () => {
  it('compares current and previous week premium metrics', () => {
    const result = calculatePremiumPeriodDynamics({
      usages: [
        { medicineId: 1, usageDate: '2026-06-23T09:00:00.000Z', notes: 'Scheduled intake at 09:00' },
        { medicineId: 1, usageDate: '2026-06-16T09:00:00.000Z', notes: 'Scheduled intake at 09:00' },
      ],
      reminders: [
        {
          id: 1,
          frequency: 'daily',
          time: JSON.stringify([{ hour: 9, minute: 0 }]),
          isActive: true,
          createdAt: new Date('2026-06-15T10:00:00.000Z').getTime(),
          daysCount: 10,
        },
      ],
      reminderMedicines: [{ reminderId: 1, medicineId: 1 }],
      period: 'week',
      now: '2026-06-23T12:00:00.000Z',
    })

    expect(result).toEqual({
      current: {
        intakes: 1,
        adherencePercentage: 14,
        missed: 6,
      },
      previous: {
        intakes: 1,
        adherencePercentage: 50,
        missed: 1,
      },
    })
  })

  it('does not compare all time period', () => {
    expect(calculatePremiumPeriodDynamics({
      usages: [],
      reminders: [],
      reminderMedicines: [],
      period: 'all',
      now: '2026-06-23T12:00:00.000Z',
    })).toBeNull()
  })

  it('counts adherence with runtime string reminder medicine ids', () => {
    const result = calculatePremiumPeriodDynamics({
      usages: [
        { medicineId: 1, usageDate: '2026-06-23T09:05:00.000Z', notes: null },
      ],
      reminders: [
        {
          id: 1,
          frequency: 'daily',
          time: JSON.stringify([{ hour: 9, minute: 0 }]),
          isActive: true,
          createdAt: new Date('2026-06-23T08:00:00.000Z').getTime(),
        },
      ],
      reminderMedicines: [{ reminderId: '1', medicineId: '1' } as any],
      period: 'day',
      now: '2026-06-23T12:00:00.000Z',
    })

    expect(result?.current).toEqual({
      intakes: 1,
      adherencePercentage: 100,
      missed: 0,
    })
  })
})
