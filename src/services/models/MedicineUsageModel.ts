import { BaseModel } from './BaseModel'

export interface MedicineUsage {
  id?: number | null
  medicineId: number
  familyMemberId: number | null
  quantityUsed: number
  usageDate: string
  notes?: string | null
  createdAt?: number
  medicineName?: string | null
  kitName?: string | null
  unitForQuantity?: string | null
}

export interface CreateMedicineUsageData {
  medicineId: number
  familyMemberId?: number | null
  quantityUsed: number
  usageDate?: string
  notes?: string | null
}

interface MedicineUsageSnapshot {
  medicineName: string | null
  kitName: string | null
  unitForQuantity: string | null
}

class MedicineUsageModel extends BaseModel {
  private mapRow(row: Record<string, unknown>): MedicineUsage {
    return {
      id: row.id as number,
      medicineId: row.medicineId as number,
      familyMemberId: row.familyMemberId as number | null,
      quantityUsed: row.quantityUsed as number,
      usageDate: row.usageDate as string,
      notes: row.notes as string | null,
      createdAt: row.createdAt as number,
      medicineName: (row.medicineName as string | null | undefined) ?? null,
      kitName: (row.kitName as string | null | undefined) ?? null,
      unitForQuantity: (row.unitForQuantity as string | null | undefined) ?? null,
    }
  }

  private async getMedicineSnapshot(medicineId: number): Promise<MedicineUsageSnapshot> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT m.name as medicineName, mk.name as kitName, m.unitForQuantity, m.unit
      FROM medicines m
      LEFT JOIN medicine_kits mk ON mk.id = m.medicineKitId
      WHERE m.id = ?
    `, [medicineId])

    if (results.rows.length === 0) {
      return {
        medicineName: null,
        kitName: null,
        unitForQuantity: null,
      }
    }

    const row = results.rows.item(0)
    return {
      medicineName: row.medicineName ?? null,
      kitName: row.kitName ?? null,
      unitForQuantity: row.unitForQuantity || row.unit || 'pcs',
    }
  }

  async create(data: CreateMedicineUsageData): Promise<MedicineUsage | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const usageDate = data.usageDate || new Date().toISOString()
    const snapshot = await this.getMedicineSnapshot(data.medicineId)

    const [result] = await this.db.executeSql(`
      INSERT INTO medicine_usage (
        id, medicineId, familyMemberId, quantityUsed, usageDate, notes, createdAt,
        medicineName, kitName, unitForQuantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      null,
      data.medicineId,
      data.familyMemberId || null,
      data.quantityUsed,
      usageDate,
      data.notes || null,
      Date.now(),
      snapshot.medicineName,
      snapshot.kitName,
      snapshot.unitForQuantity,
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
      usages.push(this.mapRow(results.rows.item(i)))
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

    return this.mapRow(results.rows.item(0))
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
      usages.push(this.mapRow(results.rows.item(i)))
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

