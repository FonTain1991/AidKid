import { Flex, SafeAreaView } from '@/components/Layout'
import { MedicineDelete, MedicineForm } from '@/components/MedicineForm'
import { useNavigationBarColor, useRoute, useScreenProperties } from '@/hooks'

export function MedicineScreen() {
  const { params } = useRoute()


  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: params?.medicineId ? 'Редактирование лекарства' : 'Добавление лекарства',
      headerRight: () => params?.medicineId && <MedicineDelete />
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
