import { QuickActions } from '@/components/Buttons'
import { IntakeItemsMenu } from '@/components/Intake'
import { Flex, SafeAreaView } from '@/components/Layout'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { UseScreenPropertiesOptions } from '@/hooks/useScreenProperties'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'

export function TakingMedicationsScreen() {
  const { t } = useTranslation()
  const options = useMemo<UseScreenPropertiesOptions>(
    () => ({
      navigationOptions: {
        headerShown: true,
        title: t('screens.intake'),
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
          <QuickActions />
          <IntakeItemsMenu />
        </ScrollView>
      </Flex>
    </SafeAreaView>
  )
}
