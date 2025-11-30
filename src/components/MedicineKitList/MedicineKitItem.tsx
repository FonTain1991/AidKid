import { SPACING } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useEvent, useMyNavigation } from '@/hooks'
import { useTheme } from '@/providers/theme'
import { Medicine, MedicineKit } from '@/services/models'
import { memo, useMemo } from 'react'
import { Pressable, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { Row } from '../Layout'
import { Text } from '../Text'
import { useStyles } from './useStyles'
import { useAppStore } from '@/store'

export const MedicineKitItem = memo(({ kit }: { kit: MedicineKit }) => {
  const { colors } = useTheme()
  const { navigate } = useMyNavigation()
  const { medicines } = useAppStore(state => state)

  const styles = useStyles({ iconColor: kit.color })

  const medicinesCount = useMemo(() => {
    return medicines.filter((medicine: Medicine) => medicine.medicineKitId === Number(kit.id)).length || 0
  }, [medicines, kit.id])

  const handlePress = useEvent(() => {
    navigate('medicineList', {
      medicineKitId: Number(kit.id),
      parentIdMedicineKit: Number(kit?.parentId)
    })
  })

  const goToEdit = useEvent(() => {
    navigate('medicineKit', {
      medicineKitId: Number(kit.id)
    })
  })

  return (
    <Pressable
      style={({ pressed }) => [styles.container, { opacity: pressed ? 0.7 : 1 }]}
      onPress={handlePress}
    >
      <Row between>
        <Row style={{ gap: SPACING.md }}>
          <View style={styles.icon} >
            <Icon name='folder' size={FONT_SIZE.heading} color={colors.headerColor} />
          </View>
          <View>
            <Text style={styles.name}>{kit.name}</Text>
            <Text style={styles.medicinesCount}>Лекарств: {medicinesCount}</Text>
          </View>
        </Row>
        <Pressable onPress={goToEdit}>
          <Icon name='edit' size={FONT_SIZE.heading} color={colors.muted} />
        </Pressable>
      </Row>
    </Pressable>
  )
})