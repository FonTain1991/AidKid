import React from 'react'
import Icon from 'react-native-vector-icons/Feather'

interface TabIconProps {
  name: string
  color: string
  size: number
}

export const TabIcon: React.FC<TabIconProps> = ({ name, color, size }) => {
  return <Icon name={name} size={size} color={color} />
}
