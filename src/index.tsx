import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppNavigation } from './navigation'
import { ThemeProvider } from './providers/theme'
import { useAppInit, useNotificationNavigation } from './hooks'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { useRef } from 'react'
import type { MainList } from './navigation/AppNavigation'
import { StatusBar } from 'react-native'

export default function App() {
  useAppInit()
  const navigationRef = useRef<NavigationContainerRef<MainList>>(null)

  useNotificationNavigation(navigationRef)

  return (
    <GestureHandlerRootView>
      <StatusBar barStyle='dark-content' backgroundColor='#FFFFFF' />
      <ThemeProvider>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <NavigationContainer
              ref={navigationRef}
            >
              <AppNavigation />
            </NavigationContainer>
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
