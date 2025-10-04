import { SPACING } from '@/shared/config'
import { DatePicker, KitList, List, Textarea } from '@/shared/ui'
import { Button } from '@/shared/ui/Button'
import { FormItemWrapper } from '@/shared/ui/FormItemWrapper'
import { TextInput } from '@/shared/ui/TextInput'
import React from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useMedicineForm, useMedicineFormOptions } from '../model'
import { MedicineFormProps } from '../model/types'

export const MedicineForm: React.FC<MedicineFormProps> = ({
  initialData,
  onSubmit,
  kitId
}) => {
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
          onChange={(date: Date) => updateField('expiryDate', date.toISOString())}
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
})
