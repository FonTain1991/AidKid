import { FONT_SIZE } from '@/constants/font'
import { useEvent } from '@/hooks'
import React, { useRef, useState } from 'react'
import { Pressable, TextInput as RNTextInput, TextInputProps as RNTextInputProps, View } from 'react-native'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useTextareaStyles } from './useTextareaStyles'
import { Text } from '@/components/Text'

interface TextareaProps extends Omit<RNTextInputProps, 'multiline'> {
  label?: string
  error?: string
  numberOfLines?: number
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  style,
  value,
  onFocus,
  onBlur,
  numberOfLines = 3,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const animatedValue = useSharedValue(0)
  const { styles } = useTextareaStyles({ error, isFocused, value, numberOfLines })
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

  const setFocus = useEvent((e: any) => {
    inputRef.current?.focus()
    onFocus?.(e)
  })

  // Анимированный стиль для label
  const animatedLabelStyle = useAnimatedStyle(() => {
    const translateY = interpolate(animatedValue.value, [0, 1], [0, -42])
    const fontSize = interpolate(animatedValue.value, [0, 1], [FONT_SIZE.lg, FONT_SIZE.sm])

    return {
      transform: [{ translateY }],
      fontSize,
    }
  })

  // Анимированный стиль для контейнера
  const animatedContainerStyle = useAnimatedStyle(() => {
    const height = interpolate(animatedValue.value, [0, 1], [50, 50 + (numberOfLines * 20)])

    return {
      height,
    }
  })

  return (
    <View>
      <Pressable style={styles.inputContainer} onPress={setFocus}>
        <Animated.View style={[styles.animatedContainer, animatedContainerStyle]}>
          {label && (
            <Animated.Text style={[styles.label, animatedLabelStyle]}>
              {label}
            </Animated.Text>
          )}
          <RNTextInput
            ref={inputRef}
            style={[styles.input, style]}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={value}
            multiline={true}
            numberOfLines={numberOfLines}
            textAlignVertical={isActive ? 'top' : 'center'}
            {...props}
          />
        </Animated.View>
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}
