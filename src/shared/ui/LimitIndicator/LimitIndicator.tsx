/**
 * Компонент для отображения индикатора лимита
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import type { LimitCheckResult } from '@/shared/lib/subscriptionLimits'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation/types'
import { useNavigation } from '@react-navigation/native'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

interface LimitIndicatorProps {
  /** Результат проверки лимита */
  limitCheck: LimitCheckResult
  
  /** Текст для отображения (например, "Аптечки", "Лекарства") */
  label: string
  
  /** Показывать ли кнопку "Premium" если лимит достигнут */
  showPremiumButton?: boolean
  
  /** Компактный режим (меньше места) */
  compact?: boolean
}

export function LimitIndicator({
  limitCheck,
  label,
  showPremiumButton = false,
  compact = false,
}: LimitIndicatorProps) {
  const { colors } = useTheme()
  const navigation = useNavigation<NavigationProp>()
  
  const isNearLimit = limitCheck.maxCount !== Infinity && 
    limitCheck.currentCount >= limitCheck.maxCount * 0.8
  
  const isAtLimit = !limitCheck.allowed

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: compact ? SPACING.xs : SPACING.sm,
      paddingHorizontal: compact ? SPACING.sm : SPACING.md,
      backgroundColor: isAtLimit 
        ? (colors.error || '#F44336') + '15'
        : isNearLimit 
        ? (colors.warning || '#FF9800') + '15'
        : colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isAtLimit 
        ? colors.error || '#F44336'
        : isNearLimit
        ? colors.warning || '#FF9800'
        : colors.border,
    },
    content: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    text: {
      fontSize: compact ? FONT_SIZE.sm : FONT_SIZE.md,
      color: colors.text,
    },
    counter: {
      fontSize: compact ? FONT_SIZE.sm : FONT_SIZE.md,
      fontFamily: 'Roboto-Bold',
      color: isAtLimit 
        ? colors.error
        : isNearLimit
        ? colors.warning
        : colors.text,
    },
    badge: {
      backgroundColor: colors.primary,
      paddingHorizontal: SPACING.xs,
      paddingVertical: 2,
      borderRadius: 4,
    },
    badgeText: {
      color: colors.white,
      fontSize: FONT_SIZE.xs,
      fontFamily: 'Roboto-Medium',
    },
    premiumButton: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      backgroundColor: colors.primary,
      borderRadius: 6,
      marginLeft: SPACING.sm,
    },
    premiumButtonText: {
      color: colors.white,
      fontSize: FONT_SIZE.xs,
      fontFamily: 'Roboto-Medium',
    },
  })

  if (limitCheck.maxCount === Infinity) {
    // Premium пользователь - не показываем лимиты
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>{label}:</Text>
        <Text style={styles.counter}>
          {limitCheck.currentCount} / {limitCheck.maxCount}
        </Text>
        {isAtLimit && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Лимит</Text>
          </View>
        )}
        {isNearLimit && !isAtLimit && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>⚠️ Почти</Text>
          </View>
        )}
      </View>
      {showPremiumButton && isAtLimit && (
        <TouchableOpacity
          style={styles.premiumButton}
          onPress={() => navigation.navigate('Subscription')}
        >
          <Text style={styles.premiumButtonText}>💎 Premium</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

