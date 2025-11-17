import { useState, useCallback } from 'react'
import { Alert } from 'react-native'
import { databaseService, notificationService } from '@/shared/lib'
import type { ShoppingItem } from '@/entities/shopping-item'
import { useEvent } from '@/shared/hooks'

export const useShoppingList = () => {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'purchased'>('all')

  const loadItems = useEvent(async () => {
    try {
      setLoading(true)
      await databaseService.init()
      const allItems = await databaseService.getShoppingItems()
      setItems(allItems)
    } catch (err) {
      console.error('Failed to load shopping items:', err)
      Alert.alert('Ошибка', 'Не удалось загрузить список покупок')
    } finally {
      setLoading(false)
    }
  })

  const addItem = useEvent(async (data: {
    medicineName: string
    description?: string
    quantity?: number
    unit?: string
  }) => {
    try {
      await databaseService.init()
      const newItem = await databaseService.createShoppingItem(data)
      setItems(prev => [newItem, ...prev])
      return true
    } catch (err) {
      console.error('Failed to add shopping item:', err)
      Alert.alert('Ошибка', 'Не удалось добавить товар')
      return false
    }
  })

  const togglePurchased = useEvent(async (itemId: string) => {
    try {
      const item = items.find(i => i.id === itemId)
      if (!item) return

      await databaseService.init()
      await databaseService.updateShoppingItem(itemId, {
        isPurchased: !item.isPurchased
      })

      setItems(prev =>
        prev.map(i =>
          i.id === itemId ? { ...i, isPurchased: !i.isPurchased, updatedAt: new Date() } : i
        )
      )
    } catch (err) {
      console.error('Failed to toggle item:', err)
      Alert.alert('Ошибка', 'Не удалось обновить товар')
    }
  })

  const deleteItem = useEvent(async (itemId: string) => {
    try {
      await databaseService.init()
      await databaseService.deleteShoppingItem(itemId)
      setItems(prev => prev.filter(i => i.id !== itemId))
    } catch (err) {
      console.error('Failed to delete shopping item:', err)
      Alert.alert('Ошибка', 'Не удалось удалить товар')
    }
  })

  const clearPurchased = useEvent(async () => {
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
          onPress: async () => {
            try {
              await databaseService.init()
              await databaseService.clearPurchasedItems()
              setItems(prev => prev.filter(i => !i.isPurchased))
            } catch (err) {
              console.error('Failed to clear purchased items:', err)
              Alert.alert('Ошибка', 'Не удалось очистить список')
            }
          }
        }
      ]
    )
  })

  const filteredItems = items
    .filter(item => {
      if (filter === 'pending') return !item.isPurchased
      if (filter === 'purchased') return item.isPurchased
      return true
    })
    .sort((a, b) => {
      // Во вкладке "Все" сортируем: сначала некупленные, потом купленные
      if (filter === 'all') {
        if (a.isPurchased === b.isPurchased) {
          // Если оба имеют одинаковый статус, сортируем по дате создания (новые сверху)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        // Некупленные (false) должны быть выше купленных (true)
        return a.isPurchased ? 1 : -1
      }
      // Для остальных вкладок сортируем по дате создания (новые сверху)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const setReminder = useEvent(async (reminderDate: Date) => {
    try {
      const success = await notificationService.scheduleShoppingListReminder(reminderDate)
      
      if (success) {
        Alert.alert(
          'Успешно',
          `Напоминание установлено на ${reminderDate.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}`
        )
        return true
      } else {
        Alert.alert('Ошибка', 'Не удалось установить напоминание')
        return false
      }
    } catch (err) {
      console.error('Failed to set reminder:', err)
      Alert.alert('Ошибка', 'Не удалось установить напоминание')
      return false
    }
  })

  const cancelReminder = useEvent(async () => {
    try {
      await notificationService.cancelShoppingListReminder()
      Alert.alert('Успешно', 'Напоминание отменено')
      return true
    } catch (err) {
      console.error('Failed to cancel reminder:', err)
      Alert.alert('Ошибка', 'Не удалось отменить напоминание')
      return false
    }
  })

  const getReminder = useEvent(async () => {
    try {
      return await notificationService.getShoppingListReminder()
    } catch (err) {
      console.error('Failed to get reminder:', err)
      return null
    }
  })

  const stats = {
    total: items.length,
    pending: items.filter(i => !i.isPurchased).length,
    purchased: items.filter(i => i.isPurchased).length
  }

  return {
    items: filteredItems,
    allItems: items,
    loading,
    filter,
    stats,
    setFilter,
    loadItems,
    addItem,
    togglePurchased,
    deleteItem,
    clearPurchased,
    setReminder,
    cancelReminder,
    getReminder
  }
}

