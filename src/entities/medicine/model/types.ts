// Основные типы для лекарств
export interface Medicine {
  id: string
  name: string
  description?: string
  manufacturer?: string
  dosage?: string
  form: string
  prescriptionRequired: boolean
  kitId: string
  photoPath?: string
  barcode?: string
  createdAt: Date
  updatedAt: Date
}

export interface MedicineStock {
  id: string
  medicineId: string
  quantity: number
  unit: string
  expiryDate?: Date
  batchNumber?: string
  purchaseDate?: Date
  purchasePrice?: number
  createdAt: Date
  updatedAt: Date
}

export interface MedicineUsage {
  id: string
  medicineId: string
  familyMemberId?: string
  quantityUsed: number
  usageDate: Date
  notes?: string
  createdAt: Date
}

// Справочные типы
export interface MedicineForm {
  id: string
  name: string
  icon?: string
}

export interface MeasurementUnit {
  id: string
  name: string
  symbol: string
}

// Типы для создания/обновления
export interface CreateMedicineData {
  name: string
  description?: string
  manufacturer?: string
  dosage?: string
  form: string
  prescriptionRequired: boolean
  kitId: string
  photoPath?: string
  barcode?: string
}

export interface UpdateMedicineData {
  name?: string
  description?: string
  manufacturer?: string
  dosage?: string
  form?: string
  prescriptionRequired?: boolean
  photoPath?: string
  barcode?: string
}

export interface CreateMedicineStockData {
  medicineId: string
  quantity: number
  unit: string
  expiryDate?: Date
}

export interface UpdateMedicineStockData {
  quantity?: number
  unit?: string
  expiryDate?: Date
}

export interface CreateMedicineUsageData {
  medicineId: string
  familyMemberId?: string
  quantityUsed: number
  usageDate: Date
  notes?: string
}

// Расширенные типы для UI
export interface MedicineWithStock extends Medicine {
  stock?: MedicineStock
  totalQuantity: number
  isExpiringSoon?: boolean
  daysUntilExpiry?: number
}

export interface MedicineFormData {
  id?: string
  name: string
  description: string
  manufacturer: string
  dosage: string
  form: string
  kitId: string
  photoPath?: string
  barcode?: string
  // Для запасов
  quantity: number
  unit: string
  expiryDate?: string
}
