import { Medicine, MedicineStock } from '@/entities/medicine/model/types'

export interface MedicineFormData {
  id?: string
  name: string
  description: string
  manufacturer: string
  dosage: string
  form: string
  kitId?: string
  photoPath?: string
  barcode?: string
  // Для запасов
  quantity: number
  unit: string
  expiryDate?: string
}

export interface MedicineFormProps {
  initialData?: MedicineFormData
  onSubmit: (data: MedicineFormData) => Promise<void>
  kitId?: string
}

export interface MedicineFormOption {
  label: string
  value: string
}

// Валидация формы
export interface MedicineFormErrors {
  name?: string
  form?: string
  kitId?: string
  quantity?: string
  unit?: string
  expiryDate?: string
}

export interface MedicineFormValidation {
  isValid: boolean
  errors: MedicineFormErrors
}
