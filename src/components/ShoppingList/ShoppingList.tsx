import { SPACING } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { useAppStore } from '@/store'
import { memo, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from '../Text'
import { ShoppingListItem } from './ShoppingListItem'

interface ShoppingListProps {
  filter: 'all' | 'pending' | 'purchased'
}
export const ShoppingList = memo(({ filter }: ShoppingListProps) => {
  const { shoppingList } = useAppStore(state => state)
  const { colors } = useTheme()

  const filteredShoppingList = useMemo(() => {
    return shoppingList.filter(item => {
      if (filter === 'all') {
        return true
      }
      if (filter === 'pending') {
        return !item.isPurchased
      }
      if (filter === 'purchased') {
        return item.isPurchased
      }
      return false
    }).sort((a, b) => (a.isPurchased ?? 0) - (b.isPurchased ?? 0))
  }, [shoppingList, filter])

  if (!shoppingList.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {filter === 'all' && 'Список покупок пуст'}
          {filter === 'pending' && 'Нет товаров для покупки'}
          {filter === 'purchased' && 'Нет купленных товаров'}
        </Text>
        <Text style={[styles.emptyText, { color: colors.muted }]}>
          {filter === 'all' && 'Добавьте первый товар в список'}
          {filter === 'pending' && 'Все товары уже куплены'}
          {filter === 'purchased' && 'Отметьте купленные товары'}
        </Text>
      </View>
    )
  }
  return (
    <View>
      {filteredShoppingList.map(item => (
        <ShoppingListItem
          key={item.id}
          item={item}
        />
      ))}
    </View>
  )
})

const styles = StyleSheet.create({
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  emptyIcon: {
    fontSize: FONT_SIZE.heading * 2,
    marginBottom: SPACING.md
  },
  emptyTitle: {
    fontSize: FONT_SIZE.heading,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.md
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.regular,
    textAlign: 'center'
  }
})