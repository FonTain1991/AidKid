import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert
} from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { useTheme } from '@/app/providers/theme'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { FAB } from '@/shared/ui/FAB'
import { useNavigationBarColor, useScreenProperties } from '@/shared/hooks'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation/types'
import {
  useShoppingList,
  ShoppingListItem,
  ShoppingReminderModal
} from '@/features/shopping-list'
import type { ShoppingItem } from '@/entities/shopping-item'
import { databaseService } from '@/shared/lib'

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShoppingList'>

export function ShoppingListScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const {
    items,
    loading,
    filter,
    stats,
    setFilter,
    loadItems,
    togglePurchased,
    deleteItem,
    clearPurchased,
    setReminder,
    cancelReminder,
    getReminder
  } = useShoppingList()

  const [reminderModalVisible, setReminderModalVisible] = useState(false)
  const [currentReminder, setCurrentReminder] = useState<Date | null>(null)

  useEffect(() => {
    loadItems()
    loadCurrentReminder()
  }, [loadItems])

  // Обновляем список при фокусе экрана (когда возвращаемся с экрана добавления)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadItems()
      loadCurrentReminder()
    })

    return unsubscribe
  }, [navigation, loadItems])

  const loadCurrentReminder = async () => {
    const reminder = await getReminder()
    setCurrentReminder(reminder)
  }

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: 'Список покупок',
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginRight: 16 }}>
          {/* Иконка напоминания */}
          <TouchableOpacity
            onPress={() => setReminderModalVisible(true)}
            style={{ padding: 4 }}
          >
            <Icon
              name={currentReminder ? 'bell' : 'bell'}
              size={22}
              color={currentReminder ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Кнопка очистки */}
          {stats.purchased > 0 && (
            <TouchableOpacity onPress={clearPurchased}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                Очистить
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )
    }
  })
  useNavigationBarColor()

  const handleRefresh = () => {
    loadItems()
  }

  const handleAddItem = () => {
    navigation.navigate('AddShoppingItem')
  }

  const handleSetReminder = async (date: Date) => {
    const success = await setReminder(date)
    if (success) {
      setCurrentReminder(date)
    }
  }

  const handleCancelReminder = async () => {
    const success = await cancelReminder()
    if (success) {
      setCurrentReminder(null)
    }
  }

  const handleAddToKit = async (item: ShoppingItem) => {
    try {
      await databaseService.init()

      // Ищем лекарство с таким же названием
      const medicines = await databaseService.getMedicines()
      const existingMedicine = medicines.find(
        med => med.name.toLowerCase() === item.medicineName.toLowerCase()
      )

      if (existingMedicine) {
        // Если лекарство есть - открываем его и удаляем из списка покупок
        Alert.alert(
          'Лекарство найдено',
          `Лекарство "${existingMedicine.name}" уже есть в аптечке. Открыть его?`,
          [
            {
              text: 'Отмена',
              style: 'cancel'
            },
            {
              text: 'Открыть',
              onPress: async () => {
                await deleteItem(item.id)
                navigation.navigate('Medicine', {
                  medicineId: existingMedicine.id,
                  kitId: existingMedicine.kitId,
                  mode: 'edit'
                })
              }
            }
          ]
        )
      } else {
        // Если лекарства нет - открываем форму создания с подставленным названием
        await deleteItem(item.id)
        navigation.navigate('AddMedicine', {
          initialName: item.medicineName,
          initialDescription: item.description
        })
      }
    } catch (err) {
      console.error('Failed to add to kit:', err)
      Alert.alert('Ошибка', 'Не удалось добавить лекарство в аптечку')
    }
  }

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Статистика */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.total}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Всего
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: '#FF9800' }]}>
              {stats.pending}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Не куплено
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {stats.purchased}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Куплено
            </Text>
          </View>
        </View>

        {/* Фильтры */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity
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
          </TouchableOpacity>

          <TouchableOpacity
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
          </TouchableOpacity>

          <TouchableOpacity
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
          </TouchableOpacity>
        </View>

        {/* Список товаров */}
        <View style={styles.listContainer}>
          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {filter === 'all' && 'Список покупок пуст'}
                {filter === 'pending' && 'Нет товаров для покупки'}
                {filter === 'purchased' && 'Нет купленных товаров'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {filter === 'all' && 'Добавьте первый товар в список'}
                {filter === 'pending' && 'Все товары уже куплены'}
                {filter === 'purchased' && 'Отметьте купленные товары'}
              </Text>
            </View>
          ) : (
            items.map(item => (
              <ShoppingListItem
                key={item.id}
                item={item}
                onToggle={togglePurchased}
                onDelete={deleteItem}
                onAddToKit={handleAddToKit}
              />
            ))
          )}
        </View>
      </ScrollView>

      <FAB onPress={handleAddItem} />

      {/* Модальное окно напоминания */}
      <ShoppingReminderModal
        visible={reminderModalVisible}
        currentReminder={currentReminder}
        onClose={() => setReminderModalVisible(false)}
        onSetReminder={handleSetReminder}
        onCancelReminder={handleCancelReminder}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scroll: {
    flex: 1
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500'
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center'
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600'
  },
  listContainer: {
    padding: 16,
    paddingTop: 0
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center'
  }
})

