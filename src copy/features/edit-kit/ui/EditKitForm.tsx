import { View, StyleSheet, ScrollView, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Card,
  Title,
  Paragraph,
  TextInput,
  Button,
} from '@/shared/ui'
import { useState } from 'react'
import { useEditKitForm } from '../model'
import { KIT_COLORS, KIT_ICONS } from '@/shared/config/constants'
import { MedicineKit } from '@/entities/kit/model/types'

interface EditKitFormProps {
  kit: MedicineKit
  onSubmit: (success: boolean) => void
  onCancel: () => void
}

export const EditKitForm = ({ kit, onSubmit, onCancel }: EditKitFormProps) => {
  const insets = useSafeAreaInsets()
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  const {
    formData,
    errors,
    isLoading,
    handleInputChange,
    handleSubmit
  } = useEditKitForm(kit)

  const handleFormSubmit = async () => {
    const success = await handleSubmit()

    if (success) {
      setSnackbarMessage('Аптечка успешно обновлена!')
      setSnackbarVisible(true)
      onSubmit(true)
    } else {
      setSnackbarMessage('Пожалуйста, исправьте ошибки в форме')
      setSnackbarVisible(true)
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <Card style={styles.card}>
          <Card.Content>
            <Title>Редактировать аптечку</Title>

            {/* Название */}
            <TextInput
              label="Название аптечки *"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              error={!!errors.name}
              style={styles.input}
              mode="outlined"
              placeholder="например: Домашняя аптечка"
            />
            <HelperText type="error" visible={!!errors.name}>
              {errors.name}
            </HelperText>

            {/* Описание */}
            <TextInput
              label="Описание"
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              error={!!errors.description}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Краткое описание аптечки"
            />
            <HelperText type="error" visible={!!errors.description}>
              {errors.description}
            </HelperText>

            {/* Цвет */}
            <View style={styles.section}>
              <Title style={styles.sectionTitle}>Цвет</Title>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.colorScrollView}
                contentContainerStyle={styles.colorScrollContent}
              >
                <SegmentedButtons
                  value={formData.color}
                  onValueChange={(value) => handleInputChange('color', value)}
                  buttons={Object.entries(KIT_COLORS).map(([key, color]) => ({
                    value: key,
                    label: '',
                    style: { backgroundColor: color, minWidth: 50 }
                  }))}
                  style={styles.colorSegmentedButtons}
                />
              </ScrollView>
            </View>

            {/* Иконка */}
            <View style={styles.section}>
              <Title style={styles.sectionTitle}>Иконка</Title>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.iconScrollView}
                contentContainerStyle={styles.iconScrollContent}
              >
                <SegmentedButtons
                  value={formData.icon}
                  onValueChange={(value) => handleInputChange('icon', value)}
                  buttons={Object.entries(KIT_ICONS).map(([key, icon]) => ({
                    value: key,
                    label: icon,
                    style: { minWidth: 50 }
                  }))}
                  style={styles.iconSegmentedButtons}
                />
              </ScrollView>
            </View>

            {/* Предварительный просмотр */}
            <View style={styles.section}>
              <Title style={styles.sectionTitle}>Предварительный просмотр</Title>
              <Card style={[styles.previewCard, { borderLeftColor: KIT_COLORS[formData.color as keyof typeof KIT_COLORS] }]}>
                <Card.Content>
                  <View style={styles.previewHeader}>
                    <View style={styles.previewInfo}>
                      <Title style={styles.previewName}>{formData.name || 'Название аптечки'}</Title>
                      {formData.description && (
                        <Paragraph style={styles.previewDescription}>{formData.description}</Paragraph>
                      )}
                    </View>
                    <View style={styles.previewIcon}>
                      <Text style={styles.previewIconText}>
                        {KIT_ICONS[formData.icon as keyof typeof KIT_ICONS]}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </View>

            {/* Кнопки */}
            <View style={styles.buttons}>
              <Button
                mode="outlined"
                onPress={onCancel}
                style={styles.button}
              >
                Отмена
              </Button>
              <Button
                mode="contained"
                onPress={handleFormSubmit}
                loading={isLoading}
                disabled={isLoading}
                style={styles.button}
              >
                Сохранить
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    elevation: 2,
  },
  input: {
    marginBottom: 8,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  previewCard: {
    borderLeftWidth: 4,
    elevation: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: '#666',
  },
  colorScrollView: {
    marginBottom: 16,
  },
  colorScrollContent: {
    paddingHorizontal: 0,
  },
  colorSegmentedButtons: {
    flexDirection: 'row',
  },
  iconScrollView: {
    marginBottom: 16,
  },
  iconScrollContent: {
    paddingHorizontal: 0,
  },
  iconSegmentedButtons: {
    flexDirection: 'row',
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewIconText: {
    fontSize: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
})
