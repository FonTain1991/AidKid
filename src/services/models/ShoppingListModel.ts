import { BaseModel } from './BaseModel'

export interface ShoppingList {
  id?: number | null
  medicineName: string
  description?: string
  isPurchased?: 0 | 1
  reminderDate?: string
  createdAt?: number
  updatedAt?: number
}

export interface CreateShoppingListData {
  medicineName: string
  description?: string
  isPurchased?: 0 | 1
  reminderDate?: string
}

class ShoppingListModel extends BaseModel {
  async create(data: CreateShoppingListData): Promise<ShoppingList | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [result] = await this.db.executeSql(`
      INSERT INTO shopping_list (
        id, medicineName, description, reminderDate, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      null,
      data.medicineName,
      data.description,
      data.reminderDate,
      Date.now(),
      Date.now()
    ]).catch((err: any) => {
      console.error(err)
      return null
    })

    return await this.getById(result.insertId)
  }

  async getById(id: number): Promise<ShoppingList | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
        SELECT * FROM shopping_list WHERE id = ?
    `, [id])

    if (results.rows.length === 0) {
      return null
    }

    const row = results.rows.item(0)
    return {
      id: row.id,
      medicineName: row.medicineName,
      description: row.description,
      isPurchased: row.isPurchased,
      reminderDate: row.reminderDate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }
  }

  async getAll(): Promise<ShoppingList[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    const [results] = await this.db.executeSql(`
      SELECT * FROM shopping_list ORDER BY isPurchased ASC, createdAt ASC
    `)

    const shoppingList: ShoppingList[] = []
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      shoppingList.push({
        id: row.id,
        medicineName: row.medicineName,
        description: row.description,
        isPurchased: row.isPurchased,
        reminderDate: row.reminderDate,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      })
    }
    return shoppingList
  }

  async update(id: number, updates: Partial<CreateShoppingListData>): Promise<ShoppingList> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const allowedFields = ['medicineName', 'description', 'isPurchased', 'reminderDate']
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
        throw new Error(`ShoppingList with id ${id} not found`)
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
      UPDATE shopping_list
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues).catch((err: any) => {
      console.error(err)
      return null
    })

    if (results.rowsAffected === 0) {
      throw new Error(`ShoppingList with id ${id} not found`)
    }

    // Получаем обновленные данные отдельным запросом
    const updated = await this.getById(id)
    if (!updated) {
      throw new Error(`ShoppingList with id ${id} not found`)
    }
    return updated
  }

  async delete(id: number): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    await this.db.executeSql(`
      DELETE FROM shopping_list WHERE id = ?
    `, [id])
  }

  async deleteAll(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    await this.db.executeSql('DELETE FROM shopping_list')
  }
}

export const shoppingListModel = new ShoppingListModel()

