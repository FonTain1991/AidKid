import { AppNavigator } from '@/app/navigation'
import { useNavigationBarColor } from '@/shared/hooks'
import { NavigationContainer } from '@react-navigation/native'
import { withProviders } from './providers/index'
import { NotificationProvider } from './providers/NotificationProvider'

export default withProviders(() => {
  useNavigationBarColor()

  return (
    <NavigationContainer>
      <NotificationProvider>
        <AppNavigator />
      </NotificationProvider>
    </NavigationContainer>
  )
})