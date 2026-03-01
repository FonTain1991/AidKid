import { MedicineKitListScreen, MoreScreen, TakingMedicationsScreen } from '@/screens'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from '@/components/Text'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { FONT_SIZE } from '@/constants/font'

export type BottomTabList = {
  takingMedications: undefined
  medicineKitList: undefined
  more: undefined
}

const BottomTab = createBottomTabNavigator<BottomTabList>()

export function BottomNavigation() {
  const { t } = useTranslation()

  return (
    <BottomTab.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName='medicineKitList'
    >
      <BottomTab.Screen
        name='takingMedications'
        component={TakingMedicationsScreen}
        options={{
          tabBarIcon: () => <Text style={styles.icon}>💊</Text>,
          tabBarLabel: t('nav.intake'),
        }}
      />
      <BottomTab.Screen
        name='medicineKitList'
        component={MedicineKitListScreen}
        options={{
          tabBarIcon: () => <Text style={styles.icon}>🏠</Text>,
          tabBarLabel: t('nav.medicineKits'),
        }}
      />
      <BottomTab.Screen
        name='more'
        component={MoreScreen}
        options={{
          tabBarIcon: () => <Text style={styles.icon}>⋯</Text>,
          tabBarLabel: t('nav.more'),
        }}
      />
    </BottomTab.Navigator>
  )
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 20
  }
})