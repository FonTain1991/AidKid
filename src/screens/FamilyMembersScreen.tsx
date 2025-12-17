import { FamilyMembers } from '@/components/FamilyMember'
import { Background, Flex, SafeAreaView } from '@/components/Layout'
import { FONT_SIZE } from '@/constants/font'
import { useMyNavigation, useNavigationBarColor, useScreenProperties } from '@/hooks'
import { Pressable } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'

export function FamilyMembersScreen() {
  const { navigate } = useMyNavigation()

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: 'Список членов семьи',
      headerRight: () => (
        <Pressable
          onPress={() => navigate('familyMember')}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }]}
        >
          <Icon name='plus' size={FONT_SIZE.heading} />
        </Pressable>
      )
    }
  })
  useNavigationBarColor()

  return (
    <Background>
      <SafeAreaView edges={['bottom']}>
        <Flex >
          <FamilyMembers />
        </Flex>
      </SafeAreaView>
    </Background>
  )
}
