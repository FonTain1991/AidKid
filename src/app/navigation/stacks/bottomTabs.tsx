import { HomeScreen, IntakeScreen, MoreScreen } from '@/screens'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import React from 'react'
import { Text } from 'react-native'

const Tab = createBottomTabNavigator()

const homeTabBarIcon = () => (
  <Text style={{ fontSize: 24 }}>🏠</Text>
)

const intakeTabBarIcon = () => (
  <Text style={{ fontSize: 22 }}>💊</Text>
)

const moreTabBarIcon = () => (
  <Text style={{ fontSize: 24 }}>⋯</Text>
)

export function BottomTabsStack() {

  return (
    <Tab.Navigator>
      <Tab.Screen
        name='Home'
        component={HomeScreen}
        options={{
          tabBarIcon: homeTabBarIcon,
          title: 'Аптечки'
        }}
      />
      <Tab.Screen
        name='Intake'
        component={IntakeScreen}
        options={{
          tabBarIcon: intakeTabBarIcon,
          title: 'Прием'
        }}
      />
      <Tab.Screen
        name='More'
        component={MoreScreen}
        options={{
          tabBarIcon: moreTabBarIcon,
          title: 'Еще'
        }}
      />
    </Tab.Navigator>
  )
}
