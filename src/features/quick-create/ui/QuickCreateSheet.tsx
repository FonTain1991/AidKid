import { BottomSheet, BottomSheetRef } from '@/shared/ui'
import { BottomSheetView } from '@gorhom/bottom-sheet'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { QuickCreateOption } from '../model'
import { useQuickCreateStyles } from './useQuickCreateStyles'

interface QuickCreateSheetProps {
  options: QuickCreateOption[]
  onOptionPress: (option: QuickCreateOption) => void
}

export interface QuickCreateSheetRef {
  present: () => void
  dismiss: () => void
}

export const QuickCreateSheet = forwardRef<QuickCreateSheetRef, QuickCreateSheetProps>(({ options, onOptionPress }, ref) => {
  const styles = useQuickCreateStyles()
  const bottomSheetRef = useRef<BottomSheetRef>(null)

  useImperativeHandle(ref, () => ({
    present: () => bottomSheetRef.current?.present(),
    dismiss: () => bottomSheetRef.current?.dismiss(),
  }))

  return (
    <BottomSheet
      ref={bottomSheetRef}
      enableDynamicSizing
      snapPoints={[]}
    >
      <BottomSheetView>
        <View style={styles.container}>
          <Text style={styles.title}>Быстрое создание</Text>
          <View style={styles.options}>
            {options.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.option}
                onPress={() => {
                  onOptionPress(option)
                  bottomSheetRef.current?.dismiss()
                }}
              >
                <Text style={styles.optionText}>{option.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  )
})
