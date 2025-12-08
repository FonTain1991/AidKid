import { CreateReminderData, reminderModel } from '@/services/models'
import { useAppStore } from '@/store'
import { useState } from 'react'
import { useEvent } from './useEvent'

type CreateReminderPayload = CreateReminderData

export function useReminder() {
  const {
    setReminders,
    addReminder,
    updateReminder: updateReminderStore,
    deleteReminder: deleteReminderStore
  } = useAppStore(state => state)

  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getAllReminders = useEvent(async () => {
    try {
      const reminders = await reminderModel.getAll()
      setReminders(reminders)
    } catch (err) {
      console.error(err instanceof Error ? err : new Error('Failed to fetch reminders'))
    }
  })

  const createReminder = useEvent(async (data: CreateReminderPayload) => {
    setIsLoading(true)
    setError(null)

    try {
      const reminder = await reminderModel.create(data)
      if (!reminder) {
        throw new Error('Failed to create reminder')
      }
      addReminder(reminder)
      return reminder
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create reminder'))
    } finally {
      setIsLoading(false)
    }
  })

  type UpdateReminderPayload = Partial<CreateReminderData> & { id: number }
  const updateReminder = useEvent(async (data: UpdateReminderPayload) => {
    setIsLoading(true)
    setError(null)

    try {
      const reminder = await reminderModel.update(data.id, data)
      updateReminderStore(reminder)
      return reminder
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update reminder'))
    } finally {
      setIsLoading(false)
    }
  })

  const deleteReminder = useEvent(async (id: number) => {
    setIsLoading(true)
    setError(null)

    try {
      await reminderModel.delete(id)
      deleteReminderStore(id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete reminder'))
    } finally {
      setIsLoading(false)
    }
  })


  return {
    getAllReminders,
    createReminder,
    updateReminder,
    deleteReminder,
    isLoading,
    error,
  }
}