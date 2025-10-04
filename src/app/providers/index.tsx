import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { ComponentType } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider } from './theme'
import { KitListStateProvider } from '@/features/kit-list'

export function withProviders<T extends object>(Component: ComponentType<T>) {
  return function WithProviders(props: T) {
    return (
      <GestureHandlerRootView>
        <ThemeProvider>
          <SafeAreaProvider>
            <BottomSheetModalProvider>
              <KitListStateProvider>
                <Component {...props} />
              </KitListStateProvider>
            </BottomSheetModalProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    )
  }
} 