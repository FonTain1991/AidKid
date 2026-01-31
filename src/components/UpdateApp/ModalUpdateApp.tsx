import { useTheme } from '@/providers/theme'
import { BottomSheetView } from '@gorhom/bottom-sheet'
import { useEffect, useRef } from 'react'
import VersionCheck from 'react-native-version-check'
import { BottomSheet, BottomSheetRef } from '../BottomSheet'
import { ModalSafeAreaView } from '../ModalSafeAreaView'
import { UpdateApp } from './UpdateApp'

export function ModalUpdateApp() {
  const { colors } = useTheme()
  const bottomSheetRef = useRef<BottomSheetRef>(null)

  useEffect(() => {
    VersionCheck.needUpdate()
      .then((res: any) => {
        if (res?.isNeeded) {
          bottomSheetRef.current?.present()
        }
      }).catch()
  }, [])

  return (
    <BottomSheet
      ref={bottomSheetRef}
      enableDynamicSizing
      snapPoints={[]}
    >
      <BottomSheetView>
        <ModalSafeAreaView edges={['bottom']} style={{ backgroundColor: colors.background }}>

          <UpdateApp onHide={() => bottomSheetRef.current?.dismiss()} />
        </ModalSafeAreaView>
      </BottomSheetView>

    </BottomSheet>
  )
}