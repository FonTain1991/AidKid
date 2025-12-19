/**
 * Хук для работы с подпиской
 * Использует store для хранения состояния
 */

import { subscriptionService, SubscriptionStatus } from '@/lib'
import { useAppStore } from '@/store'
import { useEvent } from '@/hooks/useEvent'
import type { PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases'

export interface UseSubscriptionReturn {

  /** Статус премиум подписки */
  isPremium: boolean

  /** Загрузка данных */
  isLoading: boolean

  /** Ошибка при работе с подпиской */
  error: Error | null

  /** Полный статус подписки */
  status: SubscriptionStatus | null

  /** Предложения подписок (offerings) */
  offerings: PurchasesOffering | null

  /** Обновить статус подписки */
  refreshStatus: () => Promise<void>

  /** Загрузить предложения */
  loadOfferings: () => Promise<void>

  /** Купить подписку */
  purchasePackage: (pkg: PurchasesPackage) => Promise<CustomerInfo>

  /** Восстановить покупки */
  restorePurchases: () => Promise<CustomerInfo>
}

export function useSubscription(): UseSubscriptionReturn {
  const subscription = useAppStore(state => state.subscription)
  const {
    setIsPremium,
    setIsLoading,
    setError,
    setStatus,
    setOfferings,
  } = useAppStore(state => state.subscription)

  const refreshStatus = useEvent(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const subscriptionStatus = await subscriptionService.getSubscriptionStatus()
      setStatus(subscriptionStatus)
      setIsPremium(subscriptionStatus.isPremium)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      console.error('Error refreshing subscription status:', error)
    } finally {
      setIsLoading(false)
    }
  })

  const loadOfferings = useEvent(async () => {
    try {
      setError(null)
      const currentOfferings = await subscriptionService.getOfferings()
      setOfferings(currentOfferings)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      console.error('Error loading offerings:', error)
    }
  })

  const purchasePackage = useEvent(async (pkg: PurchasesPackage): Promise<CustomerInfo> => {
    try {
      setError(null)
      const customerInfo = await subscriptionService.purchasePackage(pkg)
      await refreshStatus()
      return customerInfo
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    }
  })

  const restorePurchases = useEvent(async (): Promise<CustomerInfo> => {
    try {
      setError(null)
      const customerInfo = await subscriptionService.restorePurchases()
      await refreshStatus()
      return customerInfo
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    }
  })

  return {
    isPremium: subscription.isPremium,
    isLoading: subscription.isLoading,
    error: subscription.error,
    status: subscription.status,
    offerings: subscription.offerings,
    refreshStatus,
    loadOfferings,
    purchasePackage,
    restorePurchases,
  }
}

