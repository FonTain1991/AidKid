import { databaseService } from './database'
import { MedicineKit, CreateKitData, UpdateKitData } from '../model/types'
import { KitFormData } from '@/features/kit-form/model/types'
import { generateId, notificationService } from '@/shared/lib'

class KitApi {
  async getKits(): Promise<MedicineKit[]> {
    return await databaseService.getKits()
  }

  async getKitById(id: string): Promise<MedicineKit | null> {
    return await databaseService.getKitById(id)
  }

  async createKit(kitData: CreateKitData): Promise<MedicineKit> {
    const id = generateId()
    const now = new Date()

    const newKit: MedicineKit = {
      ...kitData,
      id,
      createdAt: now,
      updatedAt: now
    }

    await databaseService.createKit(newKit)

    // Создаем канал уведомлений для аптечки
    await notificationService.createKitChannel(newKit)

    return newKit
  }

  async updateKit(id: string, updates: UpdateKitData): Promise<void> {
    await databaseService.updateKit(id, updates)
  }

  async deleteKit(id: string): Promise<void> {
    await databaseService.deleteKit(id)

    // Удаляем канал уведомлений аптечки
    await notificationService.deleteKitChannel(id)
  }

  async clearDatabase(): Promise<void> {
    await databaseService.clearDatabase()
  }

  // Методы для работы с формой
  async createKitFromForm(formData: KitFormData): Promise<MedicineKit> {
    const createData: CreateKitData = {
      name: formData.name,
      description: formData.description || undefined,
      color: formData.color,
      parent_id: formData.parent || undefined,
    }

    return await this.createKit(createData)
  }

  async updateKitFromForm(id: string, formData: KitFormData): Promise<void> {
    const updateData: UpdateKitData = {
      name: formData.name,
      description: formData.description || undefined,
      color: formData.color,
      parent_id: formData.parent || undefined,
    }

    await this.updateKit(id, updateData)
  }

  // Конвертация MedicineKit в KitFormData для редактирования
  kitToFormData(kit: MedicineKit): KitFormData {
    return {
      id: kit.id,
      name: kit.name,
      description: kit.description || '',
      parent: kit.parent_id || '',
      color: kit.color,
    }
  }
}

export const kitApi = new KitApi()
