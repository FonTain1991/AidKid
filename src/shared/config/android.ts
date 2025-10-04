import { Platform } from 'react-native'

// Конфигурация для Android 15 с поддержкой 16 KB страниц
export const ANDROID_CONFIG = {
  // Включение поддержки 16 KB страниц для Android 15
  enablePageSize16K: Platform.OS === 'android',

  // Оптимизации памяти для 16 KB страниц
  memoryOptimizations: {
    // Размер блока памяти для больших объектов
    largeObjectThreshold: 16384, // 16 KB

    // Оптимизация для SQLite с 16 KB страницами
    sqlitePageSize: 16384, // 16 KB

    // Размер буфера для изображений
    imageBufferSize: 32768, // 32 KB (2 страницы)
  },

  // Настройки производительности
  performance: {
    // Включение аппаратного ускорения
    hardwareAcceleration: true,

    // Оптимизация для 16 KB страниц
    pageSizeOptimized: true,
  }
} as const