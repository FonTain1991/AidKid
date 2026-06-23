import { getUsageUnitValue } from './usageUnit'

interface UsageLike {
  medicineId: number
  quantityUsed: number
}

interface MedicineLike {
  id?: number | null
  name: string
  unitForQuantity?: string | null
  unit?: string | null
}

interface CalculateMedicineConsumptionParams {
  usages: UsageLike[]
  medicines: MedicineLike[]
  unknownMedicineName: string
  limit?: number
}

export interface MedicineConsumptionItem {
  medicineId: number
  medicineName: string
  quantity: number
  unitValue: string
}

export function calculateMedicineConsumption(params: CalculateMedicineConsumptionParams): MedicineConsumptionItem[] {
  const { usages, medicines, unknownMedicineName, limit = 5 } = params
  const quantitiesByMedicineId = usages.reduce<Record<number, number>>((acc, usage) => {
    acc[usage.medicineId] = (acc[usage.medicineId] || 0) + usage.quantityUsed
    return acc
  }, {})

  return Object.entries(quantitiesByMedicineId)
    .map(([medicineId, quantity]) => {
      const medicine = medicines.find(item => item.id === Number(medicineId))

      return {
        medicineId: Number(medicineId),
        medicineName: medicine?.name || unknownMedicineName,
        quantity,
        unitValue: getUsageUnitValue(medicine),
      }
    })
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit)
}
