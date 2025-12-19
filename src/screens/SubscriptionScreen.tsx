import { Background, Flex, SafeAreaView } from '@/components/Layout'
import { Subscription } from '@/components/Subscription'
import { useStyles } from '@/components/Subscription/hooks'
import { Text } from '@/components/Text'
import { FONT_WEIGHT } from '@/constants/font'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { ScrollView } from 'react-native'

export function SubscriptionScreen() {
  const styles = useStyles()
  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: 'Подписка'
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
              Подписка автоматически продлевается, если не отменена за 24 часа до окончания периода.
              {'\n'}Вы можете отменить подписку в любое время в настройках Google Play.
              {'\n\n'}
              <Text style={{ fontWeight: FONT_WEIGHT.bold }}>Политика возврата:</Text> Полный возврат средств возможен в течение 48 часов после покупки через Google Play.
            </Text>
          </ScrollView>
        </Flex>
      </Background>
    </SafeAreaView>
  )
}