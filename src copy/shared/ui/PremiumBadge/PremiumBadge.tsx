/**
 * Компонент бейджа "Premium" для премиум функций
 */

import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'

interface PremiumBadgeProps {
  /** Компактный режим */
  compact?: boolean
  
  /** Размер бейджа */
  size?: 'small' | 'medium' | 'large'
}

export function PremiumBadge({ compact = false, size = 'medium' }: PremiumBadgeProps) {
  const { colors } = useTheme()

  const sizeStyles = {
    small: {
      paddingHorizontal: SPACING.xs,
      paddingVertical: 2,
      fontSize: FONT_SIZE.xs,
    },
    medium: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      fontSize: FONT_SIZE.sm,
    },
    large: {
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
      fontSize: FONT_SIZE.md,
    },
  }

  const styles = StyleSheet.create({
    badge: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      alignSelf: 'flex-start',
      ...sizeStyles[size],
    },
    text: {
      color: colors.white,
      fontFamily: 'Roboto-Bold',
      fontSize: sizeStyles[size].fontSize,
    },
  })

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>💎 Premium</Text>
    </View>
  )
}

