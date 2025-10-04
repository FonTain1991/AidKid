import React, { ReactNode } from 'react'
import { useKitList } from '@/features/kit-list'
import { KitListProvider as KitListContextProvider } from '@/features/kit-list'

interface KitListProviderProps {
  children: ReactNode
}

export const KitListProvider: React.FC<KitListProviderProps> = ({ children }) => {
  const { addKitToList, updateKitInList, removeKitFromList } = useKitList()

  return (
    <KitListContextProvider
      onAddKit={addKitToList}
      onUpdateKit={updateKitInList}
      onRemoveKit={removeKitFromList}
    >
      {children}
    </KitListContextProvider>
  )
}
