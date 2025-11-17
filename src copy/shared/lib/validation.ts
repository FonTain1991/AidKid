// Валидация форм

export interface ValidationError {
  field: string
  message: string
}

export const validateRequired = (value: string, fieldName: string): ValidationError | null => {
  if (!value?.trim()) {
    return {
      field: fieldName,
      message: `${fieldName} обязательно`
    }
  }
  return null
}

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): ValidationError | null => {
  if (value && value.length > maxLength) {
    return {
      field: fieldName,
      message: `${fieldName} слишком длинное (максимум ${maxLength} символов)`
    }
  }
  return null
}

export const validateKitName = (name: string): ValidationError | null => {
  return validateRequired(name, 'Название аптечки') ||
    validateMaxLength(name, 50, 'Название')
}

export const validateKitDescription = (description: string): ValidationError | null => {
  if (description) {
    return validateMaxLength(description, 200, 'Описание')
  }
  return null
}
