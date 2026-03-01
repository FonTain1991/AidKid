import { Button } from '@/components/Button'
import { SafeAreaView } from '@/components/Layout'
import { Text } from '@/components/Text'
import { SPACING } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useMyNavigation, useNavigationBarColor, useScreenProperties } from '@/hooks'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/providers/theme'
import { ScrollView, StyleSheet, View } from 'react-native'

export function SubscribeScreen() {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const navigation = useMyNavigation()

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: t('screens.subscribe')
    }
  })

  useNavigationBarColor()
  return (
    <SafeAreaView edges={['bottom']} style={[{ backgroundColor: colors.background }]}>
      <ScrollView>
        <View style={styles.premiumRequiredContainer}>
          <Text style={styles.premiumIcon}>💎</Text>
          <Text style={[styles.premiumTitle, { color: colors.text }]}>
            {t('subscribe.premiumRequired')}
          </Text>
          <Text style={[styles.premiumDescription, { color: colors.muted }]}>
            {t('subscribe.premiumDesc')}
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={[styles.featureText, { color: colors.text }]}>
                {t('subscribe.cloudBackup')}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={[styles.featureText, { color: colors.text }]}>
                {t('subscribe.syncDevices')}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={[styles.featureText, { color: colors.text }]}>
                {t('subscribe.unlimitedKits')}
              </Text>
            </View>
            {/* <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={[styles.featureText, { color: colors.text }]}>
                Семейный доступ
              </Text>
            </View> */}
          </View>

          <Button
            title={t('subscribe.getSubscription')}
            onPress={() => navigation.replace('subscription')}
            variant='primary'
            size='large'
            style={styles.subscribeButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  premiumRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    minHeight: 400,
  },
  premiumIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  premiumTitle: {
    fontSize: FONT_SIZE.heading,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  premiumDescription: {
    fontSize: FONT_SIZE.md,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  featuresList: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  featureIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
    color: '#4CAF50',
  },
  featureText: {
    fontSize: FONT_SIZE.md,
    flex: 1,
  },
  subscribeButton: {
    marginTop: SPACING.md,
    width: '100%',
  },
})