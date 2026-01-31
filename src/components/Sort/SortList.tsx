import SVGChecked from '@/assets/svg/Checked.svg'
import { useEvent } from '@/hooks'
import { useTheme } from '@/providers/theme'
import { BottomSheetView } from '@gorhom/bottom-sheet'
import { memo, useRef } from 'react'
import { Pressable, View } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { type SortValue } from '../MedicineList/MedicineList'
import { BottomSheet, BottomSheetRef } from '../BottomSheet'
import { PaddingHorizontal } from '../Layout'
import { ModalSafeAreaView } from '../ModalSafeAreaView'
import { Text } from '../Text'
import { useListStyles } from './useListStyles'

const OPTIONS: { label: string; value: SortValue }[] = [
  { label: 'По названию (А-Я)', value: 'name_asc' },
  { label: 'По названию (Я-А)', value: 'name_desc' },
  { label: 'По количеству (по возрастанию)', value: 'quantity_asc' },
  { label: 'По количеству (по убыванию)', value: 'quantity_desc' },
  { label: 'По дате добавления (новые-старые)', value: 'date_asc' },
  { label: 'По дате добавления (старые-новые)', value: 'date_desc' },
  { label: 'По сроку годности (сначала истекающие)', value: 'expiration_asc' },
  { label: 'По сроку годности (позже истекающие)', value: 'expiration_desc' }
]

interface SortListProps {
  value: SortValue
  onChange: (value: SortValue) => void
}

export const SortList = memo(({ value, onChange }: SortListProps) => {
  const { styles } = useListStyles()
  const { colors } = useTheme()
  const bottomSheetRef = useRef<BottomSheetRef>(null)

  const handlePress = useEvent(() => {
    bottomSheetRef.current?.present()
  })

  const handleDismiss = useEvent(() => {
    bottomSheetRef.current?.dismiss()
  })

  const handleChange = useEvent((newValue: SortValue) => {
    onChange(newValue)
    bottomSheetRef.current?.dismiss()
  })

  return (
    <>
      <Pressable onPress={handlePress}>
        <Icon name='sort' size={22} color={colors.text} />
      </Pressable>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={[]}
        enableDynamicSizing
        onDismiss={handleDismiss}
      >
        <BottomSheetView>
          <ModalSafeAreaView edges={['bottom']}>
            <PaddingHorizontal style={styles.fieldName}>
              <Text style={[styles.fieldNameText, { color: colors.text }]}>Сортировать по:</Text>
            </PaddingHorizontal>
            {OPTIONS.map(item => {
              const isSelected = item.value === value
              return (
                <Pressable
                  key={item.value}
                  onPress={() => handleChange(item.value)}
                  style={({ pressed }) => [styles.item, {
                    opacity: pressed ? 0.7 : 1,
                  }]}
                >
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemText, {
                      color: colors.text
                    }]}>{item.label}</Text>
                  </View>
                  {isSelected && <SVGChecked fill={colors.success} />}
                </Pressable>
              )
            })}
          </ModalSafeAreaView>
        </BottomSheetView>
      </BottomSheet>
    </>
  )
})
