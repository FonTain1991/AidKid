import { create } from 'zustand'
import { MedicineKit, CreateKitData, UpdateKitData } from './types'
import { kitApi } from '../api'

interface KitStore {
  // Состояние
  kits: MedicineKit[]
  isLoading: boolean
  error: string | null

  // Действия
  loadKits: () => Promise<void>
  addKit: (kit: CreateKitData) => Promise<void>
  updateKit: (id: string, updates: UpdateKitData) => Promise<void>
  deleteKit: (id: string) => Promise<void>
  clearError: () => void
  clearDatabase: () => Promise<void>
}

export const useKitStore = create<KitStore>((set, get) => ({
  // Начальное состояние
  kits: [],
  isLoading: false,
  error: null,

  // Загрузка аптечек
  loadKits: async () => {
    set({ isLoading: true, error: null })

    try {
      const kits = await kitApi.getKits()
      set({ kits, isLoading: false })
      console.log('Аптечки загружены:', kits.length)
    } catch (error) {
      console.error('Ошибка загрузки аптечек:', error)
      set({
        error: error instanceof Error ? error.message : 'Ошибка загрузки аптечек',
        isLoading: false
      })
    }
  },

  // Добавление аптечки
  addKit: async (kitData) => {
    set({ isLoading: true, error: null })

    try {
      const newKit = await kitApi.createKit(kitData)

      // Обновляем локальное состояние
      set(state => ({
        kits: [...state.kits, newKit],
        isLoading: false
      }))

      console.log('Аптечка добавлена:', newKit.id)
    } catch (error) {
      console.error('Ошибка добавления аптечки:', error)
      set({
        error: error instanceof Error ? error.message : 'Ошибка добавления аптечки',
        isLoading: false
      })
    }
  },

  // Обновление аптечки
  updateKit: async (id, updates) => {
    set({ isLoading: true, error: null })

    try {
      await kitApi.updateKit(id, updates)

      // Обновляем локальное состояние
      set(state => ({
        kits: state.kits.map(kit =>
          kit.id === id
            ? { ...kit, ...updates, updatedAt: new Date() }
            : kit
        ),
        isLoading: false
      }))

      console.log('Аптечка обновлена:', id)
    } catch (error) {
      console.error('Ошибка обновления аптечки:', error)
      set({
        error: error instanceof Error ? error.message : 'Ошибка обновления аптечки',
        isLoading: false
      })
    }
  },

  // Удаление аптечки
  deleteKit: async (id) => {
    set({ isLoading: true, error: null })

    try {
      await kitApi.deleteKit(id)

      // Удаляем из локального состояния
      set(state => ({
        kits: state.kits.filter(kit => kit.id !== id),
        isLoading: false
      }))

      console.log('Аптечка удалена:', id)
    } catch (error) {
      console.error('Ошибка удаления аптечки:', error)
      set({
        error: error instanceof Error ? error.message : 'Ошибка удаления аптечки',
        isLoading: false
      })
    }
  },

  // Очистка ошибки
  clearError: () => {
    set({ error: null })
  },

  // Очистка базы данных
  clearDatabase: async () => {
    set({ isLoading: true, error: null })
    try {
      await kitApi.clearDatabase()
      set({ kits: [], isLoading: false })
      console.log('База данных очищена, состояние сброшено')
    } catch (error) {
      console.error('Ошибка очистки базы данных:', error)
      set({
        error: error instanceof Error ? error.message : 'Ошибка очистки базы данных',
        isLoading: false
      })
    }
  }
}))
