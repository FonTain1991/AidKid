import { SPACING, UNITS } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useEvent, useMyNavigation } from '@/hooks'
import { useTheme } from '@/providers/theme'
import { Medicine, MedicineKit } from '@/services/models'
import { memo, useMemo } from 'react'
import { Image, Pressable, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import dayjs from 'dayjs'
import { Row } from '../Layout'
import { Text } from '../Text'
import { useStyles } from './useStyles'
import { getMedicinePhotoUri } from '@/helpers'
import { useAppStore } from '@/store'

export const MedicineItem = memo(({ medicine, showKit = true }: { medicine: Medicine, showKit?: boolean }) => {
  const { colors } = useTheme()
  const { navigate } = useMyNavigation()
  const { medicineKits } = useAppStore(state => state)

  const styles = useStyles()

  const medicineKit = useMemo(() => {
    if (!showKit) {
      return null
    }
    return medicineKits.find((kit: MedicineKit) => kit.id === medicine.medicineKitId)
  }, [medicineKits, medicine.medicineKitId, showKit])

  const handlePress = useEvent(() => {
    navigate('medicine', {
      medicineId: Number(medicine.id)
    })
  })

  const unit = useMemo(() => {
    return UNITS.find((item: any) => item.value === medicine.unitForQuantity)
  }, [medicine.unitForQuantity])

  const isLowQuantity = medicine.quantity === 0

  return (
    <Pressable
      style={({ pressed }) => [styles.container, {
        opacity: pressed ? 0.7 : 1,
        backgroundColor: isLowQuantity ? colors.error + '20' : 'transparent'
      }]}
      onPress={handlePress}
    >
      {showKit && (
        <View style={[styles.medicineKitTag, {
          backgroundColor: medicineKit?.color
        }]}>
          <Text style={styles.medicineKitTagName}>{medicineKit?.name}</Text>
        </View>
      )}
      <Row between>
        <Row style={{ gap: SPACING.md }}>
          <View style={styles.icon} >
            {medicine.photoPath && (
              <Image
                source={{ uri: String(getMedicinePhotoUri(String(medicine.photoPath))) }}
                style={styles.icon}
                resizeMode='cover'
              />
            )}
            {!medicine.photoPath && (
              <View style={styles.emptyIcon} >
                <Icon name='image' size={FONT_SIZE.heading} color={colors.primary} />
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{medicine.name}</Text>
            <View style={styles.infoRow}>
              {medicine.quantity !== null && medicine.quantity !== undefined && (
                <Text style={[styles.infoText, { color: colors.muted }]}>
                  📦 {medicine.quantity} {unit?.shortLabel || 'шт.'}
                </Text>
              )}
              {medicine.expirationDate && (
                <Text style={[styles.infoText, { color: colors.muted }]}>
                  ⏰ {dayjs(+medicine.expirationDate).format('DD.MM.YYYY')}
                </Text>
              )}
            </View>
          </View>
        </Row>
        <Icon name='edit' size={FONT_SIZE.heading} color={colors.muted} />
      </Row>
    </Pressable>
  )
})