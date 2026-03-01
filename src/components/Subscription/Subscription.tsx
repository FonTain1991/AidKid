import { SPACING } from '@/constants'
import { useTranslation } from 'react-i18next'
import { useEvent, useMyNavigation } from '@/hooks'
import { subscriptionService } from '@/lib'
import { useTheme } from '@/providers/theme'
import { useFocusEffect } from '@react-navigation/native'
import { memo, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, View } from 'react-native'
import { PurchasesPackage } from 'react-native-purchases'
import { Button } from '../Button'
import { Text } from '../Text'
import { Features } from './Features'
import { useStyles } from './hooks'
import { useSubscription } from './hooks/useSubscription'
import { IsPremium } from './IsPremium'

export const Subscription = memo(() => {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const styles = useStyles()
  const navigation = useMyNavigation()

  const {
    isPremium,
    isLoading,
    error,
    offerings,
    purchasePackage,
    restorePurchases,
    refreshStatus,
    loadOfferings,
  } = useSubscription()

  const packages = useMemo(() => offerings?.availablePackages || [], [offerings?.availablePackages])

  const [retryCount, setRetryCount] = useState(0)

  const handleRestore = useEvent(async () => {
    try {
      await restorePurchases()
      await refreshStatus()

      const currentIsPremium = await subscriptionService.isPremium()

      if (currentIsPremium) {
        Alert.alert(
          t('subscription.success'),
          t('subscription.purchasesRestored'),
          [
            {
              text: t('common.great'),
              onPress: () => {
                navigation.goBack()
              },
            },
          ]
        )
      } else {
        Alert.alert(
          t('subscription.notFound'),
          t('subscription.noPurchases')
        )
      }
    } catch (err) {
      Alert.alert(t('support.error'), t('subscription.failedToRestore'))
    }
  })


  const handlePurchase = useEvent(async (pkg: PurchasesPackage) => {
    try {
      await purchasePackage(pkg)
      Alert.alert(
        t('subscription.success'),
        t('subscription.premiumActivated'),
        [
          {
            text: t('common.great'),
            onPress: () => {
              navigation.goBack()
            },
          },
        ]
      )
    } catch (err: any) {
      if (err.message === 'Покупка отменена пользователем' || err.message === 'Purchase cancelled by user') {
        return
      }
      Alert.alert(t('support.error'), t('subscription.failedToSubscribe'))
    }
  })

  useFocusEffect(useEvent(() => {
    refreshStatus()
  }))

  useEffect(() => {
    if (offerings && offerings.availablePackages.length > 0) {
      const hasStoreProducts = packages.some((pkg: any) => (pkg as any).storeProduct)

      if (!hasStoreProducts && retryCount === 0) {
        setRetryCount(1)
        const retryTimer = setTimeout(loadOfferings, 3000)
        return () => clearTimeout(retryTimer)
      }
    }
  }, [offerings, packages, loadOfferings, retryCount])

  if (isLoading && !offerings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={colors.primary} />
        <Text style={[styles.emptyStateText, { marginTop: SPACING.md }]}>
          {t('subscription.loading')}
        </Text>
      </View>
    )
  }

  if (isPremium) {
    return <IsPremium />
  }

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.premiumIcon}>💎</Text>
        <Text style={styles.title}>{t('subscription.premiumTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('subscription.premiumSubtitle')}
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            ⚠️ {error.message || t('subscription.errorOccurred')}
          </Text>
        </View>
      )}

      <Features title={t('subscription.whatIncluded')} />

      {!packages.length && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {t('subscription.subscriptionsUnavailable')}
          </Text>
          <Button
            title={t('updateApp.update')}
            onPress={async () => {
              await refreshStatus()
              await loadOfferings()
            }}
            style={{ marginTop: SPACING.md }}
          />
        </View>
      )}

      {!!packages.length && (
        <View style={styles.packagesContainer}>
          {packages.map((pkg, index) => {
            const isRecommended = index === 0
            const isMonthly = pkg.identifier.includes('monthly') || pkg.identifier.includes('month')

            // Получаем product из кеша, если storeProduct не загружен
            let productInfo: any = (pkg as any).storeProduct
            if (!productInfo) {
              const directProducts = subscriptionService.getAllDirectProducts()
              const matchingProduct = directProducts.find(p => {
                if (isMonthly) {
                  return p.identifier.includes('monthly')
                }
                return p.identifier.includes('yearly')

              })
              if (matchingProduct) {
                productInfo = matchingProduct
              }
            }

            // Получаем цену и валюту
            const priceString = productInfo?.priceString || (isMonthly ? '0' : '0')

            // Пытаемся получить валюту из currencyCode (более надежно)
            let currency = ''
            if (productInfo?.currencyCode) {
              // Конвертируем currencyCode в символ валюты
              const currencyMap: Record<string, string> = {
                'RUB': '₽',
                'USD': '$',
                'EUR': '€',
                'GBP': '£',
                'JPY': '¥',
                'CNY': '¥',
                'KZT': '₸',
                'UAH': '₴',
                'BYN': 'Br',
              }
              currency = currencyMap[productInfo.currencyCode] || productInfo.currencyCode
            }

            // Если currencyCode не доступен, пытаемся парсить из priceString
            if (!currency && priceString) {
              // Пробуем найти валюту в начале строки
              const priceMatchStart = priceString.match(/^(?<currency>[^\d\s,.]+)\s*(?<price>[\d,.]+)/)
              if (priceMatchStart?.groups?.currency) {
                currency = priceMatchStart.groups.currency.trim()
              } else {
                // Пробуем найти валюту в конце строки
                const priceMatchEnd = priceString.match(/(?<price>[\d,.]+)\s*(?<currency>[^\d\s,.]+)$/)
                if (priceMatchEnd?.groups?.currency) {
                  currency = priceMatchEnd.groups.currency.trim()
                }
              }
            }

            // Извлекаем цену (убираем все нецифровые символы кроме точки и запятой)
            const price = priceString.replace(/[^\d,.]/g, '').replace(',', '.') || priceString
            return (
              <View
                key={pkg.identifier}
                style={[
                  styles.packageCard,
                  isRecommended && styles.packageCardRecommended,
                ]}
              >
                {isRecommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>{t('subscription.recommended')}</Text>
                  </View>
                )}

                <View style={styles.packageContent}>
                  <View style={styles.packageTitleRow}>
                    <Text style={styles.packageTitle}>
                      {productInfo?.title || (isMonthly ? t('subscription.monthly') : t('subscription.yearly'))}
                    </Text>
                    <View style={styles.packagePriceContainer}>
                      <Text style={styles.packagePrice}>
                        {price}
                      </Text>
                      <Text style={styles.packagePricePeriod}>
                        {currency} {isMonthly ? t('subscription.perMonth') : t('subscription.perYear')}
                      </Text>
                    </View>
                  </View>

                  {isMonthly ? (
                    <Text style={styles.packageDescription}>
                      {t('subscription.monthlyRenewal')}
                    </Text>
                  ) : (
                    <Text style={styles.packageDescription}>
                      {t('subscription.yearlySavings')}
                    </Text>
                  )}

                  <Button
                    title={isRecommended ? t('subscription.selectPlan') : t('common.select')}
                    onPress={() => handlePurchase(pkg)}
                    variant={isRecommended ? 'primary' : 'outline'}
                    size='large'
                    disabled={isLoading}
                    style={styles.packageButton}
                  />
                </View>
              </View>
            )
          })}
        </View>
      )}

      <Button
        title={t('subscription.restorePurchases')}
        onPress={handleRestore}
        variant='outline'
        style={styles.restoreButton}
        disabled={isLoading}
      />
    </>
  )
})