import { Background, Flex, SafeAreaView } from '@/components/Layout'
import { Subscription } from '@/components/Subscription'
import { useStyles } from '@/components/Subscription/hooks'
import { Text } from '@/components/Text'
import { FONT_WEIGHT } from '@/constants/font'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'

export function SubscriptionScreen() {
  const styles = useStyles()
  const { t } = useTranslation()

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: t('screens.subscription')
    }
  })

  useNavigationBarColor()
  return (
    <SafeAreaView edges={['bottom']}>
      <Background>
        <Flex>
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps='handled'
            contentContainerStyle={styles.content}
          >
            <Subscription />
            <Text style={styles.disclaimer}>
              {t('subscribe.autoRenewal')}
              {'\n'}{t('subscribe.cancelAnytime')}
              {'\n\n'}
              <Text style={{ fontWeight: FONT_WEIGHT.bold }}>{t('subscribe.refundPolicy')}</Text> {t('subscribe.refundPolicyText')}
            </Text>
          </ScrollView>
        </Flex>
      </Background>
    </SafeAreaView>
  )
}