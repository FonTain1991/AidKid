import { Button } from '@/components/Button'
import { Empty } from '@/components/Empty'
import { FamilyMembers } from '@/components/FamilyMember'
import { Background, Flex, SafeAreaView } from '@/components/Layout'
import { SPACING } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useMyNavigation, useNavigationBarColor, useScreenProperties } from '@/hooks'
import { useAppStore } from '@/store'
import { Pressable } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'

export function FamilyMembersScreen() {
  const { navigate } = useMyNavigation()
  const familyMembers = useAppStore(state => state.familyMembers)

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

  if (!familyMembers.length) {
    return (
      <SafeAreaView edges={['bottom']}>
        <Background>
          <Empty
            icon='users'
            title='Члены семьи'
            description='Добавьте членов семьи для использования приложения'
          >
            <Button
              title='Добавить члена семьи'
              onPress={() => navigate('familyMember')}
              style={{ marginTop: SPACING.md }}
            />
          </Empty>
        </Background>
      </SafeAreaView>
    )
  }

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
