import { databaseService } from '@/shared/lib/database'
import {
  Medicine,
  MedicineStock,
  MedicineUsage,
  MedicineForm,
  MeasurementUnit,
  CreateMedicineData,
  UpdateMedicineData,
  CreateMedicineStockData,
  UpdateMedicineStockData,
  CreateMedicineUsageData,
  MedicineWithStock
} from '../model/types'
import { generateId } from '@/shared/lib'

class MedicineService {
  // CRUD операции для лекарств
  async createMedicine(medicineData: CreateMedicineData): Promise<Medicine> {
    const id = generateId()
    const now = new Date()

    const newMedicine: Medicine = {
      ...medicineData,
      id,
      createdAt: now,
      updatedAt: now
    }

    await databaseService.createMedicine(newMedicine)
    return newMedicine
  }

  async getMedicines(): Promise<Medicine[]> {
    return await databaseService.getMedicines()
  }

  async getMedicinesByKitId(kitId: string): Promise<Medicine[]> {
    return await databaseService.getMedicinesByKitId(kitId)
  }

  async getMedicineById(id: string): Promise<Medicine | null> {
    return await databaseService.getMedicineById(id)
  }

  async updateMedicine(id: string, updates: UpdateMedicineData): Promise<void> {
    await databaseService.updateMedicine(id, updates)
  }

  async deleteMedicine(id: string): Promise<void> {
    await databaseService.deleteMedicine(id)
  }

  // CRUD операции для запасов
  async createMedicineStock(stockData: CreateMedicineStockData): Promise<MedicineStock> {
    const id = generateId()
    const now = new Date()

    const newStock: MedicineStock = {
      ...stockData,
      id,
      createdAt: now,
      updatedAt: now
    }

    await databaseService.createMedicineStock(newStock)
    return newStock
  }

  async getMedicineStock(medicineId: string): Promise<MedicineStock | null> {
    return await databaseService.getMedicineStock(medicineId)
  }

  async updateMedicineStock(id: string, updates: UpdateMedicineStockData): Promise<void> {
    await databaseService.updateMedicineStock(id, updates)
  }

  async deleteMedicineStock(id: string): Promise<void> {
    await databaseService.deleteMedicineStock(id)
  }

  // CRUD операции для использования
  async createMedicineUsage(usageData: CreateMedicineUsageData): Promise<MedicineUsage> {
    const id = generateId()
    const now = new Date()

    const newUsage: MedicineUsage = {
      ...usageData,
      id,
      createdAt: now
    }

    await databaseService.createMedicineUsage(newUsage)
    return newUsage
  }

  async getMedicineUsage(medicineId: string): Promise<MedicineUsage[]> {
    return await databaseService.getMedicineUsage(medicineId)
  }

  // Справочные данные
  async getMedicineForms(): Promise<MedicineForm[]> {
    return databaseService.getMedicineForms()
  }

  async getMeasurementUnits(): Promise<MeasurementUnit[]> {
    return databaseService.getMeasurementUnits()
  }

  // Расширенные методы
  async useMedicine(medicineId: string, quantityUsed: number, notes?: string): Promise<void> {
    // Создаем запись об использовании
    await this.createMedicineUsage({
      medicineId,
      quantityUsed,
      usageDate: new Date(),
      notes
    })

    // Обновляем количество в запасах
    const stock = await this.getMedicineStock(medicineId)
    if (stock) {
      const newQuantity = Math.max(0, stock.quantity - quantityUsed)
      await this.updateMedicineStock(stock.id, { quantity: newQuantity })
    }
  }
}

export const medicineService = new MedicineService()
