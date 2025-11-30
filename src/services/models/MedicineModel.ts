import { BaseModel } from './BaseModel'

export interface Medicine {
  id?: number | null
  name: string
  description?: string
  manufacturer?: string
  dosage?: string
  medicineKitId?: number | null
  photoPath?: string | null
  barcode?: string | null
  unit?: string | null
  quantity?: number | null
  unitForQuantity?: string | null
  expirationDate: number
  createdAt?: number
  updatedAt?: number
}

export interface CreateMedicineData {
  name: string
  description?: string
  manufacturer?: string
  dosage?: string
  medicineKitId?: number | null
  photoPath?: string | null
  barcode?: string | null
  unit?: string | null
  quantity?: number | null
  unitForQuantity?: string | null
  expirationDate: number
}

class MedicineModel extends BaseModel {
  async create(data: CreateMedicineData): Promise<Medicine | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    const [result] = await this.db.executeSql(`
      INSERT INTO medicines (
        id, name, description, manufacturer, dosage, medicineKitId, photoPath, barcode, unit, quantity, unitForQuantity, expirationDate, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      null,
      data.name,
      data.description || null,
      data.manufacturer || null,
      data.dosage || null,
      data.medicineKitId || null,
      data.photoPath || null,
      data.barcode || null,
      data.unit || null,
      data.quantity || null,
      data.unitForQuantity || null,
      new Date(data.expirationDate).getTime(),
      Date.now(),
      Date.now()
    ])

    return await this.getById(result.insertId)
  }

  async getAll(): Promise<Medicine[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    const [results] = await this.db.executeSql(`
      SELECT * FROM medicines ORDER BY createdAt ASC
    `)

    const kits: Medicine[] = []
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      kits.push({
        id: row.id,
        name: row.name,
        description: row.description,
        manufacturer: row.manufacturer,
        dosage: row.dosage,
        medicineKitId: row.medicineKitId,
        photoPath: row.photoPath,
        barcode: row.barcode,
        unit: row.unit,
        quantity: row.quantity,
        unitForQuantity: row.unitForQuantity,
        expirationDate: row.expirationDate,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      })
    }

    return kits
  }

  async getById(id: number): Promise<Medicine | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM medicines WHERE id = ?
    `, [id])

    if (results.rows.length === 0) {
      return null
    }

    const row = results.rows.item(0)
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      manufacturer: row.manufacturer,
      dosage: row.dosage,
      medicineKitId: row.medicineKitId,
      photoPath: row.photoPath,
      barcode: row.barcode,
      unit: row.unit,
      quantity: row.quantity,
      unitForQuantity: row.unitForQuantity,
      expirationDate: row.expirationDate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }
  }

  async update(id: number, updates: Partial<CreateMedicineData>): Promise<Medicine> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const allowedFields = ['name', 'description', 'manufacturer', 'dosage', 'medicineKitId', 'photoPath', 'barcode', 'unit', 'quantity', 'unitForQuantity', 'expirationDate']
    const updateFields: string[] = []
    const updateValues: any[] = []

    // Собираем только те поля, которые переданы
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`)
        updateValues.push(value)
      }
    }

    if (updateFields.length === 0) {
      // Если нет полей для обновления, просто возвращаем текущую запись
      const existing = await this.getById(id)
      if (!existing) {
        throw new Error(`Medicine with id ${id} not found`)
      }
      return existing
    }

    // Добавляем updated_at
    updateFields.push('updatedAt = ?')
    updateValues.push(Date.now())

    // Добавляем id для WHERE
    updateValues.push(id)

    // UPDATE запрос (react-native-sqlite-storage не поддерживает RETURNING)
    const [results] = await this.db.executeSql(`
      UPDATE medicines 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues)

    if (results.rowsAffected === 0) {
      throw new Error(`Medicine with id ${id} not found`)
    }

    // Получаем обновленные данные отдельным запросом
    const updated = await this.getById(id)
    if (!updated) {
      throw new Error(`Medicine with id ${id} not found`)
    }
    return updated
  }

  async delete(id: number): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    await this.db.executeSql(`
      DELETE FROM medicines WHERE id = ?
    `, [id])
  }

  async getByBarcode(barcode: string): Promise<Medicine | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM medicines WHERE barcode = ?
    `, [barcode])

    if (results.rows.length === 0) {
      return null
    }

    const row = results.rows.item(0)
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      manufacturer: row.manufacturer,
      dosage: row.dosage,
      medicineKitId: row.medicineKitId,
      photoPath: row.photoPath,
      barcode: row.barcode,
      unit: row.unit,
      quantity: row.quantity,
      unitForQuantity: row.unitForQuantity,
      expirationDate: row.expirationDate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }
  }
}

export const medicineModel = new MedicineModel()

