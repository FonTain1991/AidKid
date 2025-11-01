/**
 * Функции проверки лимитов для бесплатной версии
 */

import { subscriptionService } from './subscription'
import { databaseService } from './database'
import { FREE_LIMITS } from '../constants/subscriptionLimits'

export interface LimitCheckResult {
  /** Можно ли выполнить действие */
  allowed: boolean
  
  /** Текущее количество (если применимо) */
  currentCount: number
  
  /** Максимальное количество для бесплатной версии */
  maxCount: number
  
  /** Нужна ли премиум подписка для превышения лимита */
  requiresPremium: boolean
  
  /** Сообщение для пользователя (если лимит достигнут) */
  message?: string
}

/**
 * Проверка, можно ли создать новую аптечку
 */
export async function canCreateKit(): Promise<LimitCheckResult> {
  const isPremium = await subscriptionService.isPremium()
  
  if (isPremium) {
    return {
      allowed: true,
      currentCount: 0,
      maxCount: Infinity,
      requiresPremium: false,
    }
  }

  const kits = await databaseService.getKits()
  const currentCount = kits.length

  if (currentCount >= FREE_LIMITS.MAX_KITS) {
    return {
      allowed: false,
      currentCount,
      maxCount: FREE_LIMITS.MAX_KITS,
      requiresPremium: true,
      message: `В бесплатной версии можно создать только ${FREE_LIMITS.MAX_KITS} аптечку. Оформите премиум подписку для неограниченного количества.`,
    }
  }

  return {
    allowed: true,
    currentCount,
    maxCount: FREE_LIMITS.MAX_KITS,
    requiresPremium: false,
  }
}

/**
 * Проверка, можно ли создать новое лекарство
 */
export async function canCreateMedicine(): Promise<LimitCheckResult> {
  const isPremium = await subscriptionService.isPremium()
  
  if (isPremium) {
    return {
      allowed: true,
      currentCount: 0,
      maxCount: Infinity,
      requiresPremium: false,
    }
  }

  const medicines = await databaseService.getMedicines()
  const currentCount = medicines.length

  if (currentCount >= FREE_LIMITS.MAX_MEDICINES) {
    return {
      allowed: false,
      currentCount,
      maxCount: FREE_LIMITS.MAX_MEDICINES,
      requiresPremium: true,
      message: `В бесплатной версии можно добавить только ${FREE_LIMITS.MAX_MEDICINES} лекарств. Оформите премиум подписку для неограниченного количества.`,
    }
  }

  return {
    allowed: true,
    currentCount,
    maxCount: FREE_LIMITS.MAX_MEDICINES,
    requiresPremium: false,
  }
}

/**
 * Проверка, можно ли создать новое напоминание
 * Примечание: нужно будет реализовать getReminders() в databaseService если его нет
 */
export async function canCreateReminder(): Promise<LimitCheckResult> {
  const isPremium = await subscriptionService.isPremium()
  
  if (isPremium) {
    return {
      allowed: true,
      currentCount: 0,
      maxCount: Infinity,
      requiresPremium: false,
    }
  }

  try {
    // Попытка получить напоминания через базу данных
    // Если метода нет, можно сделать запрос напрямую
    const reminders = await databaseService.getReminders()
    const currentCount = reminders.length

    if (currentCount >= FREE_LIMITS.MAX_REMINDERS) {
      return {
        allowed: false,
        currentCount,
        maxCount: FREE_LIMITS.MAX_REMINDERS,
        requiresPremium: true,
        message: `В бесплатной версии можно создать только ${FREE_LIMITS.MAX_REMINDERS} активных напоминаний. Оформите премиум подписку для неограниченного количества.`,
      }
    }

    return {
      allowed: true,
      currentCount,
      maxCount: FREE_LIMITS.MAX_REMINDERS,
      requiresPremium: false,
    }
  } catch (error) {
    // Если метод не реализован, разрешаем создание (для обратной совместимости)
    console.warn('getReminders not implemented, allowing reminder creation')
    return {
      allowed: true,
      currentCount: 0,
      maxCount: FREE_LIMITS.MAX_REMINDERS,
      requiresPremium: false,
    }
  }
}

/**
 * Проверка, можно ли добавить товар в список покупок
 */
export async function canAddShoppingItem(): Promise<LimitCheckResult> {
  const isPremium = await subscriptionService.isPremium()
  
  if (isPremium) {
    return {
      allowed: true,
      currentCount: 0,
      maxCount: Infinity,
      requiresPremium: false,
    }
  }

  try {
    const shoppingList = await databaseService.getShoppingItems()
    const unpurchasedCount = shoppingList.filter(item => !item.isPurchased).length

    if (unpurchasedCount >= FREE_LIMITS.MAX_SHOPPING_ITEMS) {
      return {
        allowed: false,
        currentCount: unpurchasedCount,
        maxCount: FREE_LIMITS.MAX_SHOPPING_ITEMS,
        requiresPremium: true,
        message: `В бесплатной версии можно добавить только ${FREE_LIMITS.MAX_SHOPPING_ITEMS} товаров в список покупок. Оформите премиум подписку для неограниченного количества.`,
      }
    }

    return {
      allowed: true,
      currentCount: unpurchasedCount,
      maxCount: FREE_LIMITS.MAX_SHOPPING_ITEMS,
      requiresPremium: false,
    }
  } catch (error) {
    // Если метод не реализован, разрешаем добавление (для обратной совместимости)
    console.warn('getShoppingItems not implemented, allowing shopping item addition')
    return {
      allowed: true,
      currentCount: 0,
      maxCount: FREE_LIMITS.MAX_SHOPPING_ITEMS,
      requiresPremium: false,
    }
  }
}

/**
 * Получить информацию о текущих лимитах пользователя
 */
export async function getLimitsInfo(): Promise<{
  kits: LimitCheckResult
  medicines: LimitCheckResult
  reminders: LimitCheckResult
  shoppingItems: LimitCheckResult
  isPremium: boolean
}> {
  const isPremium = await subscriptionService.isPremium()
  
  const [kits, medicines, reminders, shoppingItems] = await Promise.all([
    canCreateKit(),
    canCreateMedicine(),
    canCreateReminder(),
    canAddShoppingItem(),
  ])

  return {
    kits,
    medicines,
    reminders,
    shoppingItems,
    isPremium,
  }
}

/**
 * Форматирование сообщения о лимите для пользователя
 */
export function formatLimitMessage(result: LimitCheckResult): string {
  if (result.allowed) {
    return ''
  }

  if (result.message) {
    return result.message
  }

  return `Достигнут лимит: ${result.currentCount}/${result.maxCount}. Оформите премиум подписку для увеличения лимита.`
}

