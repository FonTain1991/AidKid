import { SPACING } from '@/shared/config'
import { Button } from '@/shared/ui/Button'
import { FormItemWrapper } from '@/shared/ui/FormItemWrapper'
import { TextInput } from '@/shared/ui/TextInput'
import { useState, useEffect } from 'react'
import { Alert, ScrollView, StyleSheet } from 'react-native'
import { KitFormData, KitFormProps } from '../model'
import { ColorPicker, ParentKitList } from '@/shared/ui'

export const KitForm = ({ initialData, onSubmit }: KitFormProps) => {
  const [formData, setFormData] = useState<KitFormData>(initialData || {
    name: '',
    description: '',
    parent: '',
    color: '',
  })

  // Обновляем форму при изменении initialData
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Ошибка', 'Название набора обязательно')
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Ошибка при сохранении:', error)
      Alert.alert('Ошибка', 'Не удалось сохранить набор')
    }
  }


  // Опции для выбора цвета
  const colorOptions = [
    { label: 'Зеленый', value: '#3A944E' },
    { label: 'Синий', value: '#007AFF' },
    { label: 'Светло-зеленый', value: '#34C759' },
    { label: 'Красный', value: '#FF3B30' },
    { label: 'Фиолетовый', value: '#AF52DE' },
  ]

  return (
    <ScrollView style={styles.container}>
      <FormItemWrapper>
        <TextInput
          label='Название набора'
          value={formData.name}
          onChangeText={text => setFormData({ ...formData, name: text })}
        />
      </FormItemWrapper>

      <FormItemWrapper>
        <TextInput
          label='Описание'
          value={formData.description}
          onChangeText={text => setFormData({ ...formData, description: text })}
        />
      </FormItemWrapper>

      <FormItemWrapper>
        <ParentKitList
          value={formData.parent}
          onChange={(value: string) => setFormData({ ...formData, parent: value })}
          excludeKitId={initialData?.id}
        />
      </FormItemWrapper>

      <FormItemWrapper>
        <ColorPicker
          fieldName='Цвет'
          value={formData.color}
          onColorSelect={color => setFormData({ ...formData, color })}
        />
      </FormItemWrapper>

      <FormItemWrapper>
        <Button
          title={initialData ? 'Сохранить' : 'Создать'}
          onPress={handleSubmit}
        />
      </FormItemWrapper>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md
  }
})
