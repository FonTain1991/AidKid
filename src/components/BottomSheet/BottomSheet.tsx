import { RADIUS, SPACING } from '@/constants'
import { useNavigationBarColor, useRoute } from '@/hooks'
import { RouteParamsProvider } from '@/providers/RouteParams'
import { useTheme } from '@/providers/theme'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetModalProps } from '@gorhom/bottom-sheet'
import { forwardRef, memo, ReactNode, useImperativeHandle, useRef } from 'react'
import { Keyboard } from 'react-native'

interface BottomSheetProps extends Omit<BottomSheetModalProps, 'children' | 'ref'> {
  children: ReactNode
  snapPoints?: (string | number)[]
  index?: number
  onDismiss?: () => void
  enableDynamicSizing?: boolean
}

export interface BottomSheetRef {
  present: () => void
  dismiss: () => void
}

export const BottomSheet = memo(forwardRef<BottomSheetRef, BottomSheetProps>(({
  children,
  snapPoints = ['50%', '90%'],
  index = 0,
  onDismiss,
  enableDynamicSizing = false,
  backdropComponent,
  animationConfigs,
  handleIndicatorStyle,
  handleStyle,
  ...restProps
}, ref) => {
  const route = useRoute()
  const { colors } = useTheme()
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)

  useNavigationBarColor({ color: colors.background })

  useImperativeHandle(ref, () => ({
    present: () => {
      Keyboard.dismiss() // Скрываем клавиатуру при открытии
      bottomSheetModalRef.current?.present()
    },
    dismiss: () => bottomSheetModalRef.current?.dismiss()
  }))

  const handleDismiss = () => {
    onDismiss?.()
  }

  return (
    <BottomSheetModal
      snapPoints={snapPoints}
      index={index}
      backdropComponent={backdropComponent || (props => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.5}
        />
      ))}
      animationConfigs={animationConfigs || {
        duration: 300,
      }}
      ref={bottomSheetModalRef}
      enableDynamicSizing={enableDynamicSizing}
      keyboardBehavior='interactive'
      keyboardBlurBehavior='restore'
      handleIndicatorStyle={handleIndicatorStyle || {
        width: 55,
        height: 5,
        marginBottom: SPACING.sm,
        borderRadius: 8,
        backgroundColor: colors.text
      }}
      handleStyle={handleStyle || {
        padding: 0,
        paddingTop: 8,
        backgroundColor: colors.background,
        borderTopLeftRadius: RADIUS.lg,
        borderTopRightRadius: RADIUS.lg
      }}
      containerStyle={{
        borderTopLeftRadius: RADIUS.lg,
        borderTopRightRadius: RADIUS.lg
      }}
      onDismiss={handleDismiss}
      {...restProps}
    >
      <RouteParamsProvider route={route}>
        {children}
      </RouteParamsProvider>
    </BottomSheetModal>
  )
}))

