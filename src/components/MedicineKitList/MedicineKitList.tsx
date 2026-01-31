import { useRoute } from '@/hooks'
import { MedicineKit } from '@/services/models'
import { useAppStore } from '@/store'
import { memo, useMemo } from 'react'
import { MedicineKitItem } from './MedicineKitItem'

export const MedicineKitList = memo(() => {
  const { params } = useRoute()
  const { medicineKits } = useAppStore(state => state)

  const dataSource = useMemo(() => {
    const filtered = params?.medicineKitId
      ? medicineKits.filter((kit: MedicineKit) => kit.parentId === params?.medicineKitId)
      : medicineKits.filter((kit: MedicineKit) => kit.parentId === null)
    return [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
  }, [medicineKits, params?.medicineKitId])

  return (
    dataSource?.map((kit: MedicineKit) => (
      <MedicineKitItem key={kit.id} kit={kit} />
    ))
  )
})