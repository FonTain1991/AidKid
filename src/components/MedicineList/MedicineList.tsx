import { useRoute } from '@/hooks'
import { Medicine } from '@/services/models'
import { useAppStore } from '@/store'
import { memo, useMemo } from 'react'
import { MedicineItem } from './MedicineItem'

export const MedicineList = memo(() => {
  const { params } = useRoute()
  const { medicines } = useAppStore(state => state)

  const dataSource = useMemo(() => {
    return medicines.filter((medicine: Medicine) => medicine.medicineKitId === params?.medicineKitId)
  }, [medicines, params?.medicineKitId])

  return (
    dataSource?.map((medicine: Medicine) => (
      <MedicineItem key={medicine.id} medicine={medicine} />
    ))
  )
})