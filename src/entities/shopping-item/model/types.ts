// Типы для списка покупок
export interface ShoppingItem {
  id: string
  medicineName: string
  description?: string
  isPurchased: boolean
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
}

