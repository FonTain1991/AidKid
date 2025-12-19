import { notificationService, subscriptionService } from '@/lib'
import { databaseService } from '@/services'
import { useEffect } from 'react'
import { useFamilyMember } from './useFamilyMember'
import { useMedicine } from './useMedicine'
import { useMedicineKit } from './useMedicineKit'
import { useReminder } from './useReminder'
import { useReminderMedicine } from './useReminderMedicine'
import { useShoppingList } from './useShoppingList'
import { useSubscription } from '@/components/Subscription/hooks/useSubscription'

export function useAppInit() {
  const { getAllFamilyMembers } = useFamilyMember()
  const { getAllMedicineKits } = useMedicineKit()
  const { getAllMedicines } = useMedicine()
  const { getAllReminders } = useReminder()
  const { getAllReminderMedicines } = useReminderMedicine()
  const { getAllShoppingList } = useShoppingList()
  const { refreshStatus, loadOfferings } = useSubscription()

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize database
        await databaseService.init()
        // Initialize notification service (creates channels)
        await notificationService.init()
        console.log('✅ Notification service initialized')
        // Initialize subscription service
        await subscriptionService.initialize()
        console.log('✅ Subscription service initialized')
        // Initialize data
        await Promise.all([
          getAllFamilyMembers(),
          getAllMedicineKits(),
          getAllMedicines(),
          getAllReminders(),
          getAllReminderMedicines(),
          getAllShoppingList(),
          refreshStatus(),
          loadOfferings(),
        ])
      } catch (error) {
        console.error('Failed to initialize app:', error)
      }
    }
    init()
  }, [
    getAllFamilyMembers,
    getAllMedicineKits,
    getAllMedicines,
    getAllReminders,
    getAllReminderMedicines,
    getAllShoppingList,
    refreshStatus,
    loadOfferings,
  ])
}