import { FamilyMemberForm } from '@/components/FamilyMember'
import { Background, Flex, SafeAreaView } from '@/components/Layout'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { useTranslation } from 'react-i18next'

export function FamilyMemberScreen() {
  const { t } = useTranslation()

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: t('screens.addFamilyMember')
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
