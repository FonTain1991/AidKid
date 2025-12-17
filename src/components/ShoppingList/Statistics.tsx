import { RADIUS, SPACING } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { useAppStore } from '@/store'
import { memo, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from '../Text'

export const Statistics = memo(() => {
  const { shoppingList } = useAppStore(state => state)
  const { colors } = useTheme()
  const stats = useMemo(() => ({
    total: shoppingList.length,
    pending: shoppingList.filter(i => !i.isPurchased).length,
    purchased: shoppingList.filter(i => i.isPurchased).length
  }), [shoppingList])

  return (
    <View style={styles.statsContainer}>
      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {stats.total}
        </Text>
        <Text style={[styles.statLabel, { color: colors.muted }]}>
          Всего
        </Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.statValue, { color: '#FF9800' }]}>
          {stats.pending}
        </Text>
        <Text style={[styles.statLabel, { color: colors.muted }]}>
          Не куплено
        </Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.statValue, { color: '#4CAF50' }]}>
          {stats.purchased}
        </Text>
        <Text style={[styles.statLabel, { color: colors.muted }]}>
          Куплено
        </Text>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: 12
  },
  statCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center'
  },
  statValue: {
    fontSize: FONT_SIZE.heading,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.xs
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium
  }
})