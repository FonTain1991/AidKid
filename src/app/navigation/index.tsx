import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SplashScreen } from '@/screens'
import { OnboardingScreen } from '@/screens/Onboarding'
import { KitDetailsScreen } from '@/screens/KitDetails'
import { KitScreen } from '@/screens/kit'
import { MedicineScreen } from '@/screens/Medicine'
import { NotificationSettingsScreen } from '@/screens/NotificationSettings'
import { QuickIntakeScreen } from '@/screens/QuickIntake'
import { AddReminderScreen } from '@/screens/AddReminder'
import { RemindersScreen } from '@/screens/Reminders'
import { TodayScreen } from '@/screens/Today'
import { HistoryScreen } from '@/screens/History'
import { StatisticsScreen } from '@/screens/Statistics'
import { ExpiringMedicinesScreen } from '@/screens/ExpiringMedicines'
import { LowStockMedicinesScreen } from '@/screens/LowStockMedicines'
import { FamilyMembersScreen } from '@/screens/FamilyMembers'
import { BarcodeScannerScreen } from '@/screens/BarcodeScanner'
import { ShoppingListScreen } from '@/screens/ShoppingList'
import { AddShoppingItemScreen } from '@/screens/AddShoppingItem'
import { useDatabase, notificationService } from '@/shared/lib'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTheme } from '../providers/theme'
import { RootStackParamList } from './types'
import { BottomTabsStack } from './stacks'

// Экспорт типов навигации
export type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()
// Главный навигатор приложения
export function AppNavigator() {
  const { colors } = useTheme()
  const { error: dbError } = useDatabase()
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem('@onboarding_completed')
      setShowOnboarding(completed !== 'true')
    } catch (error) {
      console.error('Failed to check onboarding status:', error)
      setShowOnboarding(false)
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    // Запрашиваем разрешение на уведомления после завершения онбординга
    setTimeout(async () => {
      try {
        // Проверяем, не запрашивали ли уже разрешение
        const permissionRequested = await AsyncStorage.getItem('@notification_permission_requested')
        if (!permissionRequested) {
          const hasPermission = await notificationService.checkPermission()
          if (!hasPermission) {
            await notificationService.requestPermission()
          }
          await AsyncStorage.setItem('@notification_permission_requested', 'true')
        }
      } catch (error) {
        console.error('Failed to request notification permission:', error)
      }
    }, 1000) // Небольшая задержка для плавного перехода
  }

  // Показываем загрузку пока проверяем статус онбординга
  if (showOnboarding === null) {
    return null
  }

  // Если нужно показать онбординг
  if (showOnboarding) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name='Splash'>
          {() => <OnboardingScreen onComplete={handleOnboardingComplete} />}
        </Stack.Screen>
      </Stack.Navigator>
    )
  }

  // // Показываем splash экран пока база данных не инициализирована
  // if (!isInitialized) {
  //   return (
  //     <Stack.Navigator screenOptions={{ headerShown: false }}>
  //       <Stack.Screen name='Splash' component={SplashScreen} />
  //     </Stack.Navigator>
  //   )
  // }

  // Если ошибка инициализации БД, показываем splash с ошибкой
  if (dbError) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name='Splash' component={SplashScreen} />
      </Stack.Navigator>
    )
  }

  // Основное приложение
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name='BottomTabs' component={BottomTabsStack} />
      <Stack.Screen
        name='Kit'
        component={KitScreen}
      />
      <Stack.Screen
        name='KitDetails'
        component={KitDetailsScreen}
      />
      <Stack.Screen
        name='Medicine'
        component={MedicineScreen}
      />
      <Stack.Screen
        name='AddMedicine'
        component={MedicineScreen}
        options={{
          title: 'Добавить лекарство',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='NotificationSettings'
        component={NotificationSettingsScreen}
        options={{
          title: 'Настройки уведомлений',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='QuickIntake'
        component={QuickIntakeScreen}
        options={{
          title: 'Быстрый прием',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='AddReminder'
        component={AddReminderScreen}
        options={{
          title: 'Добавить напоминание',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='Reminders'
        component={RemindersScreen}
        options={{
          title: 'Напоминания',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='Today'
        component={TodayScreen}
        options={{
          title: 'Сегодня',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='History'
        component={HistoryScreen}
        options={{
          title: 'История приема',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='Statistics'
        component={StatisticsScreen}
        options={{
          title: 'Статистика',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='ExpiringMedicines'
        component={ExpiringMedicinesScreen}
        options={{
          title: 'Истекающие лекарства',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='LowStockMedicines'
        component={LowStockMedicinesScreen}
        options={{
          title: 'Заканчиваются',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='FamilyMembers'
        component={FamilyMembersScreen}
        options={{
          title: 'Члены семьи',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='BarcodeScanner'
        component={BarcodeScannerScreen}
        options={{
          title: 'Сканер штрих-кода',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='ShoppingList'
        component={ShoppingListScreen}
        options={{
          title: 'Список покупок',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='AddShoppingItem'
        component={AddShoppingItemScreen}
        options={{
          title: 'Добавить товар',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  )
}
