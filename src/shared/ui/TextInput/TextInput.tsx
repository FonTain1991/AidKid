import { Pressable, TextInput as RNTextInput, TextInputProps as RNTextInputProps, Text, View } from 'react-native'
import { useRef, useState } from 'react'
import Animated, { useSharedValue, withTiming, useAnimatedStyle, interpolate } from 'react-native-reanimated'
import { useTextInputStyles } from './useTextInputStyles'
import { useEvent } from '@/shared/hooks'
import { FONT_SIZE } from '@/shared/config/constants/font'

interface TextInputProps extends RNTextInputProps {
  label?: string
  error?: string
}

export const TextInput = ({ label, error, style, value, onFocus, onBlur, ...props }: TextInputProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const animatedValue = useSharedValue(0)
  const { styles } = useTextInputStyles(error, isFocused, value)
  const inputRef = useRef<RNTextInput>(null)
  const isActive = isFocused || (value && value.length > 0)

  // Анимируем значение при изменении состояния
  animatedValue.value = withTiming(isActive ? 1 : 0, { duration: 200 })

  const handleFocus = useEvent((e: any) => {
    setIsFocused(true)
    onFocus?.(e)
  })

  const handleBlur = useEvent((e: any) => {
    setIsFocused(false)
    onBlur?.(e)
  })

  // Анимированный стиль для label
  const animatedLabelStyle = useAnimatedStyle(() => {
    const translateY = interpolate(animatedValue.value, [0, 1], [0, -12])
    const fontSize = interpolate(animatedValue.value, [0, 1], [FONT_SIZE.lg, FONT_SIZE.sm])

    return {
      transform: [{ translateY }],
      fontSize,
    }
  })

  const setFocus = useEvent((e: any) => {
    inputRef.current?.focus()
    onFocus?.(e)
  })

  return (
    <View>
      <Pressable style={styles.inputContainer} onPress={setFocus}>
        {label && (
          <Animated.Text style={[styles.label, animatedLabelStyle]} >
            {label}
          </Animated.Text>
        )}
        <RNTextInput
          ref={inputRef}
          style={[styles.input, style]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          {...props}
        />
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}
