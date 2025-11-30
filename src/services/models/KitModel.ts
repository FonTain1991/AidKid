import { BaseModel } from './BaseModel'

export interface MedicineKit {
  id?: number | null
  name: string
  description?: string
  color: string
  parentId?: string | null
  createdAt?: number
  updatedAt?: number
}

export interface CreateKitData {
  name: string
  description?: string
  color: string
  parentId?: string | null
}

export class KitModel extends BaseModel {
  async create(data: CreateKitData): Promise<MedicineKit | null> {

    const [result] = await this.db.executeSql(`
      INSERT INTO medicine_kits (
        id, name, description, color, parentId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      null,
      data.name,
      data.description,
      data.color,
      data.parentId,
      new Date().getTime(),
      new Date().getTime()
    ])

    return await this.getById(result.insertId.toString())
  }

  async getAll(): Promise<MedicineKit[]> {

    const [results] = await this.db.executeSql(`
      SELECT * FROM medicine_kits ORDER BY createdAt ASC
    `)

    const kits: MedicineKit[] = []
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      kits.push({
        id: row.id,
        name: row.name,
        description: row.description,
        color: row.color,
        parentId: row.parentId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      })
    }

    return kits
  }

  async getById(id: string): Promise<MedicineKit | null> {

    const [results] = await this.db.executeSql(`
      SELECT * FROM medicine_kits WHERE id = ?
    `, [id])

    if (results.rows.length === 0) {
      return null
    }

    const row = results.rows.item(0)
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      color: row.color,
      parentId: row.parentId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }
  }

  async update(id: number, updates: Partial<CreateKitData>): Promise<MedicineKit> {
    const allowedFields = ['name', 'description', 'color', 'parentId']
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
        throw new Error(`Medicine kit with id ${id} not found`)
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
      UPDATE medicine_kits 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues)

    if (results.rowsAffected === 0) {
      throw new Error(`Medicine kit with id ${id} not found`)
    }

    // Получаем обновленные данные отдельным запросом
    const updated = await this.getById(id)
    if (!updated) {
      throw new Error(`Medicine kit with id ${id} not found`)
    }
    return updated
  }

  async delete(id: number): Promise<void> {
    await this.db.executeSql(`
      DELETE FROM medicine_kits WHERE id = ?
    `, [id])
  }
}

export const kitModel = new KitModel()

