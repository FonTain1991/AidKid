import { SPACING, WIDTH } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { memo, useEffect, useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Text } from '../Text'

const COLOR_OPTIONS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2']
interface ColorsProps {
  onChange?: (color: string) => void
  value?: string
}
export const Colors = memo(({ onChange, value }: ColorsProps) => {
  const { colors } = useTheme()
  const [selectedColor, setSelectedColor] = useState(value || COLOR_OPTIONS[0])

  const handleChange = (color: string) => {
    setSelectedColor(color)
    onChange?.(color)
  }

  useEffect(() => {
    setSelectedColor(value || COLOR_OPTIONS[0])
  }, [value])

  return (
    <View>
      {/* Выбор цвета */}
      <Text style={[styles.formLabel, { color: colors.text }]}>Цвет</Text>
      <View style={styles.colorGrid}>
        {COLOR_OPTIONS.map(color => (
          <TouchableOpacity
            key={color}
            activeOpacity={0.8}
            style={[
              styles.colorOption,
              {
                backgroundColor: color,
                borderColor: selectedColor === color ? colors.text : 'transparent',
                borderWidth: selectedColor === color ? 2 : 0
              }
            ]}
            onPress={() => handleChange(color)}
          />
        ))}
      </View>
    </View>
  )
})

const width = (WIDTH - (SPACING.md * 2) - (SPACING.sm * 5)) / 6
const styles = StyleSheet.create({
  formLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm
  },
  colorOption: {
    width,
    height: width,
    borderRadius: width / 2
  }
})