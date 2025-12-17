import { useEvent } from '@/hooks'
import { notificationService } from '@/lib'
import { AddReminderScreen, AddShoppingItemScreen, BarcodeScannerScreen, FamilyMemberScreen, FamilyMembersScreen, MedicineKitScreen, MedicineListScreen, MedicineScreen, NotificationSettingsScreen, OnboardingScreen, QuickIntakeScreen, RemindersScreen, ShoppingListScreen, TodayScreen } from '@/screens'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native'
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useEffect, useState } from 'react'
import SplashScreen from 'react-native-bootsplash'
import { BottomNavigation, BottomTabList } from './BottomNavigation'

export type MainList = {
  bottomNavigation: NavigatorScreenParams<BottomTabList> | undefined;
  familyMember: {
    familyMemberId?: number
    referer?: string
  } | undefined;
  medicineKit: {
    medicineKitId?: number
  } | undefined;
  medicineList: {
    medicineKitId: number,
    parentIdMedicineKit?: number | null | undefined
  } | undefined;
  onboarding: undefined;
  medicine: {
    medicineId?: number
    medicineName?: string
  } | undefined;
  barcodeScanner: undefined
  quickIntake: undefined
  notificationSettings: undefined
  reminders: undefined
  addReminder: undefined
  today: undefined
  shoppingList: undefined
  addShoppingItem: undefined
  familyMembers: undefined
}

export type SplashList = {
  splash: undefined;
}

// Тип для навигации - определяется в одном месте
export type AppNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<MainList>,
  BottomTabNavigationProp<BottomTabList>
>

const MainStack = createNativeStackNavigator<MainList>()

export function AppNavigation() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null)

  const checkOnboardingStatus = useEvent(async () => {
    try {
      const completed = await AsyncStorage.getItem('@onboarding_completed')
      setShowOnboarding(completed !== 'true')
    } catch (error) {
      console.error('Failed to check onboarding status:', error)
      setShowOnboarding(false)
    }
  })

  const handleOnboardingComplete = useEvent(() => {
    setShowOnboarding(false)
    setTimeout(async () => {
      try {
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
    }, 1000)
  })

  useEffect(() => {
    checkOnboardingStatus()
    SplashScreen.hide()
  }, [checkOnboardingStatus])

  // Показываем загрузку пока проверяем статус онбординга
  if (showOnboarding === null) {
    return null
  }

  if (showOnboarding) {
    return (
      <MainStack.Navigator screenOptions={{ headerShown: false }}>
        <MainStack.Screen name='onboarding'>
          {() => <OnboardingScreen onComplete={handleOnboardingComplete} />}
        </MainStack.Screen>
      </MainStack.Navigator>
    )
  }

  return (
    <MainStack.Navigator
      screenOptions={{ headerShown: false }}
    >
      <MainStack.Screen name='bottomNavigation' component={BottomNavigation} />
      <MainStack.Screen name='familyMember' component={FamilyMemberScreen} />
      <MainStack.Screen name='medicineKit' component={MedicineKitScreen} />
      <MainStack.Screen name='medicineList' component={MedicineListScreen} />
      <MainStack.Screen name='medicine' component={MedicineScreen} />
      <MainStack.Screen name='barcodeScanner' component={BarcodeScannerScreen} />
      <MainStack.Screen name='quickIntake' component={QuickIntakeScreen} />
      <MainStack.Screen name='notificationSettings' component={NotificationSettingsScreen} />
      <MainStack.Screen name='addReminder' component={AddReminderScreen} />
      <MainStack.Screen name='reminders' component={RemindersScreen} />
      <MainStack.Screen name='today' component={TodayScreen} />
      <MainStack.Screen name='shoppingList' component={ShoppingListScreen} />
      <MainStack.Screen name='addShoppingItem' component={AddShoppingItemScreen} />
      <MainStack.Screen name='familyMembers' component={FamilyMembersScreen} />
    </MainStack.Navigator>
  )
}