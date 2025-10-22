import { googleDriveService } from './googleDrive'
import { backupService } from './backup'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface SyncStatus {
  isEnabled: boolean
  lastSyncTime: string | null
  isSyncing: boolean
  hasChanges: boolean
}

class FamilySyncService {
  private readonly SYNC_ENABLED_KEY = 'family_sync_enabled'
  private readonly LAST_SYNC_KEY = 'family_last_sync_time'
  private readonly SYNC_INTERVAL = 5 * 60 * 1000 // 5 минут

  // Включить/выключить синхронизацию
  async setSyncEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SYNC_ENABLED_KEY, enabled.toString())
    } catch (error) {
      console.error('Failed to set sync enabled:', error)
    }
  }

  // Проверить, включена ли синхронизация
  async isSyncEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(this.SYNC_ENABLED_KEY)
      return enabled === 'true'
    } catch (error) {
      return false
    }
  }

  // Получить статус синхронизации
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const isEnabled = await this.isSyncEnabled()
      const lastSyncTime = await AsyncStorage.getItem(this.LAST_SYNC_KEY)

      // Проверяем, есть ли изменения в облаке
      const changes = await googleDriveService.getFamilyDataChanges()

      return {
        isEnabled,
        lastSyncTime,
        isSyncing: false,
        hasChanges: changes.hasChanges
      }
    } catch (error) {
      return {
        isEnabled: false,
        lastSyncTime: null,
        isSyncing: false,
        hasChanges: false
      }
    }
  }

  // Синхронизировать данные с семейной группой
  async syncFamilyData(): Promise<boolean> {
    try {
      const isEnabled = await this.isSyncEnabled()
      if (!isEnabled) {
        return false
      }

      // Проверяем, есть ли семейная группа
      const familyGroup = await googleDriveService.getFamilyGroup()
      if (!familyGroup) {
        return false
      }

      // Экспортируем локальные данные
      const localData = await backupService.exportDatabaseData()

      // Синхронизируем с семейной группой
      const syncedData = await googleDriveService.syncWithFamilyGroup(localData)

      // Если данные изменились, импортируем их
      if (syncedData && syncedData !== localData) {
        await backupService.importDatabaseData(syncedData)
      }

      // Обновляем время последней синхронизации
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, new Date().toISOString())

      return true
    } catch (error) {
      console.error('Failed to sync family data:', error)
      return false
    }
  }

  // Автоматическая синхронизация (вызывается периодически)
  async autoSync(): Promise<void> {
    try {
      const isEnabled = await this.isSyncEnabled()
      if (!isEnabled) {
        return
      }

      const lastSync = await AsyncStorage.getItem(this.LAST_SYNC_KEY)
      if (lastSync) {
        const timeSinceLastSync = Date.now() - new Date(lastSync).getTime()
        if (timeSinceLastSync < this.SYNC_INTERVAL) {
          return // Слишком рано для следующей синхронизации
        }
      }

      await this.syncFamilyData()
    } catch (error) {
      console.error('Auto sync failed:', error)
    }
  }

  // Принудительная синхронизация
  async forceSync(): Promise<boolean> {
    try {
      const familyGroup = await googleDriveService.getFamilyGroup()
      if (!familyGroup) {
        throw new Error('Семейная группа не найдена')
      }

      // Экспортируем локальные данные
      const localData = await backupService.exportDatabaseData()

      // Загружаем в облако
      await googleDriveService.uploadFamilyData(localData)

      // Обновляем время последней синхронизации
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, new Date().toISOString())

      return true
    } catch (error) {
      console.error('Force sync failed:', error)
      throw error
    }
  }

  // Загрузить данные из семейной группы
  async pullFamilyData(): Promise<boolean> {
    try {
      const familyGroup = await googleDriveService.getFamilyGroup()
      if (!familyGroup) {
        return false
      }

      // Загружаем данные из облака
      const cloudData = await googleDriveService.syncFamilyData()
      if (!cloudData) {
        return false
      }

      // Импортируем данные в локальную базу
      await backupService.importDatabaseData(cloudData.data)

      // Обновляем время последней синхронизации
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, new Date().toISOString())

      return true
    } catch (error) {
      console.error('Failed to pull family data:', error)
      return false
    }
  }

  // Получить информацию о семейной группе для синхронизации
  async getFamilyGroupInfo(): Promise<{ name: string; members: number; lastSync: string | null } | null> {
    try {
      const familyGroup = await googleDriveService.getFamilyGroup()
      if (!familyGroup) {
        return null
      }

      const lastSync = await AsyncStorage.getItem(this.LAST_SYNC_KEY)

      return {
        name: familyGroup.name,
        members: familyGroup.members.length,
        lastSync
      }
    } catch (error) {
      return null
    }
  }

  // Очистить данные синхронизации
  async clearSyncData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SYNC_ENABLED_KEY)
      await AsyncStorage.removeItem(this.LAST_SYNC_KEY)
      await AsyncStorage.removeItem('family_data_last_sync')
    } catch (error) {
      console.error('Failed to clear sync data:', error)
    }
  }
}

export const familySyncService = new FamilySyncService()
