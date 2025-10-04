import { useTheme } from '@/app/providers/theme'
import { BottomSheetView } from '@gorhom/bottom-sheet'
import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { Pressable, Text, View } from 'react-native'
import { BottomSheet, BottomSheetRef } from '../BottomSheet'
import { useListStyles } from '../List/useListStyles'
import { ModalSafeAreaView } from '../ModalSafeAreaView'

interface KitMenuSheetProps {
  onEdit: (kitId: string) => void
  onDelete: (kitId: string) => void
}

export interface KitMenuSheetRef {
  present: (kitId: string, kitName: string) => void
  close: () => void
}

export const KitMenuSheet = forwardRef<KitMenuSheetRef, KitMenuSheetProps>(({ onEdit, onDelete }, ref) => {
  const bottomSheetRef = useRef<BottomSheetRef>(null)
  const { styles } = useListStyles()
  const { colors } = useTheme()
  const currentKitIdRef = useRef<string>('')

  useImperativeHandle(ref, () => ({
    present: (kitId: string, _kitName: string) => {
      currentKitIdRef.current = kitId
      bottomSheetRef.current?.present()
    },
    close: () => {
      bottomSheetRef.current?.dismiss()
    },
  }))

  const handleEdit = () => {
    onEdit(currentKitIdRef.current)
    bottomSheetRef.current?.dismiss()
  }

  const handleDelete = () => {
    onDelete(currentKitIdRef.current)
    bottomSheetRef.current?.dismiss()
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      // snapPoints={['30%']}
      enableDynamicSizing
    >
      <BottomSheetView>
        <ModalSafeAreaView edges={['bottom']} style={{ backgroundColor: colors.bottomBarBackground }}>
          <Pressable
            style={({ pressed }) => [
              styles.item,
              {
                opacity: pressed ? 0.7 : 1,
              }
            ]}
            onPress={handleEdit}
          >
            <View style={styles.itemContent}>
              <Text style={[styles.itemText, { color: colors.text }]}>
                Редактировать
              </Text>
            </View>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.item,
              {
                opacity: pressed ? 0.7 : 1,
              }
            ]}
            onPress={handleDelete}
          >
            <View style={styles.itemContent}>
              <Text style={[styles.itemText, { color: colors.error }]}>
                Удалить
              </Text>
            </View>
          </Pressable>
        </ModalSafeAreaView>
      </BottomSheetView>
    </BottomSheet>
  )
})
