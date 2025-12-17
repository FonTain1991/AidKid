import { Text } from '@/components/Text'
import { RADIUS, SPACING } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { memo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

interface FiltersProps {
  filter: 'all' | 'pending' | 'purchased'
  setFilter: (filter: 'all' | 'pending' | 'purchased') => void
}
export const Filters = memo(({ filter, setFilter }: FiltersProps) => {
  const { colors } = useTheme()
  return (
    <View style={styles.filtersContainer} >
      <Pressable
        style={[
          styles.filterButton,
          { borderColor: colors.border },
          filter === 'all' && { backgroundColor: colors.primary, borderColor: colors.primary }
        ]}
        onPress={() => setFilter('all')}
      >
        <Text
          style={[
            styles.filterText,
            { color: colors.text },
            filter === 'all' && { color: '#FFFFFF' }
          ]}
        >
          Все
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.filterButton,
          { borderColor: colors.border },
          filter === 'pending' && { backgroundColor: colors.primary, borderColor: colors.primary }
        ]}
        onPress={() => setFilter('pending')}
      >
        <Text
          style={[
            styles.filterText,
            { color: colors.text },
            filter === 'pending' && { color: '#FFFFFF' }
          ]}
        >
          Не куплено
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.filterButton,
          { borderColor: colors.border },
          filter === 'purchased' && { backgroundColor: colors.primary, borderColor: colors.primary }
        ]}
        onPress={() => setFilter('purchased')}
      >
        <Text
          style={[
            styles.filterText,
            { color: colors.text },
            filter === 'purchased' && { color: '#FFFFFF' }
          ]}
        >
          Куплено
        </Text>
      </Pressable>
    </View >
  )
})

const styles = StyleSheet.create({
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: 8
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center'
  },
  filterText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium
  },
})