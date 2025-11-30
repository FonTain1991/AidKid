import { Flex, SafeAreaView } from '@/components/Layout'
import { MedicineForm } from '@/components/MedicineForm'
import { useNavigationBarColor, useRoute, useScreenProperties } from '@/hooks'

export function MedicineScreen() {
  const { params } = useRoute()


  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: params?.medicineId ? 'Редактирование лекарства' : 'Добавление лекарства',
    }
  })

  useNavigationBarColor()

  return (
    <SafeAreaView edges={['bottom']}>
      <Flex>
        <MedicineForm />
      </Flex>
    </SafeAreaView>
  )
}
