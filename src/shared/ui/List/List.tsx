import SVGChecked from '@/shared/assets/svg/Checked.svg'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { memo, useMemo, useRef } from 'react'
import { Pressable, Text, View, Keyboard } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomSheet, BottomSheetRef, Separator } from '../'
import { HEIGHT_SCREEN, IS_ANDROID } from '../../config'
import { useEvent } from '../../hooks'
import { ListButton } from '../ListButton/'
import { ModalSafeAreaView } from '../ModalSafeAreaView'
import { useListStyles } from './useListStyles'
import { useTheme } from '@/app/providers/theme'

interface ListProps {
  value?: any
  onChange?: (value: any) => void
  options: { label: string, subtitle?: string, value: string }[]
  fieldName?: string
}

export const List = memo(({ value, onChange, options, fieldName }: ListProps) => {
  const { styles } = useListStyles()
  const { colors } = useTheme()
  const bottomSheetRef = useRef<BottomSheetRef>(null)

  const { bottom } = useSafeAreaInsets()

  const onOpen = useEvent(() => {
    Keyboard.dismiss() // Скрываем клавиатуру при открытии модального окна
    bottomSheetRef.current?.present()
  })

  const handleChange = useEvent((newValue: string) => {
    onChange?.(newValue)
    bottomSheetRef.current?.dismiss()
  })

  const curValue = useMemo(() => {
    return options.find(item => item.value === value)
  }, [value, options])


  const maxHeight = HEIGHT_SCREEN * 0.9
  const height = (options.length * 56) + (IS_ANDROID ? bottom : 0)
  const isScroll = !!options.length && height > maxHeight

  return (
    <View>
      <ListButton
        fieldName={fieldName}
        value={curValue?.label}
        onPress={onOpen}
      />
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={isScroll ? ['90%'] : options.length > 0 ? [height] : undefined}
        enableDynamicSizing={!isScroll && !options.length}
      >
        <ModalSafeAreaView edges={['bottom']} style={{ backgroundColor: colors.bottomBarBackground }}>
          <BottomSheetFlatList
            scrollEnabled={isScroll}
            data={options}
            keyExtractor={(item: { label: string, subtitle?: string, value: string }) => item.value}
            ItemSeparatorComponent={() => <Separator />}
            renderItem={({ item }: { item: { label: string, subtitle?: string, value: string } }) => {
              const isSelected = item.value === value
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
      </BottomSheet>
    </View>
  )
})
