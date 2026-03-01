import { memo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStyles } from './hooks'
import { useSubscription } from './hooks/useSubscription'
import { subscriptionService } from '@/lib'
import { useFocusEffect } from '@react-navigation/native'
import { useEvent } from '@/hooks'
import { Alert, Linking, Platform, View } from 'react-native'
import { Text } from '../Text'
import { Button } from '../Button'
import { useTheme } from '@/providers/theme'
import { SPACING } from '@/constants'
import { Features } from './Features'

export const IsPremium = memo(() => {
  const { colors } = useTheme()
  const { t, i18n } = useTranslation()
  const styles = useStyles()

  const {
    isPremium,
    refreshStatus,
  } = useSubscription()

  // Проверяем детальный статус для отображения информации об отмене
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)

  useFocusEffect(useEvent(() => {
    refreshStatus()
    subscriptionService.getSubscriptionStatus().then(setSubscriptionStatus)
  }))

  useEffect(() => {
    if (isPremium) {
      subscriptionService.getSubscriptionStatus().then(setSubscriptionStatus)
    }
  }, [isPremium])

  const handleManageSubscription = useEvent(async () => {
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
        t('isPremium.failedToOpenSubscription'),
        t('isPremium.openManually')
      )
    }
  })

  const isCanceled = subscriptionStatus?.isCanceled
  const expirationDate = subscriptionStatus?.expirationDate
  return (
    <>
      <View style={styles.header}>
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>💎 Premium</Text>
        </View>
        <Text style={styles.title}>{t('isPremium.thanksForSupport')}</Text>
        {isCanceled && expirationDate ? (
          <View style={styles.canceledWarning}>
            <Text style={[styles.canceledTitle, { color: colors.error }]}>
              ⚠️ {t('isPremium.subscriptionCanceled')}
            </Text>
            <Text style={[styles.canceledText, { color: colors.muted }]}>
              {t('isPremium.subscriptionCanceledDesc', {
                date: new Intl.DateTimeFormat(i18n.language === 'ru' ? 'ru-RU' : 'en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(expirationDate),
              })}
            </Text>
          </View>
        ) : (
          <Text style={styles.subtitle}>
            {t('isPremium.subscriptionActive')}
          </Text>
        )}
      </View>

      <Features title={t('isPremium.yourPremiumFeatures')} />

      <View style={styles.manageSection}>
        <Button
          title={t('isPremium.manageSubscription')}
          onPress={handleManageSubscription}
          variant='outline'
          style={styles.manageButton}
        />
        <Button
          title={t('isPremium.refreshStatus')}
          onPress={async () => {
            await refreshStatus()
            // Получаем актуальный статус после обновления
            const currentStatus = await subscriptionService.isPremium()
            Alert.alert(
              t('isPremium.statusUpdated'),
              currentStatus
                ? t('isPremium.premiumActive')
                : t('isPremium.premiumInactive')
            )
          }}
          variant='outline'
          style={[styles.manageButton, { marginTop: SPACING.sm }]}
        />
        <Text style={[styles.manageHint, { color: colors.muted }]}>
          {t('isPremium.manageHint')}
        </Text>
      </View>

      <View style={styles.refundInfoSection}>
        <Text style={[styles.refundTitle, { color: colors.text }]}>
          {t('isPremium.refundPolicy')}
        </Text>
        <Text style={[styles.refundText, { color: colors.muted }]}>
          {t('isPremium.refundText')}
        </Text>
        <Text style={[styles.refundText, { color: colors.muted, marginTop: SPACING.sm }]}>
          <Text style={{ fontWeight: '600' }}>{t('isPremium.fullRefundBold')}</Text> {t('isPremium.fullRefundRest')}
        </Text>
      </View>
    </>
  )
})