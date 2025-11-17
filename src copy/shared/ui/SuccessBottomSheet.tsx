import { useTheme } from '@/app/providers/theme'
import { BottomSheetView } from '@gorhom/bottom-sheet'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Text, View } from 'react-native'
import { successBottomSheetStyles } from '../styles'
import { BottomSheet, BottomSheetRef } from './BottomSheet'
import { ModalSafeAreaView } from './ModalSafeAreaView'

interface SuccessBottomSheetProps {
  title?: string
  message?: string
  buttonText?: string
  onClose?: () => void
}

export interface SuccessBottomSheetRef {
  present: () => void
  dismiss: () => void
}

export const SuccessBottomSheet = forwardRef<SuccessBottomSheetRef, SuccessBottomSheetProps>(({
  title = 'Успешно!',
  message = 'Лот был успешно создан',
  buttonText = 'Понятно',
  onClose
}, ref) => {
  const { colors } = useTheme()
  const bottomSheetRef = useRef<BottomSheetRef>(null)
  const styles = successBottomSheetStyles(colors)

  useImperativeHandle(ref, () => ({
    present: () => bottomSheetRef.current?.present(),
    dismiss: () => bottomSheetRef.current?.dismiss()
  }))

  const handleClose = () => {
    bottomSheetRef.current?.dismiss()
    onClose?.()
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={[]}
      enableDynamicSizing
      onDismiss={onClose}
    >
      <BottomSheetView>
        <ModalSafeAreaView>
          <View style={styles.container}>
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>✓</Text>
              </View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              <Button
                activeStyle={styles.buttonActive}
                type='primary'
                style={styles.button}
                onPress={handleClose}
              >
                {buttonText}
              </Button>
            </View>
          </View>
        </ModalSafeAreaView>
      </BottomSheetView>
    </BottomSheet>
  )
})
