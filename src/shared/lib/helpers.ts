// Общие утилиты

export const generateId = (): string => {
  return Date.now().toString()
}

export const formatDate = (date: Date): string => {
  return date.toISOString()
}

export const parseDate = (dateString: string): Date => {
  return new Date(dateString)
}
