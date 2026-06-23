import { calculateMedicineRunoutForecast } from './medicineRunoutForecast'

describe('calculateMedicineRunoutForecast', () => {
  it('predicts days until medicine runs out from period consumption', () => {
    const result = calculateMedicineRunoutForecast({
      usages: [
        { medicineId: 1, quantityUsed: 4, usageDate: '2026-06-20T09:00:00.000Z' },
        { medicineId: 1, quantityUsed: 3, usageDate: '2026-06-21T09:00:00.000Z' },
      ],
      medicines: [
        { id: 1, name: 'Paracetamol', quantity: 20, unitForQuantity: 'pill', unit: 'mg' },
      ],
      period: 'week',
      now: '2026-06-23T12:00:00.000Z',
      unknownMedicineName: 'Unknown medicine',
    })

    expect(result).toEqual([
      {
        medicineId: 1,
        medicineName: 'Paracetamol',
        daysLeft: 20,
        unitValue: 'pill',
      },
    ])
  })

  it('skips medicines without stock or consumption', () => {
    const result = calculateMedicineRunoutForecast({
      usages: [{ medicineId: 1, quantityUsed: 4, usageDate: '2026-06-20T09:00:00.000Z' }],
      medicines: [
        { id: 1, name: 'Paracetamol', quantity: 0, unitForQuantity: 'pill', unit: 'mg' },
        { id: 2, name: 'Ibuprofen', quantity: 10, unitForQuantity: 'ml', unit: 'mg' },
      ],
      period: 'week',
      now: '2026-06-23T12:00:00.000Z',
      unknownMedicineName: 'Unknown medicine',
    })

    expect(result).toEqual([])
  })
})
