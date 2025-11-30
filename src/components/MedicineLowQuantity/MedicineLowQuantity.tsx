import { View } from 'react-native'
import { Text } from '../Text'
import { useAppStore } from '@/store'
import { memo, useMemo } from 'react'
import { Medicine } from '@/services/models'
import Icon from 'react-native-vector-icons/Feather'
import { useStyles } from './styles'

export const MedicineLowQuantity = memo(() => {
  const { medicines } = useAppStore(state => state)
  const styles = useStyles()

  const lowQuantityMedicines = useMemo(() => {
    return medicines.filter((medicine: Medicine) => medicine.quantity && medicine.quantity < 5).length
  }, [medicines])

  return (
    <View style={styles.container}>
      <Icon name='alert-triangle' size={24} color='red' />
      <Text> {lowQuantityMedicines} лекарств с низким количеством</Text>
    </View>
  )
})