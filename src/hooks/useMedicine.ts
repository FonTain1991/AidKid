import { CreateMedicineData, medicineModel } from '@/services/models'
import { useAppStore } from '@/store'
import { useState } from 'react'
import { useEvent } from './useEvent'

type CreateMedicinePayload = CreateMedicineData

export function useMedicine() {
  const {
    setMedicines,
    addMedicine,
    updateMedicine: updateMedicineStore,
    deleteMedicine: deleteMedicineStore
  } = useAppStore(state => state)

  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getAllMedicines = useEvent(async () => {
    try {
      const medicines = await medicineModel.getAll()
      setMedicines(medicines)
    } catch (err) {
      console.error(err instanceof Error ? err : new Error('Failed to fetch medicines'))
    }
  })

  const createMedicine = useEvent(async (data: CreateMedicinePayload) => {
    setIsLoading(true)
    setError(null)

    try {
      const medicine = await medicineModel.create(data)
      if (!medicine) {
        throw new Error('Failed to create medicine')
      }
      addMedicine(medicine)
      return medicine
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create medicine'))
    } finally {
      setIsLoading(false)
    }
  })

  type UpdateMedicinePayload = Partial<CreateMedicineData> & { id: number }
  const updateMedicine = useEvent(async (data: UpdateMedicinePayload) => {
    setIsLoading(true)
    setError(null)

    try {
      const medicine = await medicineModel.update(data.id, data)
      updateMedicineStore(medicine)
      return medicine
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update medicine'))
    } finally {
      setIsLoading(false)
    }
  })

  const deleteMedicine = useEvent(async (id: number) => {
    setIsLoading(true)
    setError(null)

    try {
      await medicineModel.delete(id)
      deleteMedicineStore(id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete medicine'))
    } finally {
      setIsLoading(false)
    }
  })


  return {
    getAllMedicines,
    createMedicine,
    updateMedicine,
    deleteMedicine,
    isLoading,
    error,
  }
}