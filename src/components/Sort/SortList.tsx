import SVGChecked from '@/assets/svg/Checked.svg'
import { useEvent } from '@/hooks'
import { useTheme } from '@/providers/theme'
import { BottomSheetView } from '@gorhom/bottom-sheet'
import { memo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { type SortValue } from '../MedicineList/MedicineList'
import { BottomSheet, BottomSheetRef } from '../BottomSheet'
import { PaddingHorizontal } from '../Layout'
import { ModalSafeAreaView } from '../ModalSafeAreaView'
import { Text } from '../Text'
import { useListStyles } from './useListStyles'

const SORT_KEYS: Record<SortValue, string> = {
  name_asc: 'sort.nameAsc',
  name_desc: 'sort.nameDesc',
  quantity_asc: 'sort.quantityAsc',
  quantity_desc: 'sort.quantityDesc',
  date_asc: 'sort.dateAsc',
  date_desc: 'sort.dateDesc',
  expiration_asc: 'sort.expirationAsc',
  expiration_desc: 'sort.expirationDesc',
}

interface SortListProps {
  value: SortValue
  onChange: (value: SortValue) => void
}

export const SortList = memo(({ value, onChange }: SortListProps) => {
  const { t } = useTranslation()
  const { styles } = useListStyles()
  const { colors } = useTheme()
  const bottomSheetRef = useRef<BottomSheetRef>(null)

  const options = Object.entries(SORT_KEYS).map(([val, key]) => ({
    label: t(key),
    value: val as SortValue,
  }))

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
              <Text style={[styles.fieldNameText, { color: colors.text }]}>{t('sort.sortBy')}</Text>
            </PaddingHorizontal>
            {options.map(item => {
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
