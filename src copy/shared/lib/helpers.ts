// Общие утилиты

export const generateId = (): string => {
  // Используем timestamp + случайную строку + счетчик для гарантии уникальности
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substr(2, 9)
  const counter = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${timestamp}-${random}-${counter}`
}

export const formatDate = (date: Date): string => {
  return date.toISOString()
}

export const generateReactKey = (prefix: string = 'key'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const parseDate = (dateString: string): Date => {
  return new Date(dateString)
}
