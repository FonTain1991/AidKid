import { View, Text, TouchableOpacity } from 'react-native'
import { BottomSheet, BottomSheetRef } from '@/shared/ui'
import { TabIcon } from '@/shared/ui/TabIcon'
import { useTheme } from '@/app/providers/theme'
import { QuickCreateOption } from '../model'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { useQuickCreateStyles } from './useQuickCreateStyles'
import { BottomSheetView } from '@gorhom/bottom-sheet'

interface QuickCreateSheetProps {
  options: QuickCreateOption[]
  onOptionPress: (option: QuickCreateOption) => void
}

export interface QuickCreateSheetRef {
  present: () => void
  dismiss: () => void
}

export const QuickCreateSheet = forwardRef<QuickCreateSheetRef, QuickCreateSheetProps>(({ options, onOptionPress }, ref) => {
  const { colors } = useTheme()
  const styles = useQuickCreateStyles()
  const bottomSheetRef = useRef<BottomSheetRef>(null)

  useImperativeHandle(ref, () => ({
    present: () => bottomSheetRef.current?.present(),
    dismiss: () => bottomSheetRef.current?.dismiss(),
  }))

  return (
    <BottomSheet
      ref={bottomSheetRef}
      enableDynamicSizing={true}
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
