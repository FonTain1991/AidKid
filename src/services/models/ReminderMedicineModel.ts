import { BaseModel } from './BaseModel'

export interface ReminderMedicine {
  id?: number | null
  reminderId?: number | null
  medicineId?: number | null
}

export interface CreateReminderMedicineData {
  reminderId?: number | null
  medicineId?: number | null
}

class ReminderMedicineModel extends BaseModel {
  async create(data: CreateReminderMedicineData): Promise<ReminderMedicine | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    const [result] = await this.db.executeSql(`
      INSERT INTO reminder_medicines (
        id, reminderId, medicineId
      ) VALUES (?, ?, ?)
    `, [
      null,
      data.reminderId || null,
      data.medicineId || null
    ])

    return await this.getById(result.insertId)
  }

  async getAll(): Promise<ReminderMedicine[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    const [results] = await this.db.executeSql('SELECT * FROM reminder_medicines')

    const reminderMedicines: ReminderMedicine[] = []
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      reminderMedicines.push({
        id: row.id,
        reminderId: row.reminderId,
        medicineId: row.medicineId
      })
    }

    return reminderMedicines
  }

  async getById(id: number): Promise<ReminderMedicine | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM reminder_medicines WHERE id = ?
    `, [id])

    if (results.rows.length === 0) {
      return null
    }

    const row = results.rows.item(0)
    return {
      id: row.id,
      reminderId: row.reminderId,
      medicineId: row.medicineId
    }
  }

  async update(id: number, updates: Partial<CreateReminderMedicineData>): Promise<ReminderMedicine> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const allowedFields = ['reminderId', 'medicineId']
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
        throw new Error(`ReminderMedicine with id ${id} not found`)
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
      UPDATE reminder_medicines 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues)

    if (results.rowsAffected === 0) {
      throw new Error(`ReminderMedicine with id ${id} not found`)
    }

    // Получаем обновленные данные отдельным запросом
    const updated = await this.getById(id)
    if (!updated) {
      throw new Error(`ReminderMedicine with id ${id} not found`)
    }
    return updated
  }

  async delete(id: number): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    await this.db.executeSql(`
      DELETE FROM reminder_medicines WHERE id = ?
    `, [id])
  }
}

export const reminderMedicineModel = new ReminderMedicineModel()

