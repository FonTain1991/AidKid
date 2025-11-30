import { SPACING } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useEvent, useMyNavigation } from '@/hooks'
import { useTheme } from '@/providers/theme'
import { Medicine } from '@/services/models'
import { memo } from 'react'
import { Image, Pressable, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { Row } from '../Layout'
import { Text } from '../Text'
import { useStyles } from './useStyles'
import { getMedicinePhotoUri } from '@/helpers'

export const MedicineItem = memo(({ medicine }: { medicine: Medicine }) => {
  const { colors } = useTheme()
  const { navigate } = useMyNavigation()

  const styles = useStyles()

  const handlePress = useEvent(() => {
    navigate('medicine', {
      medicineId: Number(medicine.id)
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
          <View>
            <Text style={styles.name}>{medicine.name}</Text>
          </View>
        </Row>
        <Icon name='edit' size={FONT_SIZE.heading} color={colors.muted} />
      </Row>
    </Pressable>
  )
})