import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppNavigation } from './navigation'
import { ThemeProvider } from './providers/theme'
import { useAppInit } from './hooks'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'

export default function App() {
  useAppInit()
  return (
    <GestureHandlerRootView>
      <ThemeProvider>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <NavigationContainer>
              <AppNavigation />
            </NavigationContainer>
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
