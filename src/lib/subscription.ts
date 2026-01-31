/**
 * Сервис для работы с подписками через RevenueCat
 */

import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  PurchasesError,
} from 'react-native-purchases'
import { Platform } from 'react-native'
import {
  getRevenueCatApiKey,
  PREMIUM_ENTITLEMENT_ID,
} from './subscriptionConfig'

export interface SubscriptionStatus {
  isPremium: boolean
  isInitialized: boolean
  customerInfo: CustomerInfo | null
  expirationDate: Date | null
  willRenew?: boolean
  isCanceled?: boolean
}

class SubscriptionService {
  private isInitialized = false

  private customerInfo: CustomerInfo | null = null

  private initializationError: Error | null = null

  // Кеш для прямых продуктов (fallback, если storeProduct не загружен)
  private directProductsCache: Map<string, any> = new Map()

  /**
   * Инициализация RevenueCat
   * Вызывается один раз при запуске приложения
   */
  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      const apiKey = getRevenueCatApiKey()

      // Проверяем, что API ключ настроен
      if (apiKey.includes('YOUR_')) {
        this.initializationError = new Error('API key not configured')
        return
      }

      // Проверяем формат ключа (для production должен начинаться с goog_)
      // Для тестового ключа может быть формат test_XXXXX (без префикса)
      if (Platform.OS === 'android' && !__DEV__ && !apiKey.startsWith('goog_')) {
        this.initializationError = new Error('Invalid API key format')
        return
      }

      await Purchases.configure({ apiKey })

      // Если передан userId, привязываем покупки к пользователю
      if (userId) {
        await Purchases.logIn(userId)
      }

      // Получаем информацию о текущем пользователе
      this.customerInfo = await Purchases.getCustomerInfo()

      // Проверяем доступность Google Play Billing
      try {
        await Purchases.canMakePayments()
      } catch (err) {
        // Error handled silently
      }

      this.isInitialized = true
    } catch (error) {
      this.initializationError = error as Error
      this.isInitialized = false
    }
  }

  /**
   * Проверка статуса премиум подписки
   * Подписка остается активной до конца оплаченного периода, даже если отменена
   */
  async isPremium(): Promise<boolean> {
    try {
      if (!this.isInitialized && !this.initializationError) {
        // Попытка инициализации если еще не была выполнена
        await this.initialize()
      }

      if (!this.isInitialized) {
        return false
      }

      const customerInfo = await this.getCustomerInfo()
      const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]

      // Если entitlement не существует - нет премиум
      if (!entitlement) {
        return false
      }

      // Проверяем, не истекла ли подписка
      const expirationDate = entitlement.expirationDate
        ? new Date(entitlement.expirationDate)
        : null

      const now = new Date()

      // Подписка активна если дата окончания еще не наступила
      // Даже если подписка отменена, доступ остается до конца оплаченного периода
      if (expirationDate && expirationDate > now) {
        return true // Доступ до конца оплаченного периода
      }

      // Подписка истекла
      return false
    } catch (error) {
      return false
    }
  }

  /**
   * Получение информации о клиенте
   */
  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      this.customerInfo = await Purchases.getCustomerInfo()
      return this.customerInfo
    } catch (error) {
      throw error
    }
  }

  /**
   * Получение текущего статуса подписки
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const customerInfo = await this.getCustomerInfo()
      const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]

      const willRenew = entitlement?.willRenew ?? true
      const isCanceled = entitlement?.unsubscribeDetectedAt !== undefined &&
        entitlement?.unsubscribeDetectedAt !== null

      // Проверяем, не истекла ли подписка (даже если отменена, доступ до конца периода)
      const expirationDate = entitlement?.expirationDate
        ? new Date(entitlement.expirationDate)
        : null
      const now = new Date()

      const isPremium = entitlement !== undefined &&
        expirationDate !== null &&
        expirationDate > now

      return {
        isPremium,
        isInitialized: this.isInitialized,
        customerInfo,
        expirationDate: entitlement?.expirationDate
          ? new Date(entitlement.expirationDate)
          : null,
        willRenew,
        isCanceled,
      }
    } catch (error) {
      return {
        isPremium: false,
        isInitialized: this.isInitialized,
        customerInfo: null,
        expirationDate: null,
        willRenew: false,
        isCanceled: false,
      }
    }
  }

  /**
   * Получение предложений подписок (offerings)
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      const offerings = await Purchases.getOfferings()
      const { current } = offerings

      if (current) {
        // Попробуем загрузить продукты напрямую по Product ID из Google Play
        const productIds = ['premium_monthly', 'premium_yearly']

        try {
          const directProducts = await Purchases.getProducts(productIds)

          // Сохраняем в кеш для использования в UI
          directProducts.forEach(product => {
            // Кешируем по полному ID (например, premium_monthly:base-monthly)
            this.directProductsCache.set(product.identifier, product)

            // Также кешируем по короткому ID для быстрого поиска
            const shortId = product.identifier.split(':')[0]
            if (shortId) {
              this.directProductsCache.set(shortId, product)
            }
          })

          // Если storeProduct не загружен, попробуем сопоставить direct products с packages
          for (const pkg of current.availablePackages) {
            if (!pkg.storeProduct) {
              // Ищем соответствующий product по identifier
              const matchingProduct = directProducts.find(p => (pkg.identifier.includes('monthly')
                ? p.identifier.includes('monthly')
                : p.identifier.includes('yearly')))

              if (matchingProduct) {
                // Присваиваем storeProduct напрямую (patch для работы в UI)
                ; (pkg as any).storeProduct = matchingProduct
              }
            }
          }
        } catch (err) {
          // Error handled silently
        }
      }

      return current
    } catch (error) {
      return null
    }
  }

  /**
   * Покупка подписки
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg)
      this.customerInfo = customerInfo
      return customerInfo
    } catch (error) {
      const purchasesError = error as PurchasesError

      if (purchasesError.userCancelled) {
        throw new Error('Покупка отменена пользователем')
      } else {
        throw purchasesError
      }
    }
  }

  /**
   * Восстановление покупок
   */
  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases()
      this.customerInfo = customerInfo
      return customerInfo
    } catch (error) {
      throw error
    }
  }

  /**
   * Привязка покупок к пользователю
   */
  async linkUserAccount(userId: string): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.logIn(userId)
      this.customerInfo = customerInfo
      return customerInfo
    } catch (error) {
      throw error
    }
  }

  /**
   * Отвязка покупок от пользователя
   */
  async unlinkUserAccount(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.logOut()
      this.customerInfo = customerInfo
      return customerInfo
    } catch (error) {
      throw error
    }
  }

  /**
   * Получение RevenueCat User ID
   */
  async getRevenueCatUserId(): Promise<string> {
    try {
      const customerInfo = await this.getCustomerInfo()
      return customerInfo.originalAppUserId
    } catch (error) {
      throw error
    }
  }

  /**
   * Получение прямых продуктов (fallback для storeProduct)
   */
  getDirectProduct(productId: string): any | null {
    // Ищем по полному ID или короткому
    return this.directProductsCache.get(productId) ||
      this.directProductsCache.get(productId.split(':')[0]) ||
      null
  }

  /**
   * Получение всех прямых продуктов из кеша
   */
  getAllDirectProducts(): any[] {
    return Array.from(this.directProductsCache.values())
  }

  /**
   * Получение ошибки инициализации (если была)
   */
  getInitializationError(): Error | null {
    return this.initializationError
  }

  /**
   * Проверка, инициализирован ли сервис
   */
  getIsInitialized(): boolean {
    return this.isInitialized
  }
}

export const subscriptionService = new SubscriptionService()

