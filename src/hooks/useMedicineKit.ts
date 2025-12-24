import { CreateKitData } from '@/services/models'
import { kitModel } from '@/services/models/KitModel'
import { useAppStore } from '@/store'
import { useState } from 'react'
import { useEvent } from './useEvent'
import { canCreateKit, formatLimitMessage } from '@/lib/subscriptionLimits'

type CreateMedicineKitPayload = CreateKitData

export function useMedicineKit() {
  const {
    setMedicineKits,
    addMedicineKit,
    updateMedicineKit: updateMedicineKitStore,
    deleteMedicineKit: deleteMedicineKitStore
  } = useAppStore(state => state)

  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getAllMedicineKits = useEvent(async () => {
    try {
      const kits = await kitModel.getAll()
      setMedicineKits(kits)
    } catch (err) {
      console.error(err instanceof Error ? err : new Error('Failed to fetch medicine kit'))
    }
  })

  const createMedicineKit = useEvent(async (data: CreateMedicineKitPayload) => {
    setIsLoading(true)
    setError(null)

    try {
      // Проверяем лимит перед созданием
      const limitCheck = await canCreateKit()
      if (!limitCheck.allowed) {
        const errorMessage = formatLimitMessage(limitCheck)
        const error = new Error(errorMessage)
        setError(error)
        throw error
      }

      const kit = await kitModel.create(data)
      if (!kit) {
        throw new Error('Failed to create medicine kit')
      }
      addMedicineKit(kit)
      return kit
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create medicine kit'))
      throw err
    } finally {
      setIsLoading(false)
    }
  })

  type UpdateMedicineKitPayload = Partial<CreateKitData> & { id: number }
  const updateMedicineKit = useEvent(async (data: UpdateMedicineKitPayload) => {
    setIsLoading(true)
    setError(null)

    try {
      const kit = await kitModel.update(data.id, data)
      updateMedicineKitStore(kit)
      return kit
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create medicine kit'))
    } finally {
      setIsLoading(false)
    }
  })

  const deleteMedicineKit = useEvent(async (id: number) => {
    setIsLoading(true)
    setError(null)

    try {
      await kitModel.delete(id)
      deleteMedicineKitStore(id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete medicine kit'))
    } finally {
      setIsLoading(false)
    }
  })


  return {
    getAllMedicineKits,
    createMedicineKit,
    updateMedicineKit,
    deleteMedicineKit,
    isLoading,
    error,
  }
}