import { BaseModel } from './BaseModel'

export interface FamilyMember {
  id?: number
  name: string
  avatar?: string
  color?: string
  createdAt: number
  updatedAt: number
}

// CRUD операции для членов семьи
export class FamilyMembersModel extends BaseModel {
  async createFamilyMember(data: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<FamilyMember | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [result] = await this.db.executeSql(`
      INSERT INTO family_members (
        id, name, avatar, color, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      null,
      data.name,
      data.avatar || null,
      data.color || null,
      new Date().getTime(),
      new Date().getTime()
    ])

    return await this.getFamilyMemberById(result.insertId)
  }

  async getAll(): Promise<FamilyMember[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM family_members ORDER BY id ASC
    `)

    const members: FamilyMember[] = []
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      const member: FamilyMember = {
        id: row.id,
        name: row.name,
        avatar: row.avatar,
        color: row.color,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }
      members.push(member)
    }

    return members
  }

  async getFamilyMemberById(id: number): Promise<FamilyMember | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM family_members WHERE id = ?
    `, [id])

    if (results.rows.length === 0) {
      return null
    }

    const row = results.rows.item(0)
    return {
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      color: row.color,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }

  async updateFamilyMember(id: number, updates: Partial<FamilyMember>): Promise<FamilyMember | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const updateFields: string[] = []
    const updateValues: any[] = []

    if (updates.name !== undefined) {
      updateFields.push('name = ?')
      updateValues.push(updates.name)
    }
    if (updates.avatar !== undefined) {
      updateFields.push('avatar = ?')
      updateValues.push(updates.avatar)
    }
    if (updates.color !== undefined) {
      updateFields.push('color = ?')
      updateValues.push(updates.color)
    }

    updateFields.push('updatedAt = ?')
    updateValues.push(new Date().getTime())
    updateValues.push(id)

    await this.db.executeSql(`
      UPDATE family_members SET ${updateFields.join(', ')} WHERE id = ?
    `, updateValues).catch(err => {
      console.error('SQLite - Error updating family member:', err)
      return null
    })

    console.log('SQLite - Updated family member:', id)

    return await this.getFamilyMemberById(id)
  }

  async deleteFamilyMember(id: number): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    await this.db.executeSql(`
      DELETE FROM family_members WHERE id = ?
    `, [id])

    console.log('SQLite - Deleted family member:', id)
  }
}

export const familyMembersModel = new FamilyMembersModel()

