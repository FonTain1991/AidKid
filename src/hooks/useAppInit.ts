import { databaseService } from '@/services'
import { useEffect } from 'react'
import { useFamilyMember } from './useFamilyMember'
import { useMedicineKit } from './useMedicineKit'
import { useMedicine } from './useMedicine'

export function useAppInit() {
  const { getAllFamilyMembers } = useFamilyMember()
  const { getAllMedicineKits } = useMedicineKit()
  const { getAllMedicines } = useMedicine()

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize database
        await databaseService.init()
        // Initialize data
        await Promise.all([
          getAllFamilyMembers(),
          getAllMedicineKits(),
          getAllMedicines()
        ])
      } catch (error) {
        console.error('Failed to initialize database:', error)
      }
    }
    init()
  }, [getAllFamilyMembers, getAllMedicineKits, getAllMedicines])
}