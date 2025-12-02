import { Medicine } from '@/services/models'
import { useAppStore } from '@/store'
import { memo, useMemo } from 'react'
import { MedicineItemForQuickIntake } from './MedicineItemForQuickIntake'
import { Text } from '../Text'
import { PaddingHorizontal } from '../Layout'
import { useStyles } from './useStyles'

interface MedicineListForQuickIntakeProps {
  searchText?: string
}
export const MedicineListForQuickIntake = memo(({ searchText }: MedicineListForQuickIntakeProps) => {
  const styles = useStyles()

  const { medicines, quickIntakeMedicines } = useAppStore(state => state)

  const { medicinesFiltered, selectedMedications } = useMemo(() => {
    return medicines.reduce((prev, cur) => {
      if (quickIntakeMedicines.find(quickIntakeMedicine => quickIntakeMedicine.medicineId === cur.id)) {
        prev.selectedMedications.push(cur)
      } else {
        prev.medicinesFiltered.push(cur)
      }
      return prev
    }, { medicinesFiltered: [] as Medicine[], selectedMedications: [] as Medicine[] })
  }, [medicines, quickIntakeMedicines])

  const dataSource = useMemo(() => {
    if (searchText && searchText !== '') {
      return medicinesFiltered.filter(medicine => medicine.name.toLowerCase().includes(searchText.toLowerCase()))
    }

    return medicinesFiltered
  }, [medicinesFiltered, searchText])

  return (
    <>
      {!!selectedMedications?.length && (
        <>
          <PaddingHorizontal>
            <Text style={styles.title}>Выбранные лекарства</Text>
          </PaddingHorizontal>
          {selectedMedications?.map((medicine: Medicine) => (
            <MedicineItemForQuickIntake key={medicine.id} medicine={medicine} />
          ))}
          <PaddingHorizontal>
            <Text style={styles.title}>Доступные лекарства</Text>
          </PaddingHorizontal>
        </>
      )}
      {dataSource?.map((medicine: Medicine) => (
        <MedicineItemForQuickIntake key={medicine.id} medicine={medicine} />
      ))}
    </>
  )
})