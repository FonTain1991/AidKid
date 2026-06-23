import { calculatePlanAdherence } from './planAdherence'

describe('calculatePlanAdherence', () => {
  it('counts completed scheduled intakes for the selected day', () => {
    const result = calculatePlanAdherence({
      reminders: [
        {
          id: 1,
          frequency: 'daily',
          time: JSON.stringify([
            { hour: 9, minute: 0 },
            { hour: 21, minute: 0 },
          ]),
          isActive: true,
          createdAt: new Date('2026-06-20T10:00:00.000Z').getTime(),
        },
      ],
      reminderMedicines: [
        { reminderId: 1, medicineId: 10 },
        { reminderId: 1, medicineId: 11 },
      ],
      usages: [
        {
          medicineId: 10,
          usageDate: '2026-06-23T09:05:00.000Z',
          notes: 'Scheduled intake at 09:00',
        },
        {
          medicineId: 11,
          usageDate: '2026-06-23T09:06:00.000Z',
          notes: 'Scheduled intake at 09:00',
        },
      ],
      period: 'day',
      now: '2026-06-23T12:00:00.000Z',
    })

    expect(result).toEqual({
      completed: 1,
      missed: 1,
      planned: 2,
      percentage: 50,
    })
  })

  it('counts a scheduled slot when one reminder medicine was taken', () => {
    const result = calculatePlanAdherence({
      reminders: [
        {
          id: 1,
          frequency: 'daily',
          time: JSON.stringify([{ hour: 9, minute: 0 }]),
          isActive: true,
          createdAt: new Date('2026-06-20T10:00:00.000Z').getTime(),
        },
      ],
      reminderMedicines: [
        { reminderId: 1, medicineId: 10 },
        { reminderId: 1, medicineId: 11 },
      ],
      usages: [
        {
          medicineId: 10,
          usageDate: '2026-06-23T09:05:00.000Z',
          notes: null,
        },
      ],
      period: 'day',
      now: '2026-06-23T12:00:00.000Z',
    })

    expect(result).toEqual({
      completed: 1,
      missed: 0,
      planned: 1,
      percentage: 100,
    })
  })

  it('counts plain usage near a scheduled time as completed', () => {
    const result = calculatePlanAdherence({
      reminders: [
        {
          id: '1' as any,
          frequency: 'daily',
          time: JSON.stringify([{ hour: 9, minute: 0 }]),
          isActive: true,
          createdAt: new Date('2026-06-20T10:00:00.000Z').getTime(),
        },
      ],
      reminderMedicines: [{ reminderId: 1, medicineId: 10 }],
      usages: [
        {
          medicineId: 10,
          usageDate: '2026-06-23T09:05:00.000Z',
          notes: null,
        },
      ],
      period: 'day',
      now: '2026-06-23T12:00:00.000Z',
    })

    expect(result).toEqual({
      completed: 1,
      missed: 0,
      planned: 1,
      percentage: 100,
    })
  })

  it('matches runtime string medicine ids from persisted data', () => {
    const result = calculatePlanAdherence({
      reminders: [
        {
          id: 1,
          frequency: 'daily',
          time: JSON.stringify([{ hour: 9, minute: 0 }]),
          isActive: true,
          createdAt: new Date('2026-06-20T10:00:00.000Z').getTime(),
        },
      ],
      reminderMedicines: [{ reminderId: 1, medicineId: '10' } as any],
      usages: [
        {
          medicineId: 10,
          usageDate: '2026-06-23T09:05:00.000Z',
          notes: null,
        },
      ],
      period: 'day',
      now: '2026-06-23T12:00:00.000Z',
    })

    expect(result).toEqual({
      completed: 1,
      missed: 0,
      planned: 1,
      percentage: 100,
    })
  })

  it('does not count planned intakes after reminder days count ends', () => {
    const result = calculatePlanAdherence({
      reminders: [
        {
          id: 1,
          frequency: 'daily',
          time: JSON.stringify([{ hour: 9, minute: 0 }]),
          isActive: true,
          createdAt: new Date('2026-06-01T10:00:00.000Z').getTime(),
          daysCount: 2,
        },
      ],
      reminderMedicines: [{ reminderId: 1, medicineId: 10 }],
      usages: [],
      period: 'month',
      now: '2026-06-23T12:00:00.000Z',
    })

    expect(result).toEqual({
      completed: 0,
      missed: 2,
      planned: 2,
      percentage: 0,
    })
  })
})
