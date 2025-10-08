import { SplashScreen } from '@/screens'
import { KitDetailsScreen } from '@/screens/KitDetails'
import { KitScreen } from '@/screens/kit'
import { MedicineScreen } from '@/screens/Medicine'
import { NotificationSettingsScreen } from '@/screens/NotificationSettings'
import { QuickIntakeScreen } from '@/screens/QuickIntake'
import { AddReminderScreen } from '@/screens/AddReminder'
import { RemindersScreen } from '@/screens/Reminders'
import { useDatabase } from '@/shared/lib'
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
  const { isInitialized, error } = useDatabase()

  // Показываем splash экран пока база данных не инициализирована
  if (!isInitialized) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name='Splash' component={SplashScreen} />
      </Stack.Navigator>
    )
  }

  // Если ошибка инициализации БД, показываем splash с ошибкой
  if (error) {
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
      // options={{
      //   title: 'Аптечка'
      // }}
      />
      <Stack.Screen
        name='KitDetails'
        component={KitDetailsScreen}
      />
      <Stack.Screen
        name='Medicine'
        component={MedicineScreen}
      // options={{
      //   title: 'Лекарство'
      // }}
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
    </Stack.Navigator>
  )
}
