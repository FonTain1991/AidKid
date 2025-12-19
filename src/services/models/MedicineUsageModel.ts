import { BaseModel } from './BaseModel'

export interface MedicineUsage {
  id?: number | null
  medicineId: number
  familyMemberId: number | null
  quantityUsed: number
  usageDate: string
  notes?: string | null
  createdAt?: number
}

export interface CreateMedicineUsageData {
  medicineId: number
  familyMemberId?: number | null
  quantityUsed: number
  usageDate?: string
  notes?: string | null
}

class MedicineUsageModel extends BaseModel {
  async create(data: CreateMedicineUsageData): Promise<MedicineUsage | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const usageDate = data.usageDate || new Date().toISOString()

    const [result] = await this.db.executeSql(`
      INSERT INTO medicine_usage (
        id, medicineId, familyMemberId, quantityUsed, usageDate, notes, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      null,
      data.medicineId,
      data.familyMemberId || null,
      data.quantityUsed,
      usageDate,
      data.notes || null,
      Date.now()
    ])

    return await this.getById(result.insertId)
  }

  async getAll(): Promise<MedicineUsage[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    const [results] = await this.db.executeSql(`
      SELECT * FROM medicine_usage ORDER BY usageDate DESC
    `)

    const usages: MedicineUsage[] = []
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      usages.push({
        id: row.id,
        medicineId: row.medicineId,
        familyMemberId: row.familyMemberId,
        quantityUsed: row.quantityUsed,
        usageDate: row.usageDate,
        notes: row.notes,
        createdAt: row.createdAt,
      })
    }

    return usages
  }

  async getById(id: number): Promise<MedicineUsage | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM medicine_usage WHERE id = ?
    `, [id])

    if (results.rows.length === 0) {
      return null
    }

    const row = results.rows.item(0)
    return {
      id: row.id,
      medicineId: row.medicineId,
      familyMemberId: row.familyMemberId,
      quantityUsed: row.quantityUsed,
      usageDate: row.usageDate,
      notes: row.notes,
      createdAt: row.createdAt,
    }
  }

  async getByMedicineId(medicineId: number): Promise<MedicineUsage[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM medicine_usage WHERE medicineId = ? ORDER BY usageDate DESC
    `, [medicineId])

    const usages: MedicineUsage[] = []
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      usages.push({
        id: row.id,
        medicineId: row.medicineId,
        familyMemberId: row.familyMemberId,
        quantityUsed: row.quantityUsed,
        usageDate: row.usageDate,
        notes: row.notes,
        createdAt: row.createdAt,
      })
    }

    return usages
  }

  async delete(id: number): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    await this.db.executeSql(`
      DELETE FROM medicine_usage WHERE id = ?
    `, [id])
  }
}

export const medicineUsageModel = new MedicineUsageModel()

