import { useTheme } from '@/app/providers/theme'
import { ErrorState, KitList, useHomeScreen } from '@/features/home'
import { QuickCreateSheet } from '@/features/quick-create'
import { useNavigationBarColor, useScreenProperties } from '@/shared/hooks'
import { FAB } from '@/shared/ui/FAB'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { Alert, TouchableOpacity, Text } from 'react-native'
import { sendTestNotification, sendInstantNotification, checkNotificationPermission, notificationService } from '@/shared/lib'

export function HomeScreen() {
  const { colors } = useTheme()
  const {
    kits,
    loading,
    error,
    refreshKits,
    quickCreateSheetRef,
    quickCreateOptions,
    handleKitPress,
    handleKitEdit,
    handleKitDelete,
    handleAddMedicineToKit,
    handleOptionPress,
  } = useHomeScreen()

  const handleTestNotification = async () => {
    try {
      // Проверяем разрешение
      const hasPermission = await checkNotificationPermission()

      if (!hasPermission) {
        Alert.alert(
          'Разрешение на уведомления',
          'Нужно разрешить уведомления',
          [
            { text: 'Отмена', style: 'cancel' },
            {
              text: 'Разрешить',
              onPress: async () => {
                const granted = await notificationService.requestPermission()
                if (!granted) {
                  Alert.alert('Ошибка', 'Разрешение не получено')
                  return
                }
                handleTestNotification()
              }
            }
          ]
        )
        return
      }

      // Показываем меню выбора
      Alert.alert(
        '🧪 Тест уведомлений',
        'Выберите тип теста',
        [
          {
            text: '⚡ Мгновенное',
            onPress: async () => {
              await sendInstantNotification('🎉 Работает!', 'Уведомления настроены правильно')
              Alert.alert('✅ Готово', 'Уведомление отправлено!')
            }
          },
          {
            text: '⏱️ Через 5 секунд',
            onPress: async () => {
              if (kits.length === 0) {
                Alert.alert('Ошибка', 'Сначала создайте аптечку')
                return
              }
              const [firstKit] = kits
              await sendTestNotification(firstKit.id, 5)
              Alert.alert('✅ Готово', `Уведомление для "${firstKit.name}" придёт через 5 секунд`)
            }
          },
          {
            text: '🚨 Критическое (10 сек)',
            onPress: async () => {
              if (kits.length === 0) {
                Alert.alert('Ошибка', 'Сначала создайте аптечку')
                return
              }
              const [firstKit] = kits
              const { sendTestExpiredNotification } = await import('@/shared/lib')
              await sendTestExpiredNotification(firstKit.id, 10)
              Alert.alert('✅ Готово', 'Критическое уведомление придёт через 10 секунд (с вибрацией)')
            }
          },
          {
            text: 'Отмена',
            style: 'cancel'
          }
        ]
      )
    } catch (err) {
      console.error('Test notification error:', err)
      Alert.alert('Ошибка', 'Не удалось отправить тест')
    }
  }

  useScreenProperties({
    navigationOptions: {
      title: 'Аптечки',
      headerShown: true,
      headerRight: () => (
        <TouchableOpacity
          onPress={handleTestNotification}
          style={{ marginRight: 16, padding: 8 }}
        >
          <Text style={{ fontSize: 24 }}>🧪</Text>
        </TouchableOpacity>
      )
    }
  })
  useNavigationBarColor()


  if (error) {
    return (
      <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
        <ErrorState error={error} onRetry={refreshKits} />
        <FAB onPress={() => quickCreateSheetRef.current?.present()} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
      <KitList
        kits={kits}
        loading={loading}
        onRefresh={refreshKits}
        onKitPress={handleKitPress}
        onKitEdit={handleKitEdit}
        onKitDelete={handleKitDelete}
        onAddMedicine={handleAddMedicineToKit}
      />
      <FAB onPress={() => quickCreateSheetRef.current?.present()} />

      <QuickCreateSheet
        ref={quickCreateSheetRef}
        options={quickCreateOptions}
        onOptionPress={handleOptionPress}
      />
    </SafeAreaView>
  )
}