import { MedicineKit, CreateKitData } from '@/services/models'
import { kitModel } from '@/services/models/KitModel'
import { useEffect, useState } from 'react'
import { useEvent } from './useEvent'

type CreateMedicineKitPayload = CreateKitData
type UseMedicineKitCreateReturn = [
  (data: CreateMedicineKitPayload) => Promise<MedicineKit | undefined>,
  {
    isLoading: boolean
    error: Error | null
  }
]

const medicineKitCache: MedicineKit[] = []
export function useMedicineKit() {
  const [medicineKit, setMedicineKit] = useState<MedicineKit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const getMedicineKit = useEvent(async (resetCache: boolean = false) => {
    setIsLoading(true)
    setError(null)

    if (medicineKitCache.length && !resetCache) {
      setMedicineKit(medicineKitCache)
      return
    }

    try {
      const kits = await kitModel.getAll()
      setMedicineKit(kits)
      medicineKitCache.splice(0, medicineKitCache.length, ...kits)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch medicine kit'))
    } finally {
      setIsLoading(false)
    }
  })

  useEffect(() => {
    getMedicineKit()
  }, [getMedicineKit])

  return {
    medicineKit,
    isLoading,
    error,
    refetch() {
      getMedicineKit(true)
    }
  }
}

export function useMedicineKitCreate(): UseMedicineKitCreateReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createMedicineKit = useEvent(async (data: CreateMedicineKitPayload) => {
    setIsLoading(true)
    setError(null)

    try {
      const kit = await kitModel.create(data)
      medicineKitCache.push(kit)
      return kit
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create medicine kit'))
    } finally {
      setIsLoading(false)
    }
  })

  return [
    createMedicineKit,
    {
      isLoading,
      error,
    },
  ]
}