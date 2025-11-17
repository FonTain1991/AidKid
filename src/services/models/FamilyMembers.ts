import { BaseModel } from './BaseModel'

export interface FamilyMember {
  id?: string
  name: string
  avatar?: string
  color?: string
  createdAt: number
  updatedAt: number
}

// CRUD операции для членов семьи
export class FamilyMembersModel extends BaseModel {
  async createFamilyMember(member: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<FamilyMember> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const newMember: FamilyMember = {
      ...member,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime()
    }

    const [result] = await this.db.executeSql(`
      INSERT INTO family_members (
        name, avatar, color, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      newMember.name,
      newMember.avatar || null,
      newMember.color || null,
      newMember.createdAt,
      newMember.updatedAt
    ])

    return newMember
  }

  async getFamilyMembers(): Promise<FamilyMember[]> {
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
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
      members.push(member)
    }

    return members
  }

  async getFamilyMemberById(id: string): Promise<FamilyMember | null> {
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
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  async updateFamilyMember(id: string, updates: Partial<FamilyMember>): Promise<void> {
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

    updateFields.push('updated_at = ?')
    updateValues.push(new Date().toISOString())
    updateValues.push(id)

    await this.db.executeSql(`
      UPDATE family_members SET ${updateFields.join(', ')} WHERE id = ?
    `, updateValues)

    console.log('SQLite - Updated family member:', id)
  }

  async deleteFamilyMember(id: string): Promise<void> {
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

