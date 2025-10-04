import { MedicineKit } from '@/entities/kit/model/types'

export const useRootKits = (kits: MedicineKit[]) => {
  // Фильтруем только корневые категории (без родителя)
  const rootKits = kits.filter(kit => !kit.parentId)

  return {
    rootKits
  }
}
