import { deleteMedicinePhoto, getMedicinePhotoUri, pickMedicinePhoto } from '@/helpers'
import { useTheme } from '@/providers/theme'
import { memo } from 'react'
import { Alert, Image, TouchableOpacity, View } from 'react-native'
import { Text } from '../Text'
import { useStyles } from './useStyles'

interface MedicinePhotoProps {
  value: string | null
  onChange: (value: string | null) => void
}

export const MedicinePhoto: React.FC<MedicinePhotoProps> = memo(({ value, onChange }) => {
  const { colors } = useTheme()
  const styles = useStyles()

  const handlePickPhoto = async () => {
    const photoPath = await pickMedicinePhoto()
    onChange?.(photoPath || null)
  }

  const handleRemovePhoto = () => {
    Alert.alert(
      'Удалить фото?',
      'Вы уверены, что хотите удалить фото лекарства?',
      [
        {
          text: 'Отмена',
          style: 'cancel'
        },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            if (value) {
              await deleteMedicinePhoto(value)
            }
          }
        }
      ]
    )
  }

  return (
    <View style={styles.photoContainer}>
      {value ? (
        <View style={styles.photoPreview}>
          <Image
            source={{ uri: getMedicinePhotoUri(value) || undefined }}
            style={styles.photoImage}
            resizeMode='contain'
          />
          <View style={styles.photoActions}>
            <TouchableOpacity
              style={[styles.photoButton, { backgroundColor: colors.primary }]}
              onPress={handlePickPhoto}
            >
              <Text style={styles.photoButtonText}>Изменить фото</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoButton, { backgroundColor: colors.error }]}
              onPress={handleRemovePhoto}
            >
              <Text style={styles.photoButtonText}>Удалить</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addPhotoButton}
          onPress={handlePickPhoto}
        >
          <Text style={styles.addPhotoIcon}>📷</Text>
          <Text style={styles.addPhotoText}>Добавить фото</Text>
          <Text style={styles.addPhotoHint}>
            Сфотографируйте упаковку или само лекарство
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
})