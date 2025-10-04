// Типы для аптечки
export interface MedicineKit {
  id: string
  name: string
  description?: string
  color: string
  parentId?: string // ID родительской аптечки для иерархии
  createdAt: Date
  updatedAt: Date
}

export interface CreateKitData {
  name: string
  description?: string
  color: string
  parentId?: string
}

export interface UpdateKitData {
  name?: string
  description?: string
  color?: string
  parentId?: string
}
