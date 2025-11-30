import { useAppStore } from '@/store'
import React, { useMemo } from 'react'
import { List } from '../Form'

interface ParentMedicineKitListProps {
  value?: string | null
  onChange: (kitId: string) => void
  fieldName?: string
  excludeKitId?: string // ID категории, которую нужно исключить (для редактирования)
  error?: string | null | undefined
  noParent?: boolean
}

export const ParentMedicineKitList: React.FC<ParentMedicineKitListProps> = ({
  value,
  onChange,
  fieldName = 'Родительская категория',
  error,
  excludeKitId,
  noParent = false
}) => {

  const { medicineKits } = useAppStore(state => state)


  // Проверяем, является ли kit потомком excludeKitId
  // const isDescendant = (kit: MedicineKit, excludeId: string, allKits: MedicineKit[]): boolean => {
  //   let current = kit
  //   while (current.parent_id) {
  //     if (current.parent_id === excludeId) {
  //       return true
  //     }
  //     current = allKits.find(k => k.id === current.parent_id)!
  //     if (!current) {
  //       break
  //     }
  //   }
  //   return false
  // }

  // Создаем опции для List компонента
  const options = useMemo(() => {
    if (noParent) {
      return medicineKits.map(kit => ({
        label: kit.name,
        value: kit.id,
        subtitle: kit.description
      }))
    }
    return [
      { label: 'Без родителя', value: null, subtitle: 'Корневая категория' },
      ...medicineKits.map(kit => ({
        label: kit.name,
        value: kit.id,
        subtitle: kit.description
      }))
    ]
  }, [noParent, medicineKits])

  return (
    <List
      fieldName={fieldName}
      options={options}
      value={value}
      onChange={onChange}
      error={error}
    />
  )
}
