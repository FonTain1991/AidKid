import { calculateMissedMedicineStats } from './missedMedicineStats'

describe('calculateMissedMedicineStats', () => {
  it('counts missed medicines inside scheduled intakes', () => {
    const result = calculateMissedMedicineStats({
      reminders: [
        {
          id: 1,
          frequency: 'daily',
          time: JSON.stringify([{ hour: 9, minute: 0 }]),
          isActive: true,
          createdAt: new Date('2026-06-20T10:00:00.000Z').getTime(),
          daysCount: 1,
        },
      ],
      reminderMedicines: [
        { reminderId: 1, medicineId: 10 },
        { reminderId: 1, medicineId: 11 },
      ],
      usages: [
        {
          medicineId: 10,
          usageDate: '2026-06-20T09:05:00.000Z',
          notes: 'Scheduled intake at 09:00',
        },
      ],
      medicines: [
        { id: 10, name: 'Paracetamol' },
        { id: 11, name: 'Ibuprofen' },
      ],
      period: 'all',
      now: '2026-06-23T12:00:00.000Z',
      unknownMedicineName: 'Unknown medicine',
    })

    expect(result).toEqual([
      {
        medicineId: 11,
        medicineName: 'Ibuprofen',
        missed: 1,
      },
    ])
  })

  it('counts plain usage near scheduled time while keeping other medicines missed', () => {
    const result = calculateMissedMedicineStats({
      reminders: [
        {
          id: 1,
          frequency: 'daily',
          time: JSON.stringify([{ hour: 9, minute: 0 }]),
          isActive: true,
          createdAt: new Date('2026-06-20T10:00:00.000Z').getTime(),
          daysCount: 1,
        },
      ],
      reminderMedicines: [
        { reminderId: '1', medicineId: '10' } as any,
        { reminderId: '1', medicineId: '11' } as any,
      ],
      usages: [
        {
          medicineId: 10,
          usageDate: '2026-06-20T09:05:00.000Z',
          notes: null,
        },
      ],
      medicines: [
        { id: 10, name: 'Paracetamol' },
        { id: 11, name: 'Ibuprofen' },
      ],
      period: 'all',
      now: '2026-06-23T12:00:00.000Z',
      unknownMedicineName: 'Unknown medicine',
    })

    expect(result).toEqual([
      {
        medicineId: 11,
        medicineName: 'Ibuprofen',
        missed: 1,
      },
    ])
  })
})
