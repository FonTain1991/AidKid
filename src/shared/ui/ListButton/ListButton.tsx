import React from 'react'
import { Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native'
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
}

export const ListButton: React.FC<ListButtonProps> = ({
  fieldName,
  value,
  onPress,
  disabled = false,
  style,
  textStyle,
  showArrow = true
}) => {
  const { styles } = useListButtonStyles(value)

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style
      ]}
      onPress={onPress}
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
  )
}
