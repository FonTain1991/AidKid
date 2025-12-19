import { memo, useEffect, useState } from 'react'
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
        'Не удалось открыть управление подпиской',
        'Пожалуйста, откройте Google Play → Профиль → Платежи и подписки → Подписки вручную.'
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
        <Text style={styles.title}>Спасибо за поддержку! 🎉</Text>
        {isCanceled && expirationDate ? (
          <View style={styles.canceledWarning}>
            <Text style={[styles.canceledTitle, { color: colors.error }]}>
              ⚠️ Подписка отменена
            </Text>
            <Text style={[styles.canceledText, { color: colors.muted }]}>
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

      <Features title='Ваши премиум функции:' />

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
        <Text style={[styles.manageHint, { color: colors.muted }]}>
          Вы можете отменить подписку или изменить её параметры в Google Play
        </Text>
      </View>

      <View style={styles.refundInfoSection}>
        <Text style={[styles.refundTitle, { color: colors.text }]}>
          💰 Политика возврата средств
        </Text>
        <Text style={[styles.refundText, { color: colors.muted }]}>
          Подписку можно отменить в любое время. После отмены подписка продолжит действовать до конца оплаченного периода, и вы сохраните доступ ко всем премиум функциям до этой даты.
        </Text>
        <Text style={[styles.refundText, { color: colors.muted, marginTop: SPACING.sm }]}>
          <Text style={{ fontWeight: '600' }}>Полный возврат средств</Text> возможен в течение 48 часов после покупки через Google Play → Подписки → Запросить возврат.
        </Text>
      </View>
    </>
  )
})