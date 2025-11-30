import { useMyNavigation } from '@/hooks'
import React from 'react'
import { FloatingActionButton } from '../FloatingActionButton'

export function FloatingButton() {
  const { navigate } = useMyNavigation()

  const handleAddMedicineKit = () => {
    navigate('medicineKit')
  }

  const handleAddMedicine = () => {
    navigate('medicine')
  }

  const handleScanBarcode = () => {
    navigate('barcodeScanner')
  }

  return (
    <FloatingActionButton items={[
      { letter: 'Аптечка', onPress: handleAddMedicineKit },
      { letter: 'Лекарство', onPress: handleAddMedicine },
      { letter: 'Штрих-код', onPress: handleScanBarcode }
    ]} />
  )
}
