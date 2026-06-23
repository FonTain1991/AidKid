type MedicineUsageUnitSource = {
  unitForQuantity?: string | null
  unit?: string | null
}

export function getUsageUnitValue(medicine?: MedicineUsageUnitSource | null): string {
  return medicine?.unitForQuantity || medicine?.unit || 'pcs'
}
