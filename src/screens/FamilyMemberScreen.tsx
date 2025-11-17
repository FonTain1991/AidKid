import { FamilyMemberForm } from '@/components/FamilyMember'
import { Background, Flex, SafeAreaView } from '@/components/Layout'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'

export function FamilyMemberScreen() {
  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: 'Добавление члена семьи'
    }
  })
  useNavigationBarColor()

  return (
    <Background>
      <SafeAreaView edges={['bottom']}>
        <Flex>
          <FamilyMemberForm />
        </Flex>
      </SafeAreaView>
    </Background>
  )
}
