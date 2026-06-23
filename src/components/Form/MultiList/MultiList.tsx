import SVGChecked from '@/assets/svg/Checked.svg'
import { BottomSheet, BottomSheetRef } from '@/components/BottomSheet'
import { PaddingHorizontal } from '@/components/Layout'
import { ModalSafeAreaView } from '@/components/ModalSafeAreaView'
import { Separator } from '@/components/Separator'
import { Text } from '@/components/Text'
import { HEIGHT, IS_ANDROID, SPACING } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useEvent } from '@/hooks'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/providers/theme'
import { BottomSheetFlatList, BottomSheetView } from '@gorhom/bottom-sheet'
import { memo, useMemo, useRef } from 'react'
import { Keyboard, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ListButton } from '../ListButton'
import { useListStyles } from './useMultiListStyles'

interface ListProps {
  value?: string[] | number[]
  onChange?: (value: any) => void
  options: { label: string, subtitle?: string, value: string | number }[]
  fieldName?: string
  error?: string | null | undefined
}

export const MultiList = memo(({ value, onChange, options, fieldName, error }: ListProps) => {
  const { t } = useTranslation()
  const { styles } = useListStyles()
  const { colors } = useTheme()
  const bottomSheetRef = useRef<BottomSheetRef>(null)

  const { bottom } = useSafeAreaInsets()

  const onOpen = useEvent(() => {
    Keyboard.dismiss() // Скрываем клавиатуру при открытии модального окна
    bottomSheetRef.current?.present()
  })

  const handleChange = useEvent((newValue: string) => {
    if (value?.includes(newValue)) {
      onChange?.([...value.filter(item => item !== newValue)])
    } else {
      onChange?.([...(value || []), newValue])
    }
    // bottomSheetRef.current?.dismiss()
  })

  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => (a.label || '').localeCompare(b.label || '', undefined, { sensitivity: 'base' })),
    [options]
  )

  const curValue = useMemo(() => {
    return sortedOptions.filter(item => value?.includes(item.value))
  }, [value, sortedOptions])


  const maxHeight = HEIGHT * 0.9
  const height = (sortedOptions.length * 56) + (IS_ANDROID ? bottom : 0) + (SPACING.md * 2) + (FONT_SIZE.xl * 1.5) + 21
  const isScroll = !!sortedOptions.length && height > maxHeight

  return (
    <View>
      <ListButton
        fieldName={fieldName}
        value={curValue?.map(item => item.label).join(', ')}
        onPress={onOpen}
        error={error}
      />
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={isScroll ? ['90%'] : sortedOptions.length > 0 ? [height] : undefined}
        enableDynamicSizing={!isScroll && !sortedOptions.length}
      >
        {!sortedOptions?.length && (
          <BottomSheetView>
            <ModalSafeAreaView edges={['bottom']} style={{ backgroundColor: colors.background }}>
              <PaddingHorizontal style={styles.fieldName}>
                <Text style={[styles.fieldNameText, { color: colors.text }]}>{fieldName}</Text>
                <Text style={[styles.noItemsText, { color: colors.text }]}>{t('common.noResults')}</Text>
              </PaddingHorizontal>
            </ModalSafeAreaView>
          </BottomSheetView>
        )}
        {!!sortedOptions?.length && (
          <ModalSafeAreaView edges={['bottom']} style={{ backgroundColor: colors.background }}>
            <BottomSheetFlatList
              scrollEnabled={isScroll}
              data={sortedOptions}
              keyExtractor={(item: { label: string, subtitle?: string, value: string }) => item.value}
              ItemSeparatorComponent={() => <Separator />}
              ListHeaderComponent={(
                <PaddingHorizontal style={styles.fieldName}>
                  <Text style={[styles.fieldNameText, { color: colors.text }]}>{fieldName}</Text>
                </PaddingHorizontal>
              )}
              renderItem={({ item }: { item: { label: string, subtitle?: string, value: string } }) => {
                const isSelected = value?.includes(item.value)
                return (
                  <Pressable
                    onPress={() => handleChange(item.value)}
                    style={({ pressed }) => [styles.item, {
                      opacity: pressed ? 0.7 : 1,
                    }]}
                  >
                    <View style={styles.itemContent}>
                      <Text style={[styles.itemText, {
                        color: colors.text
                      }]}>{item.label}</Text>
                      {item.subtitle && (
                        <Text style={[styles.itemSubtitle, { color: colors.muted }]}>{item.subtitle}</Text>
                      )}
                    </View>
                    {isSelected && <SVGChecked fill={colors.success} />}
                  </Pressable>
                )
              }}
            />
          </ModalSafeAreaView>
        )}
      </BottomSheet>
    </View>
  )
})
