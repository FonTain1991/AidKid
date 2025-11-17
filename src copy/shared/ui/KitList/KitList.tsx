import React, { useState, useEffect } from 'react'
import { List } from '../List'
import { MedicineKit } from '@/entities/kit/model/types'
import { kitApi } from '@/entities/kit/api'

interface KitListProps {
  value?: string
  onChange?: (kitId: string) => void
  fieldName?: string
}

export const KitList: React.FC<KitListProps> = ({
  value,
  onChange,
  fieldName = 'Аптечка'
}) => {
  const [kits, setKits] = useState<MedicineKit[]>([])
  const [_loading, setLoading] = useState(true)

  useEffect(() => {
    const loadKits = async () => {
      try {
        setLoading(true)
        const fetchedKits = await kitApi.getKits()
        setKits(fetchedKits)
      } catch (error) {
        console.error('Error loading kits:', error)
      } finally {
        setLoading(false)
      }
    }

    loadKits()
  }, [])

  const kitOptions = kits.map(kit => ({
    label: kit.name,
    value: kit.id
  }))

  return (
    <List
      fieldName={fieldName}
      options={kitOptions}
      value={value}
      onChange={onChange}
    />
  )
}
