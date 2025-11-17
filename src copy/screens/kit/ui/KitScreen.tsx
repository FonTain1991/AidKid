import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { KitForm } from '@/features/kit-form'
import { KitFormData } from '@/features/kit-form/model'
import { useNavigationBarColor, useRoute, useScreenProperties } from '@/shared/hooks'
import { BackButton } from '@/shared/ui'
import { useTheme } from '@/app/providers/theme'
import { kitApi } from '@/entities/kit/api'
import { useKitListState } from '@/features/kit-list'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, View } from 'react-native'
import { canCreateKit, formatLimitMessage } from '@/shared/lib'
import type { RootStackParamList } from '@/app/navigation/types'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

interface RouteParams {
  kitId?: string
  mode: 'create' | 'edit'
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export const KitScreen = () => {
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute()
  const { mode, kitId } = (route.params as RouteParams) || { mode: 'create' }
  const { colors } = useTheme()
  const { addKit, updateKit, refreshKits } = useKitListState()
  const [initialData, setInitialData] = useState<KitFormData | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  useScreenProperties({
    navigationOptions: {
      headerTitle: 'Аптечка',
      headerShown: true,
      headerTransparent: false,
      headerLeft: () => <BackButton />
    }
  })

  useNavigationBarColor({ color: 'transparent' })

  // Загружаем данные аптечки для редактирования
  useEffect(() => {
    if (mode === 'edit' && kitId) {
      const loadKitData = async () => {
        setLoading(true)
        try {
          const kit = await kitApi.getKitById(kitId)
          if (kit) {
            const formData = kitApi.kitToFormData(kit)
            setInitialData(formData)
          }
        } catch (error) {
          console.error('Error loading kit:', error)
        } finally {
          setLoading(false)
        }
      }
      loadKitData()
    }
  }, [mode, kitId])

  const handleSubmit = async (data: KitFormData) => {
    try {
      if (mode === 'create') {
        // Проверка лимита для бесплатной версии
        const limitCheck = await canCreateKit()
        
        if (!limitCheck.allowed) {
          Alert.alert(
            'Достигнут лимит 🚫',
            formatLimitMessage(limitCheck),
            [
              {
                text: 'Отмена',
                style: 'cancel',
              },
              {
                text: 'Оформить Premium 💎',
                onPress: () => {
                  navigation.navigate('Subscription')
                },
                style: 'default',
              },
            ],
            { cancelable: true }
          )
          return
        }

        // Создать новый kit в базе данных
        const newKit = await kitApi.createKitFromForm(data)

        // Добавить в список на главном экране
        addKit(newKit)
      } else {
        // Обновить kit в базе данных
        if (!data.id) {
          throw new Error('ID is required for update')
        }
        await kitApi.updateKitFromForm(data.id, data)

        // Обновить в списке на главном экране
        const updatedKit = await kitApi.getKitById(data.id)
        if (updatedKit) {
          updateKit(updatedKit)
        }
      }

      // Обновить список аптечек перед возвратом
      await refreshKits()
      Alert.alert('Успех', 'Набор успешно сохранен', [{ text: 'OK', onPress: () => navigation.goBack() }])
    } catch (error) {
      console.error('Error saving kit:', error)
      throw error // Перебрасываем ошибку, чтобы KitForm мог показать Alert
    }
  }

  // Показываем загрузку при редактировании
  if (mode === 'edit' && loading) {
    return (
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.background, flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size='large' color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.background }}>
      <KitForm
        initialData={initialData}
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  )
}
