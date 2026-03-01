import { Flex, SafeAreaView } from '@/components/Layout'
import { Reminders } from '@/components/Reminders'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { UseScreenPropertiesOptions } from '@/hooks/useScreenProperties'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'

export function RemindersScreen() {
  const { t } = useTranslation()
  const options = useMemo<UseScreenPropertiesOptions>(
    () => ({
      navigationOptions: {
        headerShown: true,
        title: t('screens.reminders'),
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
          <Reminders />
        </ScrollView>
      </Flex>
    </SafeAreaView >
  )
}
