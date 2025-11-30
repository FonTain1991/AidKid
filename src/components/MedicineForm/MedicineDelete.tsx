import { FONT_SIZE } from '@/constants/font'
import { useEvent, useMyNavigation, useRoute } from '@/hooks'
import { useMedicineKit } from '@/hooks/useMedicineKit'
import { useTheme } from '@/providers/theme'
import { memo } from 'react'
import { Alert, Pressable } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'

export const MedicineDelete = memo(() => {
  const { colors } = useTheme()
  const { deleteMedicineKit } = useMedicine()
  const { params } = useRoute()
  const { goBack } = useMyNavigation()

  const handleDelete = useEvent(() => {
    Alert.alert('Удалить аптечку?', 'Это действие нельзя будет отменить', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive',
        onPress: async () => {
          await deleteMedicineKit(String(params?.medicineKitId))
          goBack()
        }
      }
    ])
  })

  return (
    <Pressable
      onPress={handleDelete}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Icon name='trash' size={FONT_SIZE.xl} color={colors.error} />
    </Pressable>
  )
})