import { HomeScreen } from '@/screens'
import { useNavigationStyles } from '@/shared/hooks'
import { TabIcon } from '@/shared/ui'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import React from 'react'

const Tab = createBottomTabNavigator()

const tabBarIcon = ({ color, size }: { color: string; size: number }) => (
  <TabIcon name='home' color={color} size={size} />
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
          tabBarIcon
        }}
      />
    </Tab.Navigator>
  )
}
