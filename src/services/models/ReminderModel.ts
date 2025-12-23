import { BaseModel } from './BaseModel'

export interface Reminder {
  id?: number | null
  familyMemberId: number | null
  title: string
  frequency: 'once' | 'daily' | 'weekly'
  timesPerDay: number
  time: string
  isActive: boolean
  dosage: string
  createdAt?: number
  updatedAt?: number
  description?: string
  dosage?: string
}

export interface CreateReminderData {
  familyMemberId: number
  title: string
  frequency: 'once' | 'daily' | 'weekly'
  timesPerDay: number
  time: string
  isActive: boolean
  description?: string
  dosage: string
}

class ReminderModel extends BaseModel {
  async create(data: CreateReminderData): Promise<Reminder | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [result] = await this.db.executeSql(`
      INSERT INTO reminders (
        id, familyMemberId, title, frequency, timesPerDay, time, isActive, description, createdAt, dosage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      null,
      data.familyMemberId,
      data.title,
      data.frequency,
      data.timesPerDay,
      data.time,
      data.isActive,
      data.description,
      Date.now(),
      data.dosage
    ]).catch(err => {
      console.error(err)
      throw err
    })

    return await this.getById(result.insertId)
  }

  async getAll(): Promise<Reminder[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    const [results] = await this.db.executeSql(`
      SELECT * FROM reminders ORDER BY createdAt ASC
    `)

    const reminders: Reminder[] = []
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      reminders.push({
        id: row.id,
        familyMemberId: row.familyMemberId,
        title: row.title,
        frequency: row.frequency,
        timesPerDay: row.timesPerDay,
        time: row.time,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        description: row.description,
        dosage: row.dosage
      })
    }

    return reminders
  }

  async getById(id: number): Promise<Reminder | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM reminders WHERE id = ?
    `, [id])

    if (results.rows.length === 0) {
      return null
    }

    const row = results.rows.item(0)
    return {
      id: row.id,
      familyMemberId: row.familyMemberId,
      title: row.title,
      frequency: row.frequency,
      timesPerDay: row.timesPerDay,
      time: row.time,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      description: row.description,
      dosage: row.dosage
    }
  }

  async update(id: number, updates: Partial<CreateReminderData>): Promise<Reminder> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const allowedFields = ['familyMemberId', 'title', 'frequency', 'timesPerDay', 'time', 'isActive', 'description', 'dosage']
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
        throw new Error(`Reminder with id ${id} not found`)
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
      UPDATE reminders 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues)

    if (results.rowsAffected === 0) {
      throw new Error(`Reminder with id ${id} not found`)
    }

    // Получаем обновленные данные отдельным запросом
    const updated = await this.getById(id)
    if (!updated) {
      throw new Error(`Reminder with id ${id} not found`)
    }
    return updated
  }

  async delete(id: number): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    await this.db.executeSql(`
      DELETE FROM reminders WHERE id = ?
    `, [id])
  }
}

export const reminderModel = new ReminderModel()

