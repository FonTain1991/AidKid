import { FONT_SIZE } from '@/constants/font'
import { useEvent, useMyNavigation, useRoute } from '@/hooks'
import { useMedicineKit } from '@/hooks/useMedicineKit'
import { useTheme } from '@/providers/theme'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Pressable } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'

export const MedicineKitDelete = memo(() => {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const { deleteMedicineKit } = useMedicineKit()
  const { params } = useRoute()
  const { goBack } = useMyNavigation()

  const handleDelete = useEvent(() => {
    Alert.alert(t('medicineKitDelete.title'), t('medicineKitDelete.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive',
        onPress: async () => {
          await deleteMedicineKit(params?.medicineKitId)
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