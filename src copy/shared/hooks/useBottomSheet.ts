import { useCallback, useRef } from 'react'
import { BottomSheetRef } from '../ui'

export const useBottomSheet = () => {
  const bottomSheetRef = useRef<BottomSheetRef>(null)

  const open = useCallback(() => {
    bottomSheetRef.current?.present()
  }, [])

  const close = useCallback(() => {
    bottomSheetRef.current?.dismiss()
  }, [])

  return {
    ref: bottomSheetRef,
    open,
    close
  }
}
