// Типы для аптечки
export interface MedicineKit {
  id: string
  name: string
  description?: string
  color: string
  parent_id?: string // ID родительской аптечки для иерархии
  createdAt: Date
  updatedAt: Date
}

export interface CreateKitData {
  name: string
  description?: string
  color: string
  parent_id?: string
}

export interface UpdateKitData {
  name?: string
  description?: string
  color?: string
  parent_id?: string
}
