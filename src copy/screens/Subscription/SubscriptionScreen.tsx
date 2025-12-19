import { Alert, ScrollView, StyleSheet, Text, View, ActivityIndicator, Linking, Platform } from 'react-native'
import { useEffect, useState, useCallback } from 'react'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation/types'
import { useTheme } from '@/app/providers/theme'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { Button } from '@/shared/ui/Button'
import { useSubscription } from '@/shared/hooks/useSubscription'
import { subscriptionService } from '@/shared/lib'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import type { PurchasesPackage } from 'react-native-purchases'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export function SubscriptionScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<NavigationProp>()
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

  // Берем все packages (storeProduct может загрузиться позже)
  const packages = offerings?.availablePackages || []

  // Логирование для отладки
  const [retryCount, setRetryCount] = useState(0)

  // Проверяем детальный статус для отображения информации об отмене
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)

  // Обновляем статус подписки при возвращении на экран
  useFocusEffect(useCallback(() => {
    refreshStatus()
    // Загружаем детальный статус для проверки отмены
    const loadStatus = async () => {
      const status = await subscriptionService.getSubscriptionStatus()
      setSubscriptionStatus(status)
    }
    loadStatus()
  }, [refreshStatus]))

  useEffect(() => {
    if (isPremium) {
      const loadStatus = async () => {
        const status = await subscriptionService.getSubscriptionStatus()
        setSubscriptionStatus(status)
      }
      loadStatus()
    }
  }, [isPremium])

  useEffect(() => {
    if (offerings && offerings.availablePackages.length > 0) {
      const hasStoreProducts = packages.some(pkg => pkg.storeProduct)

      console.log('🛒 Subscription Screen - Packages:', packages.map(pkg => ({
        identifier: pkg.identifier,
        productId: pkg.storeProduct?.identifier,
        price: pkg.storeProduct?.priceString,
        title: pkg.storeProduct?.title,
        hasStoreProduct: !!pkg.storeProduct,
      })))

      if (!hasStoreProducts && retryCount === 0) {
        console.warn('⚠️ StoreProduct not loaded. This is normal for debug builds.')
        console.warn('💡 To test with real prices, build a release APK and install it.')
        setRetryCount(1)

        const retryTimer = setTimeout(() => {
          console.log('🔄 Retrying to load offerings with storeProduct...')
          loadOfferings()
        }, 3000)

        return () => clearTimeout(retryTimer)
      }
    }
  }, [offerings, packages, loadOfferings, retryCount])

  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      await purchasePackage(pkg)
      Alert.alert(
        'Успешно! 🎉',
        'Ваша премиум подписка активирована. Спасибо за поддержку!',
        [
          {
            text: 'Отлично',
            onPress: () => {
              navigation.goBack()
            },
          },
        ]
      )
    } catch (err: any) {
      if (err.message === 'Покупка отменена пользователем') {
        return
      }
      Alert.alert('Ошибка', 'Не удалось оформить подписку. Попробуйте еще раз.')
    }
  }

  const handleRestore = async () => {
    try {
      await restorePurchases()
      await refreshStatus()

      const currentIsPremium = await subscriptionService.isPremium()

      if (currentIsPremium) {
        Alert.alert(
          'Успешно! ✅',
          'Ваши покупки восстановлены.',
          [
            {
              text: 'Отлично',
              onPress: () => {
                navigation.goBack()
              },
            },
          ]
        )
      } else {
        Alert.alert(
          'Не найдено',
          'Не удалось найти активные покупки для восстановления.'
        )
      }
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось восстановить покупки. Попробуйте еще раз.')
    }
  }

  const handleManageSubscription = async () => {
    try {
      // Открываем страницу управления подпиской в Google Play
      if (Platform.OS === 'android') {
        const url = 'https://play.google.com/store/account/subscriptions'
        const canOpen = await Linking.canOpenURL(url)
        if (canOpen) {
          await Linking.openURL(url)
        } else {
          // Альтернативный способ - открыть через package name
          const packageUrl = 'market://details?id=com.aidkit'
          await Linking.openURL(packageUrl)
        }
      }
    } catch (err) {
      console.error('Error opening subscription management:', err)
      Alert.alert(
        'Не удалось открыть управление подпиской',
        'Пожалуйста, откройте Google Play → Профиль → Платежи и подписки → Подписки вручную.'
      )
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: SPACING.lg,
    },
    header: {
      alignItems: 'center',
      marginBottom: SPACING.xl,
    },
    premiumIcon: {
      fontSize: 64,
      marginBottom: SPACING.md,
    },
    title: {
      fontSize: FONT_SIZE.heading,
      fontFamily: 'Roboto-Bold',
      color: colors.text,
      marginBottom: SPACING.xs,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: FONT_SIZE.md,
      color: colors.textSecondary,
      lineHeight: 24,
      textAlign: 'center',
      paddingHorizontal: SPACING.md,
    },
    premiumBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      borderRadius: 20,
      alignSelf: 'flex-start',
      marginBottom: SPACING.md,
    },
    premiumBadgeText: {
      color: colors.white,
      fontSize: FONT_SIZE.sm,
      fontFamily: 'Roboto-Medium',
    },
    featuresContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: SPACING.lg,
      marginBottom: SPACING.xl,
    },
    featuresTitle: {
      fontSize: FONT_SIZE.lg,
      fontFamily: 'Roboto-Bold',
      color: colors.text,
      marginBottom: SPACING.md,
    },
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: SPACING.sm,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '50%',
      marginBottom: SPACING.md,
    },
    featureIcon: {
      fontSize: 18,
      marginRight: SPACING.xs,
      color: colors.primary,
    },
    featureText: {
      fontSize: FONT_SIZE.sm,
      color: colors.text,
      flex: 1,
    },
    packagesContainer: {
      gap: SPACING.md,
      marginBottom: SPACING.lg,
    },
    packageCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: SPACING.lg,
      borderWidth: 2,
      borderColor: colors.border,
      position: 'relative',
      overflow: 'hidden',
    },
    packageCardRecommended: {
      borderColor: colors.primary,
      borderWidth: 3,
      backgroundColor: colors.primary + '08',
    },
    recommendedBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: colors.primary,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      borderBottomLeftRadius: 12,
      zIndex: 1,
    },
    recommendedText: {
      color: colors.white,
      fontSize: FONT_SIZE.xs,
      fontFamily: 'Roboto-Bold',
    },
    packageContent: {
      marginTop: SPACING.xs,
    },
    packageTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: SPACING.xs,
    },
    packageTitle: {
      fontSize: FONT_SIZE.lg,
      fontFamily: 'Roboto-Bold',
      color: colors.text,
      flex: 1,
      marginRight: SPACING.md,
    },
    packagePriceContainer: {
      alignItems: 'flex-end',
    },
    packagePrice: {
      fontSize: FONT_SIZE.xxl,
      fontFamily: 'Roboto-Bold',
      color: colors.primary,
      lineHeight: 32,
    },
    packagePricePeriod: {
      fontSize: FONT_SIZE.xs,
      color: colors.textSecondary,
      fontFamily: 'Roboto-Regular',
    },
    packageDescription: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      marginBottom: SPACING.md,
      lineHeight: 20,
    },
    packageButton: {
      marginTop: SPACING.xs,
    },
    restoreButton: {
      marginTop: SPACING.md,
    },
    errorContainer: {
      backgroundColor: colors.error + '20',
      padding: SPACING.md,
      borderRadius: 12,
      marginBottom: SPACING.md,
    },
    errorText: {
      color: colors.error,
      fontSize: FONT_SIZE.sm,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: {
      alignItems: 'center',
      padding: SPACING.xl,
    },
    emptyStateText: {
      fontSize: FONT_SIZE.md,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: SPACING.md,
    },
    disclaimer: {
      fontSize: FONT_SIZE.xs,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: SPACING.lg,
      lineHeight: 18,
      paddingHorizontal: SPACING.md,
    },
    manageSection: {
      marginTop: SPACING.xl,
      paddingHorizontal: SPACING.md,
      alignItems: 'center',
    },
    manageButton: {
      marginBottom: SPACING.sm,
      width: '100%',
    },
    manageHint: {
      fontSize: FONT_SIZE.sm,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: SPACING.md,
    },
    refundInfoSection: {
      marginTop: SPACING.xl,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      backgroundColor: colors.card,
      borderRadius: 12,
      marginHorizontal: SPACING.md,
    },
    refundTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
      marginBottom: SPACING.sm,
    },
    refundText: {
      fontSize: FONT_SIZE.sm,
      lineHeight: 20,
    },
    canceledWarning: {
      marginTop: SPACING.md,
      padding: SPACING.md,
      backgroundColor: colors.error + '15',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.error + '40',
    },
    canceledTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
      marginBottom: SPACING.sm,
    },
    canceledText: {
      fontSize: FONT_SIZE.sm,
      lineHeight: 20,
    },
  })

  if (isLoading && !offerings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={colors.primary} />
          <Text style={[styles.emptyStateText, { marginTop: SPACING.md }]}>
            Загрузка...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (isPremium) {
    const isCanceled = subscriptionStatus?.isCanceled
    const expirationDate = subscriptionStatus?.expirationDate

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
          <View style={styles.header}>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>💎 Premium</Text>
            </View>
            <Text style={styles.title}>Спасибо за поддержку! 🎉</Text>
            {isCanceled && expirationDate ? (
              <View style={styles.canceledWarning}>
                <Text style={[styles.canceledTitle, { color: colors.error }]}>
                  ⚠️ Подписка отменена
                </Text>
                <Text style={[styles.canceledText, { color: colors.textSecondary }]}>
                  Ваша подписка была отменена, но она продолжит действовать до{' '}
                  {new Intl.DateTimeFormat('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }).format(expirationDate)}.
                  {'\n\n'}
                  После этой даты премиум функции станут недоступны.
                </Text>
              </View>
            ) : (
              <Text style={styles.subtitle}>
                Ваша премиум подписка активна. Вы имеете доступ ко всем функциям приложения.
              </Text>
            )}
          </View>

          {/* Features list for premium users */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Ваши премиум функции:</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>Неограниченные аптечки</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>Неограниченные лекарства</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>Облачное резервное копирование</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>Семейный доступ</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>Расширенная статистика</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>Экспорт данных</Text>
              </View>
            </View>
          </View>

          <View style={styles.manageSection}>
            <Button
              title='Управление подпиской'
              onPress={handleManageSubscription}
              variant='outline'
              style={styles.manageButton}
            />
            <Button
              title='🔄 Обновить статус'
              onPress={async () => {
                await refreshStatus()
                // Получаем актуальный статус после обновления
                const currentStatus = await subscriptionService.isPremium()
                Alert.alert(
                  'Статус обновлен',
                  currentStatus
                    ? 'Ваша премиум подписка активна'
                    : 'Премиум подписка не активна. Если вы только что оформили подписку, подождите несколько секунд и обновите снова.'
                )
              }}
              variant='outline'
              style={[styles.manageButton, { marginTop: SPACING.sm }]}
            />
            <Text style={[styles.manageHint, { color: colors.textSecondary }]}>
              Вы можете отменить подписку или изменить её параметры в Google Play
            </Text>
          </View>

          <View style={styles.refundInfoSection}>
            <Text style={[styles.refundTitle, { color: colors.text }]}>
              💰 Политика возврата средств
            </Text>
            <Text style={[styles.refundText, { color: colors.textSecondary }]}>
              Подписку можно отменить в любое время. После отмены подписка продолжит действовать до конца оплаченного периода, и вы сохраните доступ ко всем премиум функциям до этой даты.
            </Text>
            <Text style={[styles.refundText, { color: colors.textSecondary, marginTop: SPACING.sm }]}>
              <Text style={{ fontWeight: '600' }}>Полный возврат средств</Text> возможен в течение 48 часов после покупки через Google Play → Подписки → Запросить возврат.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: SPACING.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.premiumIcon}>💎</Text>
          <Text style={styles.title}>Премиум подписка</Text>
          <Text style={styles.subtitle}>
            Откройте все возможности приложения
          </Text>
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              ⚠️ {error.message || 'Произошла ошибка. Попробуйте обновить страницу.'}
            </Text>
          </View>
        )}

        {/* Dev mode info */}
        {__DEV__ && packages.length > 0 && !packages.some(pkg => pkg.storeProduct) && (
          <View style={[styles.errorContainer, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.errorText, { color: colors.primary }]}>
              ℹ️ В режиме разработки цены могут не загружаться из Google Play.{'\n'}
              Это нормально - для тестирования соберите release APK.
            </Text>
          </View>
        )}

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Что включено:</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Неограниченные аптечки</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Неограниченные лекарства</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Облачное резервное копирование</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Семейный доступ</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Расширенная статистика</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Экспорт данных</Text>
            </View>
          </View>
        </View>

        {/* Packages */}
        {packages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Подписки временно недоступны.{'\n'}
              Попробуйте позже или обратитесь в поддержку.
            </Text>
            <Button
              title='Обновить'
              onPress={async () => {
                await refreshStatus()
                await loadOfferings()
              }}
              style={{ marginTop: SPACING.md }}
            />
          </View>
        ) : (
          <View style={styles.packagesContainer}>
            {packages.map((pkg, index) => {
              const isRecommended = index === 0
              const isMonthly = pkg.identifier.includes('monthly') || pkg.identifier.includes('month')

              // Получаем product из кеша, если storeProduct не загружен
              let productInfo = pkg.storeProduct
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

              // Парсим цену для отображения
              const priceString = productInfo?.priceString || (isMonthly ? '0' : '0')
              const priceMatch = priceString.match(/([^\d\s,\.]+)?\s*([\d,\.]+)/)
              const currency = priceMatch ? priceMatch[1] || '' : ''
              const price = priceMatch ? priceMatch[2] : priceString
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
                      <Text style={styles.recommendedText}>⭐ РЕКОМЕНДУЕТСЯ</Text>
                    </View>
                  )}

                  <View style={styles.packageContent}>
                    <View style={styles.packageTitleRow}>
                      <Text style={styles.packageTitle}>
                        {productInfo?.title || (isMonthly ? 'Месячная подписка' : 'Годовая подписка')}
                      </Text>
                      <View style={styles.packagePriceContainer}>
                        <Text style={styles.packagePrice}>
                          {price}
                        </Text>
                        <Text style={styles.packagePricePeriod}>
                          {currency} {isMonthly ? '/мес' : '/год'}
                        </Text>
                      </View>
                    </View>

                    {isMonthly ? (
                      <Text style={styles.packageDescription}>
                        Подписка автоматически продлевается каждый месяц
                      </Text>
                    ) : (
                      <Text style={styles.packageDescription}>
                        Экономия до 40% по сравнению с ежемесячной подпиской
                      </Text>
                    )}

                    <Button
                      title={isRecommended ? 'Выбрать этот план' : 'Выбрать'}
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

        {/* Restore button */}
        <Button
          title='Восстановить покупки'
          onPress={handleRestore}
          variant='outline'
          style={styles.restoreButton}
          disabled={isLoading}
        />

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          Подписка автоматически продлевается, если не отменена за 24 часа до окончания периода.
          {'\n'}Вы можете отменить подписку в любое время в настройках Google Play.
          {'\n\n'}
          <Text style={{ fontWeight: '600' }}>Политика возврата:</Text> Полный возврат средств возможен в течение 48 часов после покупки через Google Play.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}
