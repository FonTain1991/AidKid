import { MedicineKit } from '@/services/models'
import { useRoute } from './useRoute'
import { useAppStore } from '@/store'

export function useMedicineScreenTitle() {
  const { params } = useRoute()
  const { medicineKits } = useAppStore(state => state)
  const currentKit = medicineKits.find((kit: MedicineKit) => kit.id === params?.medicineKitId)
  return currentKit?.name
}