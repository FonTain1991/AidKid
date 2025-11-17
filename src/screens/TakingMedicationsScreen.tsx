import { Button } from '@/components/Button'
import { FamilyMemberCarousel } from '@/components/FamilyMember'
import { useCheckExistsFamilyMember } from '@/components/FamilyMember/hooks'
import { Greetings } from '@/components/Greetings'
import { Flex, SafeAreaView } from '@/components/Layout'
import { useMyNavigation, useNavigationBarColor, useScreenProperties } from '@/hooks'
import { UseScreenPropertiesOptions } from '@/hooks/useScreenProperties'
import { useMemo } from 'react'

export function TakingMedicationsScreen() {
  const { navigate } = useMyNavigation()

  const options = useMemo<UseScreenPropertiesOptions>(() => ({
    navigationOptions: {
      headerShown: false,
    }
  }), [])


  useScreenProperties(options)

  useNavigationBarColor()
  useCheckExistsFamilyMember()

  return (
    <SafeAreaView>
      <Flex>
        <Greetings />
        <FamilyMemberCarousel />
        <Button
          title='Добавить члена семьи'
          onPress={() => {
            navigate('familyMember')
          }}
        />
      </Flex>
    </SafeAreaView>
  )
}
