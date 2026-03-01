import { Flex, SafeAreaView } from '@/components/Layout'
import { Today } from '@/components/Today'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { UseScreenPropertiesOptions } from '@/hooks/useScreenProperties'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'

export function TodayScreen() {
  const { t } = useTranslation()
  const options = useMemo<UseScreenPropertiesOptions>(
    () => ({
      navigationOptions: {
        headerShown: true,
        title: t('screens.today'),
      },
    }),
    [t]
  )

  useScreenProperties(options)
  useNavigationBarColor()

  return (
    <SafeAreaView>
      <Flex>
        <ScrollView
          nestedScrollEnabled
          keyboardShouldPersistTaps='handled'
        >
          <Today />
        </ScrollView>
      </Flex>
    </SafeAreaView >
  )
}
