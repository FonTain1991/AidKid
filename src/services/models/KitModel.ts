import { BaseModel } from './BaseModel'
import { generateId } from '../utils'

export interface MedicineKit {
  id: string
  name: string
  description?: string
  color: string
  parent_id?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateKitData {
  name: string
  description?: string
  color: string
  parent_id?: string
}

export class KitModel extends BaseModel {
  async create(data: CreateKitData): Promise<MedicineKit> {

    const id = generateId()
    const now = new Date().toISOString()

    const newKit: MedicineKit = {
      ...data,
      id,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    }

    await this.db.executeSql(`
      INSERT INTO medicine_kits (
        id, name, description, color, parent_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      newKit.id,
      newKit.name,
      newKit.description || null,
      newKit.color,
      newKit.parent_id || null,
      newKit.createdAt.toISOString(),
      newKit.updatedAt.toISOString()
    ])

    return newKit
  }

  async getAll(): Promise<MedicineKit[]> {

    const [results] = await this.db.executeSql(`
      SELECT * FROM medicine_kits ORDER BY name ASC
    `)

    const kits: MedicineKit[] = []
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      kits.push({
        id: row.id,
        name: row.name,
        description: row.description,
        color: row.color,
        parent_id: row.parent_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
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
      parent_id: row.parent_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  async update(id: string, updates: Partial<CreateKitData>): Promise<void> {

    const allowedFields = ['name', 'description', 'color', 'parent_id']
    const filteredUpdates = Object.entries(updates)
      .filter(([key]) => allowedFields.includes(key))

    if (filteredUpdates.length === 0) {
      return
    }

    const setClause = filteredUpdates
      .map(([key]) => `${key} = ?`)
      .join(', ')

    const values = filteredUpdates.map(([_key, value]) => value)
    values.push(new Date().toISOString(), id)

    await this.db.executeSql(`
      UPDATE medicine_kits 
      SET ${setClause}, updated_at = ?
      WHERE id = ?
    `, values)
  }

  async delete(id: string): Promise<void> {

    await this.db.executeSql(`
      DELETE FROM medicine_kits WHERE id = ?
    `, [id])
  }
}

export const kitModel = new KitModel()

