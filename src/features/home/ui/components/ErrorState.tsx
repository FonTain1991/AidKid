import React from 'react'
import { Text, View } from 'react-native'
import { useTheme } from '@/app/providers/theme'

interface ErrorStateProps {
  error: string
  onRetry: () => void
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  const { colors } = useTheme()

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32
    }}>
      <Text style={{
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        color: colors.error,
        textAlign: 'center',
        marginBottom: 16
      }}>
        {error}
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontFamily: 'Inter-Regular',
          color: colors.primary,
          textAlign: 'center'
        }}
        onPress={onRetry}
      >
        Попробовать снова
      </Text>
    </View>
  )
}
