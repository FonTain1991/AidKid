import { useMedicineKit } from '@/hooks/useMedicineKit'
import React from 'react'
import { List } from '../Form'

interface ParentMedicineKitListProps {
  value?: string
  onChange: (kitId: string) => void
  fieldName?: string
  excludeKitId?: string // ID категории, которую нужно исключить (для редактирования)
}

export const ParentMedicineKitList: React.FC<ParentMedicineKitListProps> = ({
  value,
  onChange,
  fieldName = 'Родительская категория',
  excludeKitId
}) => {

  const { medicineKit, isLoading, error, refetch } = useMedicineKit()


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
  const options = [
    { label: 'Без родителя', value: '', subtitle: 'Корневая категория' },
    ...medicineKit.map(kit => ({
      label: kit.name,
      value: kit.id,
      subtitle: kit.description
    }))
  ]

  return (
    <List
      fieldName={fieldName}
      options={options}
      value={value}
      onChange={onChange}
    />
  )
}
