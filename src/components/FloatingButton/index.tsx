import { useEvent, useMyNavigation } from '@/hooks'
import { useAppStore } from '@/store'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FloatingActionButton } from '../FloatingActionButton'

export function FloatingButton({ parentId }: { parentId?: number }) {
  const { t } = useTranslation()
  const { navigate } = useMyNavigation()
  const { medicineKits } = useAppStore(state => state)

  const handleAddMedicineKit = useEvent(() => navigate('medicineKit', { parentId }))
  const handleAddMedicine = useEvent(() => navigate('medicine', { parentId }))
  const handleScanBarcode = useEvent(() => navigate('barcodeScanner'))

  const items = useMemo(() => {
    const values = [
      { letter: t('floatingButton.medicineKit'), onPress: handleAddMedicineKit },
    ]

    if (medicineKits.length) {
      values.push({ letter: t('floatingButton.medicine'), onPress: handleAddMedicine })
    }

    if (medicineKits.length) {
      values.push({ letter: t('floatingButton.barcode'), onPress: handleScanBarcode })
    }

    return values
  }, [medicineKits, handleAddMedicine, handleAddMedicineKit, handleScanBarcode, t])

  return (
    <FloatingActionButton items={items} />
  )
}
