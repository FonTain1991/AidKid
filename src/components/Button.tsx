import React from 'react'
import { Pressable, StyleSheet, Text, View, ActivityIndicator, StyleProp, TextStyle, ViewStyle } from 'react-native'
import { FONT_FAMILY, FONT_SIZE } from '@/constants/font'
import { SPACING } from '@/constants'
import { useTheme } from '@/providers/theme'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle
}) => {
  const { colors } = useTheme()

  const buttonStyles = [
    styles.base,
    styles[size],
    styles[variant],
    {
      backgroundColor: variant === 'outline' ? 'transparent' : colors.primary,
      borderColor: variant === 'outline' ? colors.primary : 'transparent',
    },
    disabled && styles.disabled,
    style
  ]

  const textStyles = [
    styles.text,
    styles[`${size}Text`],
    {
      color: variant === 'outline' ? colors.primary : colors.card,
    },
    disabled && { color: colors.secondary },
    textStyle
  ]

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.content}>
          <ActivityIndicator
            size='small'
            color={variant === 'outline' ? colors.primary : colors.card}
          />
          <Text style={[textStyles, styles.loadingText]}>{title}</Text>
        </View>
      )
    }

    if (icon) {
      return (
        <View style={styles.content}>
          {iconPosition === 'left' && icon}
          <Text style={textStyles}>{title}</Text>
          {iconPosition === 'right' && icon}
        </View>
      )
    }

    return <Text style={textStyles}>{title}</Text>
  }

  return (
    <Pressable
      style={({ pressed }) => [
        buttonStyles,
        pressed && !disabled && styles.pressed
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {renderContent()}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  // Размеры
  small: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 56,
  },
  // Варианты
  primary: {
    // backgroundColor уже задается динамически
  },
  secondary: {
    // backgroundColor уже задается динамически
  },
  outline: {
    // backgroundColor и borderColor уже задаются динамически
  },
  // Состояния
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  // Текст
  text: {
    fontFamily: FONT_FAMILY.medium,
    textAlign: 'center',
  },
  smallText: {
    fontSize: FONT_SIZE.sm,
  },
  mediumText: {
    fontSize: FONT_SIZE.md,
  },
  largeText: {
    fontSize: FONT_SIZE.lg,
  },
  // Контент
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  loadingText: {
    marginLeft: SPACING.xs,
  },
})
