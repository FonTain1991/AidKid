import { useState, useEffect } from 'react'
import { kitApi } from '@/entities/kit/api'
import { MedicineKit } from '@/entities/kit/model/types'

export const useKitList = () => {
  const [kits, setKits] = useState<MedicineKit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadKits = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedKits = await kitApi.getKits()
      setKits(fetchedKits)
    } catch (err) {
      console.error('Error loading kits:', err)
      setError('Не удалось загрузить аптечки')
    } finally {
      setLoading(false)
    }
  }

  const refreshKits = () => {
    loadKits()
  }

  const addKitToList = (newKit: MedicineKit) => {
    setKits(prevKits => [newKit, ...prevKits])
  }

  const updateKitInList = (updatedKit: MedicineKit) => {
    setKits(prevKits => prevKits.map(kit => (kit.id === updatedKit.id ? updatedKit : kit)))
  }

  const removeKitFromList = (kitId: string) => {
    setKits(prevKits => prevKits.filter(kit => kit.id !== kitId))
  }

  useEffect(() => {
    loadKits()
  }, [])

  return {
    kits,
    loading,
    error,
    refreshKits,
    addKitToList,
    updateKitInList,
    removeKitFromList,
  }
}
