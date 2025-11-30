import { MedicineKitListScreen, TakingMedicationsScreen } from '@/screens'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from '@/components/Text'


export type BottomTabList = {
  takingMedications: undefined;
  medicineKitList: undefined;
}

const BottomTab = createBottomTabNavigator<BottomTabList>()

export function BottomNavigation() {

  return (
    <BottomTab.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName='medicineKitList'
    >
      <BottomTab.Screen name='takingMedications' component={TakingMedicationsScreen}
        options={{
          tabBarIcon: () => <Text>💊</Text>,
          tabBarLabel: 'Приём',
        }}
      />
      <BottomTab.Screen
        name='medicineKitList'
        component={MedicineKitListScreen}
        options={{
          tabBarIcon: () => <Text>🏠</Text>,
          tabBarLabel: 'Аптечки',
        }}
      />
    </ BottomTab.Navigator>
  )
}