import { Text } from '@/components/Text'
import React from 'react'
import { Pressable, StyleProp, TextStyle, View, ViewStyle } from 'react-native'
import { useListButtonStyles } from './useListButtonStyles'

interface ListButtonProps {
  fieldName?: string
  value?: string
  placeholder?: string
  onPress: () => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  showArrow?: boolean
  error?: string | null | undefined
}

export const ListButton: React.FC<ListButtonProps> = ({
  fieldName,
  value,
  onPress,
  disabled = false,
  style,
  textStyle,
  showArrow = true,
  error
}) => {
  const { styles } = useListButtonStyles(value)

  return (
    <>

      <Pressable
        style={({ pressed }) => [
          styles.base,
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
          error && styles.error,
          style
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <View style={styles.content}>
          <View style={styles.textContainer}>
            {fieldName && (
              <Text style={[styles.fieldName, textStyle, error && styles.errorField]} numberOfLines={1}>
                {fieldName}
              </Text>
            )}
            {value && (
              <Text style={styles.value} numberOfLines={1}>
                {value}
              </Text>
            )}
          </View>
          <View style={styles.arrowContainer}>
            {showArrow && <View style={styles.arrow} />}
          </View>
        </View>
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </>
  )
}
