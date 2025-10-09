import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { DatePicker, KitList, List, Textarea } from '@/shared/ui'
import { Button } from '@/shared/ui/Button'
import { FormItemWrapper } from '@/shared/ui/FormItemWrapper'
import { TextInput } from '@/shared/ui/TextInput'
import React, { useEffect } from 'react'
import { Alert, StyleSheet, View, TouchableOpacity, Image, Text } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useMedicineForm, useMedicineFormOptions } from '../model'
import { MedicineFormProps } from '../model/types'
import { pickMedicinePhoto, getMedicinePhotoUri, deleteMedicinePhoto } from '@/shared/lib'
import { useTheme } from '@/app/providers/theme'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation/types'
// уведомления удалены

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export const MedicineForm: React.FC<MedicineFormProps> = ({
  initialData,
  onSubmit,
  kitId
}) => {
  const { colors } = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute()
  const {
    formData,
    loading,
    error,
    updateField,
    validateForm,
    setLoading,
    setError
  } = useMedicineForm(kitId, initialData)

  const { formOptions, unitOptions, loading: optionsLoading } = useMedicineFormOptions()

  // Обработка результата сканирования штрих-кода при возврате
  useEffect(() => {
    const params = route.params as any
    if (params?.scannedBarcode) {
      updateField('barcode', params.scannedBarcode)
      // Очищаем параметр после использования
      navigation.setParams({ scannedBarcode: undefined } as any)
    }
  }, [route.params, navigation, updateField])

  const handleScanBarcode = () => {
    navigation.navigate('BarcodeScanner')
  }

  const handlePickPhoto = async () => {
    const photoPath = await pickMedicinePhoto()
    if (photoPath) {
      updateField('photoPath', photoPath)
    }
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
            if (formData.photoPath) {
              await deleteMedicinePhoto(formData.photoPath)
            }
            updateField('photoPath', undefined)
          }
        }
      ]
    )
  }

  const handleSubmit = async () => {
    const validation = validateForm()

    if (!validation.isValid) {
      const [firstError] = Object.values(validation.errors)
      if (firstError) {
        Alert.alert('Ошибка валидации', firstError)
      }
      return
    }

    try {
      setLoading(true)
      setError(null)

      await onSubmit(formData)

      Alert.alert('Успех', 'Лекарство успешно сохранено')
    } catch (err) {
      console.error('Ошибка при сохранении лекарства:', err)
      Alert.alert('Ошибка', 'Не удалось сохранить лекарство')
    } finally {
      setLoading(false)
    }
  }


  if (optionsLoading) {
    return null // Можно добавить индикатор загрузки
  }

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      enableAutomaticScroll={true}
      enableOnAndroid={true}
      extraScrollHeight={SPACING.xl}
      extraHeight={SPACING.xl}
      keyboardShouldPersistTaps='handled'
      showsVerticalScrollIndicator={false}
    >
      <FormItemWrapper>
        <TextInput
          label='Название лекарства'
          value={formData.name}
          onChangeText={text => updateField('name', text)}
          error={error || undefined}
        />
      </FormItemWrapper>

      {/* Фото лекарства */}
      <FormItemWrapper>
        <View style={styles.photoContainer}>
          {formData.photoPath ? (
            <View style={styles.photoPreview}>
              <Image
                source={{ uri: getMedicinePhotoUri(formData.photoPath) || undefined }}
                style={styles.photoImage}
                resizeMode='cover'
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
              style={[styles.addPhotoButton, { borderColor: colors.border }]}
              onPress={handlePickPhoto}
            >
              <Text style={styles.addPhotoIcon}>📷</Text>
              <Text style={[styles.addPhotoText, { color: colors.text }]}>Добавить фото</Text>
              <Text style={[styles.addPhotoHint, { color: colors.textSecondary }]}>
                Сфотографируйте упаковку или само лекарство
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </FormItemWrapper>

      {/* Штрих-код */}
      <FormItemWrapper>
        <TextInput
          label='Штрих-код'
          value={formData.barcode || ''}
          onChangeText={text => updateField('barcode', text)}
        // placeholder='Введите или отсканируйте'
        />
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={handleScanBarcode}
        >
          <Text style={styles.scanButtonText}>📷 Сканировать штрих-код</Text>
        </TouchableOpacity>
      </FormItemWrapper>

      <FormItemWrapper>
        <Textarea
          label='Описание'
          value={formData.description}
          onChangeText={text => updateField('description', text)}
          numberOfLines={3}
        />
      </FormItemWrapper>

      <FormItemWrapper>
        <TextInput
          label='Производитель'
          value={formData.manufacturer}
          onChangeText={text => updateField('manufacturer', text)}
        />
      </FormItemWrapper>

      <FormItemWrapper>
        <View style={styles.rowContainer}>
          <View style={styles.dosageContainer}>
            <TextInput
              label='Дозировка'
              value={formData.dosage}
              onChangeText={text => updateField('dosage', text)}
              style={styles.dosageInput}
            />
          </View>
          <View style={styles.unitContainer}>
            <List
              fieldName='Единица'
              options={unitOptions}
              value={formData.unit}
              onChange={(value: string) => updateField('unit', value)}
            />
          </View>
        </View>
      </FormItemWrapper>

      <FormItemWrapper>
        <KitList
          value={formData.kitId}
          onChange={(selectedKitId: string) => updateField('kitId', selectedKitId)}
        />
      </FormItemWrapper>

      <FormItemWrapper>
        <List
          fieldName='Форма выпуска'
          options={formOptions}
          value={formData.form}
          onChange={(value: string) => updateField('form', value)}
        />
      </FormItemWrapper>

      <FormItemWrapper>
        <TextInput
          label='Количество'
          value={formData.quantity.toString()}
          onChangeText={text => {
            const num = parseInt(text, 10) || 0
            updateField('quantity', num)
          }}
          keyboardType='numeric'
        />
      </FormItemWrapper>

      <FormItemWrapper>
        <DatePicker
          fieldName='Срок годности'
          value={formData.expiryDate ? new Date(formData.expiryDate) : undefined}
          onChange={(date: Date) => {
            console.log('DatePicker onChange:', date, date.toISOString())
            updateField('expiryDate', date.toISOString())
          }}
          placeholder='Выберите срок годности'
          mode='date'
          minimumDate={new Date()}
        />
      </FormItemWrapper>

      <FormItemWrapper>
        <Button
          title={initialData ? 'Сохранить изменения' : 'Добавить лекарство'}
          onPress={handleSubmit}
          disabled={loading}
        />
      </FormItemWrapper>

      {/* Кнопки тестовых уведомлений удалены */}
    </KeyboardAwareScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dosageContainer: {
    flex: 2,
  },
  unitContainer: {
    flex: 1,
  },
  dosageInput: {
    flex: 1,
  },
  photoContainer: {
    marginVertical: SPACING.sm,
  },
  photoPreview: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  photoActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.sm,
  },
  photoButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  photoButtonText: {
    color: 'white',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  addPhotoButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: SPACING.xl,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  addPhotoIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  addPhotoText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  addPhotoHint: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  scanButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanButtonText: {
    color: 'white',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
})
