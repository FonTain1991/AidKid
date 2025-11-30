import { SPACING, UNITS } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { getMedicinePhotoUri } from '@/helpers'
import { useEvent } from '@/hooks'
import { useTheme } from '@/providers/theme'
import { Medicine, MedicineKit } from '@/services/models'
import { useAppStore } from '@/store'
import { memo, useMemo, useRef } from 'react'
import { Image, Pressable, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { Dosage } from '../Dosage'
import { Row } from '../Layout'
import { Text } from '../Text'
import { useStyles } from './useStyles'
import { Checkbox } from '../Form'
import { DosageRef } from '../Dosage/Dosage'

export const MedicineItemForQuickIntake = memo(({ medicine }: { medicine: Medicine }) => {
  const { colors } = useTheme()
  const { medicineKits, quickIntakeMedicines, setQuickIntakeMedicines } = useAppStore(state => state)
  const dosageRef = useRef<DosageRef>(null)
  const styles = useStyles()

  const medicineKit = useMemo(() => {
    return medicineKits.find((kit: MedicineKit) => kit.id === medicine.medicineKitId)
  }, [medicineKits, medicine.medicineKitId])

  const quickIntakeMedicine = useMemo(() => {
    return quickIntakeMedicines.find((item: { medicineId: number }) => item.medicineId === medicine.id)
  }, [quickIntakeMedicines, medicine.id])

  const handleChange = useEvent((dosage: string) => {
    if (dosage === '') {
      setQuickIntakeMedicines(quickIntakeMedicines.filter((item: { medicineId: number }) => item.medicineId !== medicine.id))
      return
    }
    setQuickIntakeMedicines([...quickIntakeMedicines, {
      medicineId: Number(medicine.id),
      dosage
    }])
  })

  const unit = useMemo(() => {
    return UNITS.find((item: any) => item.value === medicine.unitForQuantity)
  }, [medicine.unitForQuantity])

  const clearDosage = useEvent(() => {
    dosageRef.current?.clearDosage()
  })

  const isChecked = !!quickIntakeMedicine
  return (
    <View style={isChecked && styles.checkedContainer}>
      <View style={styles.container} >
        <View style={[styles.medicineKitTag, {
          backgroundColor: medicineKit?.color
        }]}>
          <Text style={styles.medicineKitTagName}>{medicineKit?.name}</Text>
        </View>
        <Row between itemsCenter>
          <Row style={{ gap: SPACING.md }}>
            <View style={styles.icon} >
              {medicine.photoPath && (
                <Image
                  source={{ uri: String(getMedicinePhotoUri(String(medicine.photoPath))) }}
                  style={styles.icon}
                  resizeMode='cover'
                />
              )}
              {!medicine.photoPath && (
                <View style={styles.emptyIcon} >
                  <Icon name='image' size={FONT_SIZE.heading} color={colors.primary} />
                </View>
              )}
            </View>
            <View>
              <Text style={styles.name}>{medicine.name}</Text>
              <Row itemsCenter>
                <Text style={styles.quantity}>Всего: </Text>
                <View style={styles.quantityContainer}>
                  <Text style={styles.quantity}>{medicine.quantity} {unit?.shortLabel ?? ''}</Text>
                </View>
              </Row>
            </View>
          </Row>
          <View>
            <Dosage unit={unit?.value ?? ''} onChange={handleChange} ref={dosageRef} />
          </View>
        </Row>
      </View>
      {isChecked && (
        <View style={{ flex: 0 }}>
          <Checkbox value={isChecked} onChange={clearDosage} />
        </View>
      )}
    </View>
  )
})