import { Background, SafeAreaView } from '@/components/Layout'
import { Filters, FloatingButton, ShoppingList, Statistics } from '@/components/ShoppingList'
import { SPACING } from '@/constants'
import { useEvent, useNavigationBarColor, useScreenProperties, useShoppingList } from '@/hooks'
import { useTheme } from '@/providers/theme'
import { useAppStore } from '@/store'
import { memo, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'

export const ShoppingListScreen = memo(() => {
  const { colors } = useTheme()

  const { cleanShoppingList } = useShoppingList()
  const { shoppingList } = useAppStore(state => state)


  const [filter, setFilter] = useState<'all' | 'pending' | 'purchased'>('all')
  const isPurchased = useMemo(() => !!shoppingList.filter(item => item.isPurchased).length, [shoppingList])

  const clearPurchased = useEvent(() => {
    Alert.alert(
      'Очистить купленные',
      'Удалить все купленные товары из списка?',
      [
        {
          text: 'Отмена',
          style: 'cancel'
        },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: cleanShoppingList
        }
      ]
    )
  })

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: 'Список покупок',
      headerRight: () => (
        isPurchased && (
          <Pressable
            onPress={clearPurchased}
          >
            <Icon
              name='trash-2'
              size={22}
              color={colors.error}
            />
          </Pressable>
        )
      )
    }
  })

  useNavigationBarColor()

  return (
    <SafeAreaView edges={['bottom']}>
      <Background>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Statistics />
          <Filters filter={filter} setFilter={setFilter} />
          <ShoppingList filter={filter} />
        </ScrollView>
        <FloatingButton />
      </Background>
    </SafeAreaView>
  )
})

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flex: 1
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  }
})