import SVGChecked from '@/assets/svg/Checked.svg'
import { RADIUS } from '@/constants'
import { useTheme } from '@/providers/theme'
import { memo } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

interface CheckboxProps {
  value: boolean
  onChange?: (value: boolean) => void
  disabled?: boolean
}

export const Checkbox = memo(({ value, onChange, disabled = false }: CheckboxProps) => {
  const { colors } = useTheme()
  const scale = useSharedValue(value ? 1 : 0)

  // Анимируем масштаб при изменении значения
  scale.value = withTiming(value ? 1 : 0, { duration: 200 })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }))

  const handlePress = () => {
    if (!disabled) {
      onChange?.(!value)
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        {
          borderColor: value ? colors.primary : colors.border,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <Animated.View style={animatedStyle}>
        {value && (
          <SVGChecked
            width={16}
            height={16}
            style={{ color: colors.primary }}
          />
        )}
      </Animated.View>
    </Pressable>
  )
})

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
