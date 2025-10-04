import { Platform } from 'react-native'
import { ANDROID_CONFIG } from './android'

// Конфигурация базы данных
export const DATABASE_CONFIG = {
  name: 'AidKit.db',
  version: '1.0',
  displayName: 'AidKit Database',
  size: 200000,
  // Размер страницы SQLite оптимизированный для 16 KB страниц Android 15
  pageSize: Platform.OS === 'android'
    ? ANDROID_CONFIG.memoryOptimizations.sqlitePageSize
    : 4096, // 16KB для Android, 4KB по умолчанию
} as const
