import { useState } from 'react'
import {
  View,
  Text,
  Alert
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useTheme } from '@/app/providers/theme'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { Textarea } from '@/shared/ui/Textarea'
import { Button } from '@/shared/ui/Button'
import { MedicineAutoComplete } from '@/shared/ui/AutoComplete'
import { useNavigationBarColor, useScreenProperties } from '@/shared/hooks'
import { useAddShoppingItemStyles } from '@/shared/hooks/useAddShoppingItemStyles'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation/types'
import { databaseService } from '@/shared/lib'

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddShoppingItem'>

export function AddShoppingItemScreen() {
  const { colors } = useTheme()
  const styles = useAddShoppingItemStyles()
  const navigation = useNavigation<NavigationProp>()
  const [medicineName, setMedicineName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: 'Добавить лекарство'
    }
  })
  useNavigationBarColor()

  const handleSave = async () => {
    if (!medicineName.trim()) {
      Alert.alert('Ошибка', 'Введите название лекарства')
      return
    }

    try {
      setLoading(true)
      await databaseService.init()

      await databaseService.createShoppingItem({
        medicineName: medicineName.trim(),
        description: description.trim() || undefined
      })

      navigation.goBack()
    } catch (err) {
      console.error('Failed to add shopping item:', err)
      Alert.alert('Ошибка', 'Не удалось добавить товар')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <View style={styles.field}>
            <MedicineAutoComplete
              value={medicineName}
              onChangeText={setMedicineName}
              label='Введите название лекарства'
              style={styles.autoComplete}
            />
          </View>
          <View style={styles.field}>
            <Textarea
              label='Описание'
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.helpText}>
            <Text style={styles.helpTextContent}>
              💡 Совет: Начните вводить название лекарства, и мы покажем подходящие варианты из вашей аптечки
            </Text>
          </View>

          <Button
            title={loading ? 'Сохранение...' : 'Сохранить'}
            onPress={handleSave}
            disabled={!medicineName.trim() || loading}
            loading={loading}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

