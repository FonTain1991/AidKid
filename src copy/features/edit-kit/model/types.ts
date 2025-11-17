// Типы для фичи редактирования аптечки
export interface EditKitFormData {
  name: string
  description: string
  color: string
  icon: string
}

export interface EditKitFormErrors {
  name?: string
  description?: string
}
