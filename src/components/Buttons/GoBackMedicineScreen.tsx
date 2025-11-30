import { SPACING } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useEvent, useMyNavigation, useRoute } from '@/hooks'
import { MedicineKit } from '@/services/models'
import { useAppStore } from '@/store'
import { Pressable, StyleSheet } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'

export const GoBackMedicineScreen = () => {
  const { params } = useRoute()
  const { medicineKits } = useAppStore(state => state)
  const { navigate, goBack } = useMyNavigation()

  const handleSmartBackPress = useEvent(() => {
    const currentKit = medicineKits.find((kit: MedicineKit) => kit.id === params?.medicineKitId)
    if (currentKit?.parentId) {
      navigate('medicineList', { medicineKitId: Number(currentKit?.parentId) })
      return
    }
    goBack()
  })

  return (
    <Pressable
      onPress={handleSmartBackPress}
      style={({ pressed }) => ([styles.container, {
        opacity: pressed ? 0.7 : 1,
      }])}
    >
      <Icon name='arrow-left' size={FONT_SIZE.heading} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    marginRight: SPACING.xl
  }
})