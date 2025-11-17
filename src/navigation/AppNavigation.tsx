import { FamilyMemberScreen, MedicineKitScreen } from '@/screens'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native'
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useEffect } from 'react'
import SplashScreen from 'react-native-bootsplash'
import { BottomNavigation, BottomTabList } from './BottomNavigation'

export type MainList = {
  bottomNavigation: NavigatorScreenParams<BottomTabList> | undefined;
  familyMember: {
    familyMemberId?: string
    referer?: string
  } | undefined;
  medicineKit: {
    medicineKitId?: string
  } | undefined;
}

export type SplashList = {
  splash: undefined;
}

// Тип для навигации - определяется в одном месте
export type AppNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<MainList>,
  CompositeNavigationProp<
    BottomTabNavigationProp<BottomTabList>,
    NativeStackNavigationProp<MedicineKitList>
  >
>

const MainStack = createNativeStackNavigator<MainList>()

export function AppNavigation() {

  useEffect(() => {
    SplashScreen.hide()
  }, [])

  return (
    <MainStack.Navigator
      screenOptions={{ headerShown: false }}
    >
      <MainStack.Screen name='bottomNavigation' component={BottomNavigation} />
      <MainStack.Screen name='familyMember' component={FamilyMemberScreen} />
      <MainStack.Screen name='medicineKit' component={MedicineKitScreen} />
    </MainStack.Navigator>
  )
}