import React, { createContext, useContext, ReactNode } from 'react'
import { MedicineKit } from '@/entities/kit/model/types'

interface KitListContextType {
  addKit: (kit: MedicineKit) => void
  updateKit: (kit: MedicineKit) => void
  removeKit: (kitId: string) => void
}

const KitListContext = createContext<KitListContextType | undefined>(undefined)

interface KitListProviderProps {
  children: ReactNode
  onAddKit: (kit: MedicineKit) => void
  onUpdateKit: (kit: MedicineKit) => void
  onRemoveKit: (kitId: string) => void
}

export const KitListProvider: React.FC<KitListProviderProps> = ({
  children,
  onAddKit,
  onUpdateKit,
  onRemoveKit,
}) => {
  const value: KitListContextType = {
    addKit: onAddKit,
    updateKit: onUpdateKit,
    removeKit: onRemoveKit,
  }

  return (
    <KitListContext.Provider value={value}>
      {children}
    </KitListContext.Provider>
  )
}

export const useKitListContext = () => {
  const context = useContext(KitListContext)
  if (context === undefined) {
    throw new Error('useKitListContext must be used within a KitListProvider')
  }
  return context
}
