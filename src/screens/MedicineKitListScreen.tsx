import { FloatingActionButton } from '@/components/FloatingActionButton'
import { Background, Flex, SafeAreaView } from '@/components/Layout'
import { useMyNavigation, useNavigationBarColor, useScreenProperties } from '@/hooks'
import { Text } from 'react-native'

export function MedicineKitListScreen() {
  const { navigate } = useMyNavigation()

  useScreenProperties({
    navigationOptions: {
      headerShown: false,
      title: 'Аптечки'
    },
  })

  useNavigationBarColor()

  const handleAddMedicineKit = () => {
    navigate('medicineKit', {
      medicineKitId: undefined
    })
  }

  return (
    <SafeAreaView edges={['top']}>
      <Background>
        <Flex>
          <Text>Аптечки</Text>
          <FloatingActionButton items={[
            { letter: 'Аптечка', onPress: handleAddMedicineKit },
            { letter: 'Лекарство', onPress: () => { } },
            { letter: 'Штрих-код', onPress: () => { } }
          ]} />
        </Flex>
      </Background>
    </SafeAreaView>
  )
}

