import { RADIUS, SPACING, UNITS } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useEvent, useMyNavigation, useRoute } from '@/hooks'
import { useMedicine } from '@/hooks/useMedicine'
import { cancelMedicineNotifications, scheduleMedicineExpiryNotifications } from '@/lib'
import { useTheme } from '@/providers/theme'
import { Medicine } from '@/services/models'
import { useAppStore } from '@/store'
import { memo, useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Button } from '../Button'
import { FormItemWrapper, List, Textarea, TextInput } from '../Form'
import { DatePicker } from '../Form/DatePicker'
import { Padding, Row } from '../Layout'
import { MedicinePhoto } from '../MedicinePhoto'
import { ParentMedicineKitList } from '../ParentMedicineKitList'
import { Text } from '../Text'
import { EmptyList } from '../EmptyList'

const INITIAL_MEDICINE: Medicine = {
  name: '',
  description: '',
  manufacturer: '',
  dosage: '',
  medicineKitId: null,
  photoPath: null,
  barcode: '',
  unit: '',
  quantity: 0,
  unitForQuantity: '',
  expirationDate: new Date().getTime()
}

export const MedicineForm = memo(() => {
  const { colors } = useTheme()
  const { params } = useRoute()
  const { goBack, navigate } = useMyNavigation()
  const { createMedicine, updateMedicine } = useMedicine()
  const { medicines, medicineKits } = useAppStore(state => state)

  const [medicine, setMedicine] = useState<Medicine>(INITIAL_MEDICINE)

  const [errors, setErrors] = useState<Record<string, string | null>>({})

  const onChangeName = useEvent((name: string) => {
    setErrors({ ...errors, name: null })
    setMedicine(prev => ({ ...prev, name }))
  })

  const onChangeDescription = useEvent((description: string) => {
    setMedicine(prev => ({ ...prev, description }))
  })

  const onChangeBarcode = useEvent((barcode: string) => {
    setMedicine(prev => ({ ...prev, barcode }))
  })

  const handleScanBarcode = () => {
    navigate('barcodeScanner')
  }

  const onChangePhoto = useEvent((photoPath: string | null) => {
    setMedicine(prev => ({ ...prev, photoPath }))
  })

  const onChangeMedicineKitId = useEvent((medicineKitId: number | null) => {
    setErrors({ ...errors, medicineKitId: null })
    setMedicine(prev => ({ ...prev, medicineKitId }))
  })

  const onChangeManufacturer = useEvent((manufacturer: string) => {
    setMedicine(prev => ({ ...prev, manufacturer }))
  })
  const onChangeDosage = useEvent((dosage: string) => {
    setMedicine(prev => ({ ...prev, dosage }))
  })
  const onChangeUnit = useEvent((unit: string) => {
    setMedicine(prev => ({ ...prev, unit }))
  })
  const onChangeUnitForQuantity = useEvent((unitForQuantity: string) => {
    setMedicine(prev => ({ ...prev, unitForQuantity }))
  })
  const onChangeQuantity = useEvent((quantity: string) => {
    setErrors({ ...errors, quantity: null })
    setMedicine(prev => ({ ...prev, quantity: Number(quantity) }))
  })

  const onChangeExpirationDate = useEvent((expirationDate: Date) => {
    setErrors({ ...errors, expirationDate: null })
    setMedicine(prev => ({ ...prev, expirationDate: new Date(expirationDate).getTime() }))
  })

  const onSubmit = useEvent(async () => {
    const errorsFields: Record<string, string> = {}
    if (!medicine.name) {
      errorsFields.name = 'Название обязательно для заполнения'
    }

    if (!medicine.quantity) {
      errorsFields.quantity = 'Количество обязательно для заполнения'
    }

    if (!medicine.medicineKitId) {
      errorsFields.medicineKitId = 'Аптечка обязательна для заполнения'
    }

    if (new Date(medicine.expirationDate).getTime() <= Date.now()) {
      errorsFields.expirationDate = 'Срок годности должен быть в будущем'
    }

    if (Object.keys(errorsFields).length) {
      setErrors(errorsFields)
      return
    }

    setErrors({})
    try {
      if (params?.medicineId) {
        await updateMedicine({
          id: params?.medicineId,
          ...medicine,
        })
        await cancelMedicineNotifications(params?.medicineId, Number(medicine.medicineKitId))
        await scheduleMedicineExpiryNotifications(medicine)
      } else {
        const newMedicine = await createMedicine(medicine)
        setMedicine(INITIAL_MEDICINE)
        if (newMedicine) {
          await scheduleMedicineExpiryNotifications(newMedicine)
        }
      }
      goBack()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Не удалось создать лекарство'
      // Проверяем, это ошибка лимита или другая ошибка
      if (errorMessage.includes('лимит') || errorMessage.includes('премиум')) {
        Alert.alert(
          'Лимит достигнут',
          errorMessage,
          [
            { text: 'Отмена', style: 'cancel' },
            {
              text: 'Оформить Premium',
              onPress: () => navigate('subscription'),
            },
          ]
        )
      } else {
        console.error(error)
      }
    }
  })

  useEffect(() => {
    if (params?.medicineId) {
      const medicineItem = medicines.find((item: Medicine) => item.id === params?.medicineId)
      if (medicineItem) {
        setMedicine(medicineItem)
      }
    }
  }, [params?.medicineId, medicines])

  useEffect(() => {
    if (params?.medicineName) {
      setMedicine(prev => ({ ...prev, name: params.medicineName }))
    }
  }, [params?.medicineName])

  // Обработка результата сканирования штрих-кода при возврате
  useEffect(() => {
    if (params?.scannedBarcode) {
      setMedicine(prev => ({ ...prev, barcode: params.scannedBarcode }))
    }
  }, [params])

  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps='handled'
      enableAutomaticScroll={true}
      enableOnAndroid={true}
      enableResetScrollToCoords={false}
      extraScrollHeight={SPACING.md * 2.5}
      extraHeight={SPACING.md * 2.5}
      showsVerticalScrollIndicator={true}
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: SPACING.xl }}
    >
      <Padding>
        <MedicinePhoto
          value={medicine?.photoPath}
          onChange={onChangePhoto}
        />
        <FormItemWrapper>
          <TextInput
            label='Название'
            onChangeText={onChangeName}
            value={medicine.name}
            error={errors?.name ?? undefined}
          />
        </FormItemWrapper>
        <FormItemWrapper>
          <TextInput
            label='Штрих-код'
            onChangeText={onChangeBarcode}
            value={medicine.barcode ?? ''}
          />
          <Pressable
            style={[styles.scanButton]}
            onPress={handleScanBarcode}
          >
            <Text style={[styles.scanButtonText, { color: colors.link }]}>📷 Сканировать штрих-код</Text>
          </Pressable>
        </FormItemWrapper>
        <FormItemWrapper>
          <EmptyList
            onPress={() => navigate('medicineKit')}
            title='Аптечки не найдены.'
            options={medicineKits}
            error={errors?.medicineKitId ?? undefined}
          >
            <ParentMedicineKitList
              fieldName='Аптечка'
              value={medicine.medicineKitId}
              onChange={onChangeMedicineKitId}
              error={errors?.medicineKitId ?? undefined}
              noParent
            />
          </EmptyList>
        </FormItemWrapper>
        <FormItemWrapper>
          <Textarea
            label='Описание'
            onChangeText={onChangeDescription}
            value={medicine.description}
          />
        </FormItemWrapper>
        <FormItemWrapper>
          <TextInput
            label='Производитель'
            onChangeText={onChangeManufacturer}
            value={medicine.manufacturer}
          />
        </FormItemWrapper>
        <FormItemWrapper>
          <Row style={{ gap: SPACING.md }}>
            <View style={{ flex: 1 }}>
              <TextInput
                label='Дозировка'
                style={{ flexGrow: 1, flexShrink: 0, flex: 1 }}
                onChangeText={onChangeDosage}
                value={medicine.dosage}
              />
            </View>
            <View style={{ flex: 0.5 }}>
              <List
                fieldName='Единица'
                options={UNITS}
                onChange={onChangeUnit}
                value={medicine.unit}
              />
            </View>
          </Row>
        </FormItemWrapper>
        <FormItemWrapper>
          <Row style={{ gap: SPACING.md }}>
            <View style={{ flex: 1 }}>
              <TextInput
                label='Количество'
                value={String(medicine.quantity)}
                onChangeText={onChangeQuantity}
                error={errors?.quantity ?? undefined}
              />
            </View>
            <View style={{ flex: 0.5 }}>
              <List
                fieldName='Единица'
                options={UNITS}
                onChange={onChangeUnitForQuantity}
                value={medicine.unitForQuantity}
              />
            </View>
          </Row>
        </FormItemWrapper>
        <FormItemWrapper>
          <DatePicker
            fieldName='Срок годности'
            value={new Date(+medicine.expirationDate)}
            onChange={onChangeExpirationDate}
            error={errors?.expirationDate}
          />
        </FormItemWrapper>
        <FormItemWrapper>
          <Button
            title={params?.medicineId ? 'Сохранить' : 'Добавить'}
            onPress={onSubmit}
          />
        </FormItemWrapper>
      </Padding>
    </KeyboardAwareScrollView>
  )
})


const styles = StyleSheet.create({
  scanButton: {
    marginTop: SPACING.xs,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  scanButtonText: {
    color: 'white',
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold
  },
})