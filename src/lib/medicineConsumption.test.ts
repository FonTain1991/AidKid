import { calculateMedicineConsumption } from './medicineConsumption'

describe('calculateMedicineConsumption', () => {
  it('groups medicine usage quantities by medicine and sorts by total quantity', () => {
    const result = calculateMedicineConsumption({
      usages: [
        { medicineId: 1, quantityUsed: 2 },
        { medicineId: 2, quantityUsed: 5 },
        { medicineId: 1, quantityUsed: 3 },
      ],
      medicines: [
        { id: 1, name: 'Paracetamol', unitForQuantity: 'pill', unit: 'mg' },
        { id: 2, name: 'Ibuprofen', unitForQuantity: 'ml', unit: 'mg' },
      ],
      unknownMedicineName: 'Unknown medicine',
    })

    expect(result).toEqual([
      {
        medicineId: 1,
        medicineName: 'Paracetamol',
        quantity: 5,
        unitValue: 'pill',
      },
      {
        medicineId: 2,
        medicineName: 'Ibuprofen',
        quantity: 5,
        unitValue: 'ml',
      },
    ])
  })
})
