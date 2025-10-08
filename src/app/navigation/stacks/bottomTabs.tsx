import { HomeScreen, IntakeScreen, MoreScreen } from '@/screens'
import { useNavigationStyles } from '@/shared/hooks'
import { TabIcon } from '@/shared/ui'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import React from 'react'

const Tab = createBottomTabNavigator()

const homeTabBarIcon = ({ color, size }: { color: string; size: number }) => (
  <TabIcon name='home' color={color} size={size} />
)

const intakeTabBarIcon = ({ color, size }: { color: string; size: number }) => (
  <TabIcon name='calendar' color={color} size={size} />
)

const moreTabBarIcon = ({ color, size }: { color: string; size: number }) => (
  <TabIcon name='more-horizontal' color={color} size={size} />
)

export function BottomTabsStack() {
  const navigationStyles = useNavigationStyles()

  return (
    <Tab.Navigator
      screenOptions={navigationStyles}
    >
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
