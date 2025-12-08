import { useRoute } from '@/hooks'
import { Medicine } from '@/services/models'
import { useAppStore } from '@/store'
import { memo, useMemo } from 'react'
import { MedicineItem } from './MedicineItem'

interface MedicineListProps {
  searchText?: string
  showKit?: boolean
}

export const MedicineList = memo(({ searchText, showKit = false }: MedicineListProps) => {
  const { params } = useRoute()
  const { medicines } = useAppStore(state => state)

  const dataSource = useMemo(() => {
    if (searchText && params?.medicineKitId) {
      return medicines.filter((medicine: Medicine) => medicine.medicineKitId === params?.medicineKitId && medicine.name.toLowerCase().includes(searchText.toLowerCase()))
    }
    if (searchText) {
      return medicines.filter((medicine: Medicine) => medicine.name.toLowerCase().includes(searchText.toLowerCase()))
    }
    return medicines.filter((medicine: Medicine) => medicine.medicineKitId === params?.medicineKitId)
  }, [medicines, params?.medicineKitId, searchText])

  return (
    dataSource?.map((medicine: Medicine) => (
      <MedicineItem key={medicine.id} medicine={medicine} showKit={showKit} />
    ))
  )
})