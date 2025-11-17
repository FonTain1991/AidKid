import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { MedicineKit } from '@/entities/kit/model/types'
import { kitApi } from '@/entities/kit/api'
import { useDatabase } from '@/shared/lib/hooks'

interface KitListStateContextType {
  kits: MedicineKit[]
  loading: boolean
  error: string | null
  refreshKits: () => void
  addKit: (kit: MedicineKit) => void
  updateKit: (kit: MedicineKit) => void
  removeKit: (kitId: string) => void
}

const KitListStateContext = createContext<KitListStateContextType | undefined>(undefined)

interface KitListStateProviderProps {
  children: ReactNode
}

export const KitListStateProvider: React.FC<KitListStateProviderProps> = ({ children }) => {
  const [kits, setKits] = useState<MedicineKit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isInitialized: isDbInitialized } = useDatabase()

  const loadKits = async () => {
    if (!isDbInitialized) {
      return
    }

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

  const addKit = (newKit: MedicineKit) => {
    setKits(prevKits => [newKit, ...prevKits])
  }

  const updateKit = (updatedKit: MedicineKit) => {
    setKits(prevKits =>
      prevKits.map(kit =>
        kit.id === updatedKit.id ? updatedKit : kit
      )
    )
  }

  const removeKit = (kitId: string) => {
    setKits(prevKits => prevKits.filter(kit => kit.id !== kitId))
  }

  useEffect(() => {
    if (isDbInitialized) {
      loadKits()
    }
  }, [isDbInitialized])

  const value: KitListStateContextType = {
    kits,
    loading,
    error,
    refreshKits,
    addKit,
    updateKit,
    removeKit,
  }

  return (
    <KitListStateContext.Provider value={value}>
      {children}
    </KitListStateContext.Provider>
  )
}

export const useKitListState = () => {
  const context = useContext(KitListStateContext)
  if (context === undefined) {
    throw new Error('useKitListState must be used within a KitListStateProvider')
  }
  return context
}
