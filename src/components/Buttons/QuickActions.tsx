import { RADIUS, SPACING } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useMyNavigation } from '@/hooks'
import { useTheme } from '@/providers/theme'
import { memo, useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { PaddingHorizontal } from '../Layout'
import { Text } from '../Text'


interface QuickActionsButtonProps {
  action: {
    title: string
    description: string
    icon: string
    color: string
    onPress: () => void
  }
}
const QuickActionsButton = memo(({ action }: QuickActionsButtonProps) => {
  const { colors } = useTheme()
  return (
    <Pressable
      style={[styles.quickActionCard, { backgroundColor: action.color }]}
      onPress={action.onPress}
    >
      <Text style={styles.quickActionIcon}>{action.icon}</Text>
      <Text style={[styles.quickActionTitle, { color: colors.headerColor }]}>{action.title}</Text>
      <Text style={[styles.quickActionDescription, { color: colors.headerColor }]}>{action.description}</Text>
    </Pressable>

  )
})

export function QuickActions() {
  const { colors } = useTheme()
  const { navigate } = useMyNavigation()

  const quickActions = useMemo(() => [
    {
      title: 'Быстрый прием',
      description: 'Отметить прием лекарства',
      icon: '💊',
      color: colors.primary,
      onPress: () => {
        navigate('quickIntake')
      },
    },
    {
      title: 'Добавить напоминание',
      description: 'Создать новое напоминание',
      icon: '➕',
      color: colors.secondary,
      onPress: () => {
        navigate('AddReminder')
      },
    },
  ], [colors, navigate])

  return (
    <PaddingHorizontal style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Быстрые действия</Text>

      <View style={styles.quickActionsGrid}>
        {quickActions.map((action, index) => (
          <QuickActionsButton key={index} action={action} />
        ))}
      </View>
    </PaddingHorizontal>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.sm,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  quickActionCard: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: {
    fontSize: FONT_SIZE.xl,
    marginBottom: SPACING.sm,
  },
  quickActionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
  },
  quickActionDescription: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
})