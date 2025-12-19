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
  DEFAULT_OFFERING_ID,
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
        console.warn('⚠️ RevenueCat API key not configured. Subscription features will not work.')
        this.initializationError = new Error('API key not configured')
        return
      }

      // Проверяем формат ключа (для production должен начинаться с goog_)
      // Для тестового ключа может быть формат test_XXXXX (без префикса)
      if (Platform.OS === 'android' && !__DEV__ && !apiKey.startsWith('goog_')) {
        console.error('❌ Invalid Android Production API key format! Should start with "goog_"')
        console.error('   Current key:', apiKey)
        this.initializationError = new Error('Invalid API key format')
        return
      }

      await Purchases.configure({ apiKey })
      console.log('🔑 RevenueCat configured with API key:', apiKey.substring(0, 20) + '...')

      // Если передан userId, привязываем покупки к пользователю
      if (userId) {
        await Purchases.logIn(userId)
        console.log('👤 RevenueCat: User logged in:', userId)
      }

      // Получаем информацию о текущем пользователе
      this.customerInfo = await Purchases.getCustomerInfo()
      console.log('👤 RevenueCat: Customer info loaded')

      // Проверяем доступность Google Play Billing
      try {
        const canMakePayments = await Purchases.canMakePayments()
        console.log('💳 RevenueCat: Can make payments:', canMakePayments)
      } catch (err) {
        console.warn('⚠️ RevenueCat: Error checking payment availability:', err)
      }

      this.isInitialized = true
      console.log('✅ RevenueCat initialized successfully')
    } catch (error) {
      console.error('❌ Error initializing RevenueCat:', error)
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
      console.error('Error checking premium status:', error)
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
      console.error('Error getting customer info:', error)
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

      // Логирование для диагностики
      if (entitlement) {
        console.log('📊 Subscription Status:', {
          identifier: entitlement.identifier,
          expirationDate: entitlement.expirationDate,
          productIdentifier: entitlement.productIdentifier,
          isActive: entitlement.isActive,
          willRenew: entitlement.willRenew,
          unsubscribeDetectedAt: entitlement.unsubscribeDetectedAt,
        })
      } else {
        console.log('📊 No active subscription found')
        // Проверяем все entitlement для диагностики
        console.log('📊 All entitlements:', Object.keys(customerInfo.entitlements.active))
      }

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
      console.error('Error getting subscription status:', error)
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

      console.log('🔄 Fetching offerings from RevenueCat...')
      const offerings = await Purchases.getOfferings()
      const { current } = offerings

      // Логирование для отладки
      if (current) {
        console.log('📦 RevenueCat Offerings loaded:', {
          identifier: current.identifier,
          packagesCount: current.availablePackages.length,
          packages: current.availablePackages.map(pkg => ({
            identifier: pkg.identifier,
            hasStoreProduct: !!pkg.storeProduct,
            productId: pkg.storeProduct?.identifier,
            price: pkg.storeProduct?.priceString,
            title: pkg.storeProduct?.title,
            packageType: pkg.packageType,
          })),
        })

        // Попробуем загрузить продукты напрямую по Product ID из Google Play
        const productIds = ['premium_monthly', 'premium_yearly']
        console.log('🔄 Attempting to fetch products directly by ID:', productIds)

        try {
          const directProducts = await Purchases.getProducts(productIds, 'SUBS')
          console.log('✅ Direct products fetched:', directProducts.map(p => ({
            identifier: p.identifier,
            title: p.title,
            price: p.priceString,
            currencyCode: p.currencyCode,
          })))

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
                console.log(`✅ Found matching product for package ${pkg.identifier}:`, matchingProduct.identifier)
                  // Присваиваем storeProduct напрямую (patch для работы в UI)
                  ; (pkg as any).storeProduct = matchingProduct
              }
            }
          }
        } catch (err) {
          console.error('❌ Error fetching products directly:', err)
        }

        // Дополнительная диагностика для каждого package
        for (const pkg of current.availablePackages) {
          if (!pkg.storeProduct) {
            console.warn(`⚠️ Package ${pkg.identifier} has no storeProduct`)
            console.warn('   Package type:', pkg.packageType)
          } else {
            console.log(`✅ Package ${pkg.identifier} has storeProduct:`, {
              identifier: pkg.storeProduct.identifier,
              title: pkg.storeProduct.title,
              price: pkg.storeProduct.priceString,
              currencyCode: pkg.storeProduct.currencyCode,
            })
          }
        }
      } else {
        console.warn('⚠️ RevenueCat: No current offering found')
        console.warn('   All offerings:', Object.keys(offerings.all))
      }

      return current
    } catch (error) {
      console.error('❌ Error getting offerings:', error)
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
        console.error('Error purchasing package:', purchasesError)
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
      console.error('Error restoring purchases:', error)
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
      console.error('Error linking user account:', error)
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
      console.error('Error unlinking user account:', error)
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
      console.error('Error getting RevenueCat User ID:', error)
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

