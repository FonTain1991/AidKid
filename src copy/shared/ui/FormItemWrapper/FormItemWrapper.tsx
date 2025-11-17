import { SPACING } from '@/shared/config'
import { ReactNode } from 'react'
import { View } from 'react-native'

interface FormItemWrapperProps {
  children: ReactNode
}

export const FormItemWrapper = ({ children }: FormItemWrapperProps) => {
  return (
    <View style={{
      marginBottom: SPACING.md,
    }}>
      {children}
    </View>
  )
}
