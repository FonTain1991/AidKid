import { CreateMedicineUsageData, medicineUsageModel } from '@/services/models'
import { useState } from 'react'
import { useEvent } from './useEvent'

type CreateMedicineUsagePayload = CreateMedicineUsageData

export function useMedicineUsage() {
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getAllMedicineUsages = useEvent(async () => {
    try {
      return await medicineUsageModel.getAll()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch medicine usages')
      setError(error)
      console.error(error)
      return []
    }
  })

  const getTodayMedicineUsages = useEvent(async () => {
    try {
      const allUsages = await medicineUsageModel.getAll()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Фильтруем записи за сегодня
      return allUsages.filter(usage => {
        const usageDate = new Date(usage.usageDate)
        return usageDate >= today && usageDate < tomorrow
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch today medicine usages')
      setError(error)
      console.error(error)
      return []
    }
  })

  const getByMedicineId = useEvent(async (medicineId: number) => {
    try {
      return await medicineUsageModel.getByMedicineId(medicineId)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch medicine usage by id')
      setError(error)
      console.error(error)
      return []
    }
  })

  const createMedicineUsage = useEvent(async (data: CreateMedicineUsagePayload) => {
    setIsLoading(true)
    setError(null)

    try {
      const usage = await medicineUsageModel.create(data)
      if (!usage) {
        throw new Error('Failed to create medicine usage')
      }
      return usage
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create medicine usage')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  })

  const deleteMedicineUsage = useEvent(async (id: number) => {
    setIsLoading(true)
    setError(null)

    try {
      await medicineUsageModel.delete(id)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete medicine usage')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  })

  return {
    getAllMedicineUsages,
    getTodayMedicineUsages,
    getByMedicineId,
    createMedicineUsage,
    deleteMedicineUsage,
    isLoading,
    error,
  }
}

