import { Medicine } from '@/services/models'
import { useAppStore } from '@/store'
import { memo, useMemo } from 'react'
import { MedicineItemForQuickIntake } from './MedicineItemForQuickIntake'

export const MedicineListForQuickIntake = memo(() => {
  const { medicines } = useAppStore(state => state)

  const dataSource = useMemo(() => {
    return medicines
  }, [medicines])

  return (
    dataSource?.map((medicine: Medicine) => (
      <MedicineItemForQuickIntake key={medicine.id} medicine={medicine} />
    ))
  )
})