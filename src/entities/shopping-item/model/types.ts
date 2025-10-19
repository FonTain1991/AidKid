// Типы для списка покупок
export interface ShoppingItem {
  id: string
  medicineName: string
  description?: string
  isPurchased: boolean
  reminderDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateShoppingItemData {
  medicineName: string
  description?: string
}

export interface UpdateShoppingItemData {
  medicineName?: string
  description?: string
  isPurchased?: boolean
  reminderDate?: Date
}

