/**
 * Хук для работы с подпиской
 */

import { subscriptionService, SubscriptionStatus } from '@/lib'
import { useEffect, useState, useCallback } from 'react'
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
  const [isPremium, setIsPremium] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null)

  /**
   * Обновление статуса подписки
   */
  const refreshStatus = useCallback(async () => {
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
  }, [])

  /**
   * Загрузка предложений
   */
  const loadOfferings = useCallback(async () => {
    try {
      setError(null)
      const currentOfferings = await subscriptionService.getOfferings()
      setOfferings(currentOfferings)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      console.error('Error loading offerings:', error)
    }
  }, [])

  /**
   * Покупка подписки
   */
  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<CustomerInfo> => {
    try {
      setError(null)
      const customerInfo = await subscriptionService.purchasePackage(pkg)

      // Обновляем статус после покупки
      await refreshStatus()

      return customerInfo
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    }
  }, [refreshStatus])

  /**
   * Восстановление покупок
   */
  const restorePurchases = useCallback(async (): Promise<CustomerInfo> => {
    try {
      setError(null)
      const customerInfo = await subscriptionService.restorePurchases()

      // Обновляем статус после восстановления
      await refreshStatus()

      return customerInfo
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    }
  }, [refreshStatus])

  // Загрузка статуса при монтировании компонента
  useEffect(() => {
    refreshStatus()
    loadOfferings()
  }, [refreshStatus, loadOfferings])

  return {
    isPremium,
    isLoading,
    error,
    status,
    offerings,
    refreshStatus,
    loadOfferings,
    purchasePackage,
    restorePurchases,
  }
}

