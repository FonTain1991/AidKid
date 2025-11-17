// Типы для членов семьи
export interface FamilyMember {
  id: string
  name: string
  avatar?: string // emoji или иконка
  color?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateFamilyMemberData {
  name: string
  avatar?: string
  color?: string
}

export interface UpdateFamilyMemberData {
  name?: string
  avatar?: string
  color?: string
}

