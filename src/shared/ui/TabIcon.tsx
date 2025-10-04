import React from 'react'
import { View, StyleSheet } from 'react-native'

interface TabIconProps {
  name: string
  color: string
  size: number
}

export const TabIcon: React.FC<TabIconProps> = ({ color, size }) => {
  return (
    <View style={[styles.icon, {
      width: size,
      height: size,
      backgroundColor: color,
      borderRadius: size / 2
    }]} />
  )
}

const styles = StyleSheet.create({
  icon: {
    // Базовые стили для иконки
  },
})
