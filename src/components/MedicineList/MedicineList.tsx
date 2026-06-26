import { useRoute } from '@/hooks'
import { compareByName, sortByName } from '@/helpers'
import { Medicine } from '@/services/models'
import { useAppStore } from '@/store'
import { memo, useMemo } from 'react'
import { MedicineItem } from './MedicineItem'

export type SortValue = 'name_asc' | 'name_desc' | 'quantity_asc' | 'quantity_desc' | 'date_asc' | 'date_desc' | 'expiration_asc' | 'expiration_desc'

interface MedicineListProps {
  searchText?: string
  showKit?: boolean
  sort?: SortValue
}

export const MedicineList = memo(({ searchText, showKit = false, sort = 'name_asc' }: MedicineListProps) => {
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

  const dataSourceSorted = useMemo(() => {
    const sorted = [...dataSource]
    switch (sort) {
      case 'name_asc':
        return sortByName(sorted)
      case 'name_desc':
        return [...sorted].sort((a, b) => compareByName(b, a))
      case 'quantity_asc':
        return sorted.sort((a, b) => (a?.quantity || 0) - (b?.quantity || 0))
      case 'quantity_desc':
        return sorted.sort((a, b) => (b?.quantity || 0) - (a?.quantity || 0))
      case 'date_asc':
        return sorted.sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0))
      case 'date_desc':
        return sorted.sort((a, b) => (a?.createdAt || 0) - (b?.createdAt || 0))
      case 'expiration_asc':
        return sorted.sort((a, b) => (a?.expirationDate || 0) - (b?.expirationDate || 0))
      case 'expiration_desc':
        return sorted.sort((a, b) => (b?.expirationDate || 0) - (a?.expirationDate || 0))
      default:
        return sortByName(sorted)
    }
  }, [dataSource, sort])

  return (
    dataSourceSorted?.map((medicine: Medicine) => (
      <MedicineItem key={medicine.id} medicine={medicine} showKit={showKit} />
    ))
  )
})