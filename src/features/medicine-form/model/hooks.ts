import { useState, useEffect } from 'react'
import { medicineService } from '@/entities/medicine'
import { MedicineFormData, MedicineFormValidation, MedicineFormErrors } from './types'

export const useMedicineForm = (kitId?: string, initialData?: MedicineFormData) => {
  const [formData, setFormData] = useState<MedicineFormData>(initialData || {
    name: '',
    description: '',
    manufacturer: '',
    dosage: '',
    form: '',
    kitId: kitId || '',
    photoPath: undefined,
    barcode: undefined,
    quantity: 0,
    unit: '',
    expiryDate: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Обновляем форму при изменении initialData
  useEffect(() => {
    if (initialData) {
      console.log('Setting form data from initialData:', initialData)
      setFormData(initialData)
    }
  }, [initialData])

  const updateField = (field: keyof MedicineFormData, value: any) => {
    console.log('updateField:', field, value)
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = (): MedicineFormValidation => {
    const errors: MedicineFormErrors = {}

    if (!formData.name.trim()) {
      errors.name = 'Название лекарства обязательно'
    }

    if (!formData.form) {
      errors.form = 'Форма выпуска обязательна'
    }

    if (!formData.kitId) {
      errors.kitId = 'Аптечка обязательна'
    }

    if (formData.quantity <= 0) {
      errors.quantity = 'Количество должно быть больше 0'
    }

    if (!formData.unit) {
      errors.unit = 'Единица измерения обязательна'
    }

    if (formData.expiryDate) {
      const expiryDate = new Date(formData.expiryDate)
      const today = new Date()
      if (expiryDate <= today) {
        errors.expiryDate = 'Срок годности должен быть в будущем'
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      manufacturer: '',
      dosage: '',
      form: '',
      kitId: kitId || '',
      photoPath: undefined,
      barcode: undefined,
      quantity: 0,
      unit: '',
      expiryDate: ''
    })
    setError(null)
  }

  return {
    formData,
    loading,
    error,
    updateField,
    validateForm,
    resetForm,
    setLoading,
    setError
  }
}

export const useMedicineFormOptions = () => {
  const [formOptions, setFormOptions] = useState<{ label: string; value: string }[]>([])
  const [unitOptions, setUnitOptions] = useState<{ label: string; value: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true)
        const [forms, units] = await Promise.all([
          medicineService.getMedicineForms(),
          medicineService.getMeasurementUnits()
        ])

        setFormOptions(forms.map(form => ({
          label: `${form.icon || '💊'} ${form.name}`,
          value: form.name
        })))

        setUnitOptions(units.map(unit => ({
          label: `${unit.symbol} (${unit.name})`,
          value: unit.symbol
        })))
      } catch (error) {
        console.error('Error loading form options:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOptions()
  }, [])

  return {
    formOptions,
    unitOptions,
    loading
  }
}
