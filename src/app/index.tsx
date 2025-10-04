import { AppNavigator } from '@/app/navigation'
import { useNavigationBarColor } from '@/shared/hooks'
import { NavigationContainer } from '@react-navigation/native'
import { withProviders } from './providers/index'

export default withProviders(() => {
  useNavigationBarColor()

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  )
})