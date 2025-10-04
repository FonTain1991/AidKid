// Типы для фичи создания аптечки
export interface CreateKitFormData {
  name: string
  description: string
  color: string
  icon: string
  selectedParentId: string
}

export interface CreateKitFormErrors {
  name?: string
  description?: string
}
