import { Background, Flex, SafeAreaView } from '@/components/Layout'
import { NotificationSettings } from '@/components/NotificationSettings'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'

export function NotificationSettingsScreen() {
  const { t } = useTranslation()

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: t('screens.notificationSettings')
    }
  })

  useNavigationBarColor()


  return (
    <SafeAreaView edges={[]}>
      <Background>
        <Flex>
          <ScrollView
            keyboardShouldPersistTaps='handled'
            nestedScrollEnabled
          >
            <NotificationSettings />
          </ScrollView>
        </Flex>
      </Background>
    </SafeAreaView>
  )
}