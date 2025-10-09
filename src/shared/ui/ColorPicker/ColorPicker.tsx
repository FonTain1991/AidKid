import { BottomSheet, BottomSheetRef } from '@/shared/ui/BottomSheet'
import { Button } from '@/shared/ui/Button'
import { BottomSheetView } from '@gorhom/bottom-sheet'
import React, { useRef } from 'react'
import { Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native'
import ReanimatedColorPicker, { Panel1, Swatches, Preview, HueSlider, OpacitySlider, Panel3 } from 'reanimated-color-picker'
import { useColorPickerStyles } from './useColorPickerStyles'
import { SPACING } from '@/shared/config'

interface ColorPickerProps {
  fieldName?: string
  value?: string
  onColorSelect: (color: string) => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  fieldName,
  value,
  onColorSelect,
  disabled = false,
  style,
  textStyle
}) => {
  const bottomSheetRef = useRef<BottomSheetRef>(null)
  const [currentColor, setCurrentColor] = React.useState(value || '#3A944E')
  const { styles } = useColorPickerStyles(value)

  const handlePress = () => {
    if (!disabled) {
      bottomSheetRef.current?.present()
    }
  }

  const handleColorChange = ({ hex }: { hex: string }) => {
    setCurrentColor(hex)
  }

  const handleConfirm = () => {
    onColorSelect(currentColor)
    bottomSheetRef.current?.dismiss()
  }

  const handleClose = () => {
    bottomSheetRef.current?.dismiss()
  }

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.base,
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
          style
        ]}
        onPress={handlePress}
        disabled={disabled}
      >
        <View style={styles.content}>
          <View style={styles.textContainer}>
            {fieldName && (
              <Text style={[styles.fieldName, textStyle]} numberOfLines={1}>
                {fieldName}
              </Text>
            )}
            {value && (
              <View style={styles.valueContainer}>
                <View style={[styles.colorIndicator, { backgroundColor: value }]} />
                <Text style={styles.value} numberOfLines={1}>
                  {value}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={[]}
        enableDynamicSizing
        onDismiss={handleClose}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.title}>Выберите цвет</Text>

          <View>
            <ReanimatedColorPicker
              value={currentColor}
              onChangeJS={handleColorChange}
            >
              <Preview hideInitialColor />
              <Panel3 style={{ width: '70%', alignSelf: 'center', marginVertical: SPACING.md }} />
              <OpacitySlider style={{ marginVertical: SPACING.md }} />
            </ReanimatedColorPicker>
          </View>

          <View style={styles.buttons}>
            <Button
              title='Отмена'
              onPress={handleClose}
              style={[styles.button, styles.cancelButton]}
              textStyle={styles.cancelButtonText}
            />
            <Button
              title='Выбрать'
              onPress={handleConfirm}
              style={[styles.button, styles.confirmButton]}
            />
          </View>
        </BottomSheetView>
      </BottomSheet>
    </>
  )
}
