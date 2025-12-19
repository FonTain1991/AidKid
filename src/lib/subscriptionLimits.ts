/**
 * Функции проверки лимитов для бесплатной версии
 */

import { FREE_LIMITS } from '@/constants'
import { medicineModel, reminderModel, shoppingListModel } from '@/services/models'
import { kitModel } from '@/services/models/KitModel'
import { subscriptionService } from './subscription'

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
 * @returns {Promise<LimitCheckResult>} Результат проверки лимита на создание аптечки
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

  const kits = await kitModel.getAll()
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
 * @returns {Promise<LimitCheckResult>} Результат проверки лимита на создание лекарства
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

  const medicines = await medicineModel.getAll()
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
 * @returns {Promise<LimitCheckResult>} Результат проверки лимита на создание напоминания
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
    // Получаем только активные напоминания
    const allReminders = await reminderModel.getAll()
    const activeReminders = allReminders.filter(reminder => reminder.isActive)
    const currentCount = activeReminders.length

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
    // Если произошла ошибка, разрешаем создание (для обратной совместимости)
    console.warn('Failed to get reminders, allowing reminder creation:', error)
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
 * @returns {Promise<LimitCheckResult>} Результат проверки лимита на добавление товара в список покупок
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
    const shoppingList = await shoppingListModel.getAll()
    // isPurchased может быть 0, 1 или undefined, фильтруем некупленные товары
    const unpurchasedCount = shoppingList.filter(({ isPurchased }) => {
      return isPurchased === 0 || isPurchased === undefined
    }).length

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
    // Если произошла ошибка, разрешаем добавление (для обратной совместимости)
    console.warn('Failed to get shopping items, allowing shopping item addition:', error)
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
 * @returns {Promise<{kits: LimitCheckResult, medicines: LimitCheckResult, reminders: LimitCheckResult, shoppingItems: LimitCheckResult, isPremium: boolean}>} Информация о всех лимитах и статусе премиум подписки
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
 * @param {LimitCheckResult} result - Результат проверки лимита
 * @returns {string} Отформатированное сообщение для пользователя
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

