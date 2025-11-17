import React, { useRef } from 'react'
import { FlatList, RefreshControl } from 'react-native'
import { useTheme } from '@/app/providers/theme'
import { KitCard, KitMenuSheet, KitMenuSheetRef } from '@/shared/ui'
import { MedicineKit } from '@/entities/kit/model/types'
import { EmptyState } from './EmptyState'

interface KitListProps {
  kits: MedicineKit[]
  loading: boolean
  onRefresh: () => void
  onKitPress: (kitId: string) => void
  onKitEdit: (kitId: string) => void
  onKitDelete: (kitId: string) => void
  onAddMedicine?: (kitId: string) => void
}

export const KitList: React.FC<KitListProps> = ({
  kits,
  loading,
  onRefresh,
  onKitPress,
  onKitEdit,
  onKitDelete,
  onAddMedicine
}) => {
  const { colors } = useTheme()
  const kitMenuSheetRef = useRef<KitMenuSheetRef>(null)

  const renderKitCard = ({ item }: { item: MedicineKit }) => (
    <KitCard
      id={item.id}
      name={item.name}
      description={item.description}
      color={item.color}
      onPress={onKitPress}
      onMenuPress={kitId => {
        kitMenuSheetRef.current?.present(kitId, item.name)
      }}
      onAddMedicine={onAddMedicine}
    />
  )

  return (
    <>
      <FlatList
        data={kits}
        renderItem={renderKitCard}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={!loading ? <EmptyState /> : null}
        contentContainerStyle={{
          paddingTop: 16,
          flexGrow: 1
        }}
        showsVerticalScrollIndicator={false}
      />

      <KitMenuSheet
        ref={kitMenuSheetRef}
        onEdit={onKitEdit}
        onDelete={onKitDelete}
      />
    </>
  )
}
