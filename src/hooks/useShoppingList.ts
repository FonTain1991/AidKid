import { CreateShoppingListData } from '@/services/models'
import { shoppingListModel } from '@/services/models/ShoppingListModel'
import { useAppStore } from '@/store'
import { useState } from 'react'
import { useEvent } from './useEvent'

type CreateShoppingListPayload = CreateShoppingListData

export function useShoppingList() {
  const {
    setShoppingList,
    addShoppingList,
    updateShoppingList: updateShoppingListStore,
    deleteShoppingList: deleteShoppingListStore
  } = useAppStore(state => state)

  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getAllShoppingList = useEvent(async () => {
    try {
      const shoppingList = await shoppingListModel.getAll()
      setShoppingList(shoppingList)
    } catch (err) {
      console.error(err instanceof Error ? err : new Error('Failed to fetch shopping list'))
    }
  })

  const createShoppingList = useEvent(async (data: CreateShoppingListPayload) => {
    setIsLoading(true)
    setError(null)

    try {
      const shoppingList = await shoppingListModel.create(data)
      if (!shoppingList) {
        throw new Error('Failed to create shopping list')
      }
      addShoppingList(shoppingList)
      return shoppingList
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create shopping list'))
    } finally {
      setIsLoading(false)
    }
  })

  type UpdateShoppingListPayload = Partial<CreateShoppingListData> & { id: number }
  const updateShoppingList = useEvent(async (data: UpdateShoppingListPayload) => {
    setIsLoading(true)
    setError(null)

    try {
      const shoppingList = await shoppingListModel.update(data.id, data)
      updateShoppingListStore(shoppingList)
      return shoppingList
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create shopping list'))
    } finally {
      setIsLoading(false)
    }
  })

  const deleteShoppingList = useEvent(async (id: number) => {
    setIsLoading(true)
    setError(null)

    try {
      await shoppingListModel.delete(id)
      deleteShoppingListStore(id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete shopping list'))
    } finally {
      setIsLoading(false)
    }
  })

  const cleanShoppingList = useEvent(async () => {
    setIsLoading(true)
    setError(null)

    try {
      await shoppingListModel.deleteAll()
      setShoppingList([])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to clean shopping list'))
    } finally {
      setIsLoading(false)
    }
  })


  return {
    getAllShoppingList,
    createShoppingList,
    updateShoppingList,
    deleteShoppingList,
    cleanShoppingList,
    isLoading,
    error,
  }
}