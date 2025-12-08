import { MedicineKitListScreen, MoreScreen, TakingMedicationsScreen } from '@/screens'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from '@/components/Text'
import { StyleSheet } from 'react-native'
import { FONT_SIZE } from '@/constants/font'


export type BottomTabList = {
  takingMedications: undefined;
  medicineKitList: undefined;
  more: undefined;
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
          tabBarIcon: () => <Text style={styles.icon}>💊</Text>,
          tabBarLabel: 'Приём',
        }}
      />
      <BottomTab.Screen
        name='medicineKitList'
        component={MedicineKitListScreen}
        options={{
          tabBarIcon: () => <Text style={styles.icon}>🏠</Text>,
          tabBarLabel: 'Аптечки',
        }}
      />
      <BottomTab.Screen
        name='more'
        component={MoreScreen}
        options={{
          tabBarIcon: () => <Text style={styles.icon}>⋯</Text>,
          tabBarLabel: 'Еще'
        }}
      />
    </ BottomTab.Navigator>
  )
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 20
  }
})