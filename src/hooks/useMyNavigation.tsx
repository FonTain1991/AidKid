import { AppNavigationProp } from '@/navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'

export function useMyNavigation() {
  return useNavigation<AppNavigationProp>()
}