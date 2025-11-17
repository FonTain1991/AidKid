import React from 'react'
import { Text, View } from 'react-native'
import { useTheme } from '@/app/providers/theme'

export const EmptyState: React.FC = () => {
  const { colors } = useTheme()

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingTop: 100
    }}>
      <Text style={{
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 16
      }}>
        🏥
      </Text>
      <Text style={{
        fontSize: 18,
        fontFamily: 'Inter-Medium',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 8
      }}>
        Добро пожаловать в AidKit!
      </Text>
      <Text style={{
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        color: colors.muted,
        textAlign: 'center',
        lineHeight: 20
      }}>
        Создайте свою первую аптечку, нажав на кнопку +
      </Text>
    </View>
  )
}
