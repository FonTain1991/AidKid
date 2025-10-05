import React, { useEffect, useState } from 'react'
import { List } from '../List'
import { kitApi } from '@/entities/kit/api'
import { MedicineKit } from '@/entities/kit/model/types'

interface ParentKitListProps {
  value?: string
  onChange: (kitId: string) => void
  fieldName?: string
  excludeKitId?: string // ID категории, которую нужно исключить (для редактирования)
}

export const ParentKitList: React.FC<ParentKitListProps> = ({
  value,
  onChange,
  fieldName = 'Родительская категория',
  excludeKitId
}) => {
  const [kits, setKits] = useState<MedicineKit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadKits = async () => {
      try {
        setLoading(true)
        const fetchedKits = await kitApi.getKits()
        // Исключаем текущую категорию и её потомков
        const filteredKits = excludeKitId
          ? fetchedKits.filter(kit => kit.id !== excludeKitId && !isDescendant(kit, excludeKitId, fetchedKits))
          : fetchedKits
        setKits(filteredKits)
      } catch (error) {
        console.error('Error loading kits for ParentKitList:', error)
      } finally {
        setLoading(false)
      }
    }
    loadKits()
  }, [excludeKitId])

  // Проверяем, является ли kit потомком excludeKitId
  const isDescendant = (kit: MedicineKit, excludeId: string, allKits: MedicineKit[]): boolean => {
    let current = kit
    while (current.parent_id) {
      if (current.parent_id === excludeId) return true
      current = allKits.find(k => k.id === current.parent_id)!
      if (!current) break
    }
    return false
  }

  // Создаем опции для List компонента
  const options = [
    { label: 'Без родителя', value: '', subtitle: 'Корневая категория' },
    ...kits.map(kit => ({
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
