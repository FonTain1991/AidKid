import { Button } from '@/components/Button'
import { QuickActions } from '@/components/Buttons'
import { Empty } from '@/components/Empty'
import { FamilyMemberCarousel } from '@/components/FamilyMember'
import { Greetings } from '@/components/Greetings'
import { Flex, SafeAreaView } from '@/components/Layout'
import { SPACING } from '@/constants'
import { useMyNavigation, useNavigationBarColor, useScreenProperties } from '@/hooks'
import { UseScreenPropertiesOptions } from '@/hooks/useScreenProperties'
import { useAppStore } from '@/store'
import { useMemo } from 'react'
import { ScrollView } from 'react-native'

export function TakingMedicationsScreen() {
  const { navigate } = useMyNavigation()
  const { familyMembers } = useAppStore(state => state)

  const options = useMemo<UseScreenPropertiesOptions>(() => ({
    navigationOptions: {
      headerShown: false,
    }
  }), [])


  useScreenProperties(options)
  useNavigationBarColor()

  if (familyMembers.length === 0) {
    return (
      <Empty
        icon='users'
        title='Семейный состав пуст'
        description='Добавьте членов семьи для начала работы'
      >
        <Button
          variant='primary'
          title='Добавить члена семьи'
          onPress={() => {
            navigate('familyMember')
          }}
          style={{ marginTop: SPACING.md }}
        />
      </Empty>
    )
  }


  return (
    <SafeAreaView>
      <Flex>
        <ScrollView
          nestedScrollEnabled
          keyboardShouldPersistTaps='handled'
        >
          <Greetings />
          <FamilyMemberCarousel />
          <QuickActions />
        </ScrollView>
      </Flex>
    </SafeAreaView>
  )
}
