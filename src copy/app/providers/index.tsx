import { KitListStateProvider } from '@/features/kit-list'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { ComponentType, useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider, useTheme } from './theme'
import { notificationService, databaseService, subscriptionService } from '@/shared/lib'
import { StatusBar } from 'react-native'

export function withProviders<T extends object>(Component: ComponentType<T>) {
  return function WithProviders(props: T) {
    const { colors } = useTheme()

    useEffect(() => {
      const initializeServices = async () => {
        try {
          // Инициализация RevenueCat (подписки)
          // Делаем в первую очередь, так как не требует зависимостей
          await subscriptionService.initialize()
        } catch (error) {
          console.error('Failed to initialize subscriptions:', error)
          // Не критично, приложение продолжит работать без подписок
        }

        try {
          // Инициализация уведомлений и создание каналов для существующих аптечек
          await notificationService.init()

          // Создаем каналы для всех существующих аптечек
          await databaseService.init()
          const kits = await databaseService.getKits()

          for (const kit of kits) {
            await notificationService.createKitChannel(kit)
          }

          // Проверяем ограничения фоновой работы (без показа диалогов)
          // await notificationService.checkAllBackgroundRestrictions()
        } catch (error) {
          console.error('Failed to initialize notifications:', error)
        }
      }

      initializeServices()
    }, [])

    return (
      <GestureHandlerRootView>
        <ThemeProvider>
          <StatusBar barStyle='dark-content' backgroundColor={colors.background} />
          <SafeAreaProvider>
            <BottomSheetModalProvider>
              <KitListStateProvider>
                <Component {...props} />
              </KitListStateProvider>
            </BottomSheetModalProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    )
  }
} 