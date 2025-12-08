import { CreateReminderMedicineData, reminderMedicineModel } from '@/services/models'
import { useAppStore } from '@/store'
import { useState } from 'react'
import { useEvent } from './useEvent'

type CreateReminderMedicinePayload = CreateReminderMedicineData

export function useReminderMedicine() {
  const {
    setReminderMedicines,
    addReminderMedicine,
    updateReminderMedicine: updateReminderMedicineStore,
    deleteReminderMedicine: deleteReminderMedicineStore
  } = useAppStore(state => state)

  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getAllReminderMedicines = useEvent(async () => {
    try {
      const reminderMedicines = await reminderMedicineModel.getAll()
      setReminderMedicines(reminderMedicines)
    } catch (err) {
      console.error(err instanceof Error ? err : new Error('Failed to fetch reminderMedicines'))
    }
  })

  const createReminderMedicine = useEvent(async (data: CreateReminderMedicinePayload) => {
    setIsLoading(true)
    setError(null)

    try {
      const reminderMedicine = await reminderMedicineModel.create(data)
      if (!reminderMedicine) {
        throw new Error('Failed to create reminderMedicine')
      }
      addReminderMedicine(reminderMedicine)
      return reminderMedicine
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create reminderMedicine'))
    } finally {
      setIsLoading(false)
    }
  })

  type UpdateReminderMedicinePayload = Partial<CreateReminderMedicineData> & { id: number }
  const updateReminderMedicine = useEvent(async (data: UpdateReminderMedicinePayload) => {
    setIsLoading(true)
    setError(null)

    try {
      const reminderMedicine = await reminderMedicineModel.update(data.id, data)
      updateReminderMedicineStore(reminderMedicine)
      return reminderMedicine
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update reminderMedicine'))
    } finally {
      setIsLoading(false)
    }
  })

  const deleteReminderMedicine = useEvent(async (id: number) => {
    setIsLoading(true)
    setError(null)

    try {
      await reminderMedicineModel.delete(id)
      deleteReminderMedicineStore(id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete reminderMedicine'))
    } finally {
      setIsLoading(false)
    }
  })


  return {
    getAllReminderMedicines,
    createReminderMedicine,
    updateReminderMedicine,
    deleteReminderMedicine,
    isLoading,
    error,
  }
}