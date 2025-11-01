/**
 * Конфигурация для RevenueCat
 * 
 * ВАЖНО: В production лучше использовать переменные окружения
 * или безопасное хранилище для API ключей
 */

import { Platform } from 'react-native'

// API ключи из RevenueCat Dashboard
// Получить можно здесь: https://app.revenuecat.com/
// Project Settings → API Keys → Public SDK Keys (НЕ Secret Keys!)
//
// ВАЖНО:
// 1. Используйте API версии v2 (по умолчанию для новых проектов)
// 2. Используйте Public SDK Keys (безопасно для клиентского приложения)
// 3. НЕ используйте Secret API Keys (только для серверной части)
// 4. Test keys работают с тестовыми покупками
// 5. Production keys работают с реальными покупками

// ВАЖНО: Замените на ваши реальные API ключи после настройки RevenueCat Dashboard
// Подробная инструкция: docs/REVENUECAT_DASHBOARD_SETUP.md
// API ключи из RevenueCat Dashboard → API Keys → SDK API keys
// AidKit (Play Store): goog_jkhfQFJGRJmlcJKRfYhDZJrIqbp
// Test Store: test_IDMKsubhImwaDGeDtPsuIZguwUb
//
// ВАЖНО: Используем ключ от "AidKit (Play Store)" для обоих режимов,
// так как продукты настроены именно для этого приложения
export const REVENUECAT_API_KEY_ANDROID = __DEV__
  ? 'goog_jkhfQFJGRJmlcJKRfYhDZJrIqbp' // Production key (для разработки тоже, так как продукты в Play Store)
  : 'goog_jkhfQFJGRJmlcJKRfYhDZJrIqbp' // Production key из AidKit (Play Store)

export const REVENUECAT_API_KEY_IOS = __DEV__
  ? 'appl_YOUR_TEST_API_KEY_IOS' // Test key для разработки
  : 'appl_YOUR_PRODUCTION_API_KEY_IOS' // Production key

export const getRevenueCatApiKey = (): string => {
  return Platform.OS === 'android'
    ? REVENUECAT_API_KEY_ANDROID
    : REVENUECAT_API_KEY_IOS
}

// Идентификатор entitlement для премиум подписки
// Настраивается в RevenueCat Dashboard: Project Settings → Entitlements
export const PREMIUM_ENTITLEMENT_ID = 'premium'

// Идентификатор offering (набора подписок)
// Настраивается в RevenueCat Dashboard: Offerings
export const DEFAULT_OFFERING_ID = 'default'

