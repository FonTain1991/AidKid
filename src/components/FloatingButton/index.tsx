import { useEvent, useMyNavigation } from '@/hooks'
import { useAppStore } from '@/store'
import React, { useMemo } from 'react'
import { FloatingActionButton } from '../FloatingActionButton'

export function FloatingButton() {
  const { navigate } = useMyNavigation()
  const { medicineKits } = useAppStore(state => state)

  const handleAddMedicineKit = useEvent(() => navigate('medicineKit'))
  const handleAddMedicine = useEvent(() => navigate('medicine'))
  const handleScanBarcode = useEvent(() => navigate('barcodeScanner'))

  const items = useMemo(() => {
    const values = [
      { letter: 'Аптечка', onPress: handleAddMedicineKit },
    ]

    if (medicineKits.length) {
      values.push({ letter: 'Лекарство', onPress: handleAddMedicine })
    }

    if (medicineKits.length) {
      values.push({ letter: 'Штрих-код', onPress: handleScanBarcode })
    }

    return values
  }, [medicineKits, handleAddMedicine, handleAddMedicineKit, handleScanBarcode])

  return (
    <FloatingActionButton items={items} />
  )
}
