import { useState } from 'react'
import { EditKitFormData, EditKitFormErrors } from './types'
import { validateKitName, validateKitDescription } from '@/shared/lib/validation'
import { useKitStore } from '@/entities/kit/model/store'
import { KIT_COLORS, KIT_ICONS } from '@/shared/config/constants'
import { MedicineKit } from '@/entities/kit/model/types'

export const useEditKitForm = (initialKit: MedicineKit) => {
  const { updateKit, isLoading } = useKitStore()

  const [formData, setFormData] = useState<EditKitFormData>({
    name: initialKit.name,
    description: initialKit.description || '',
    color: Object.keys(KIT_COLORS).find(key => KIT_COLORS[key as keyof typeof KIT_COLORS] === initialKit.color) || 'green',
    icon: Object.keys(KIT_ICONS).find(key => KIT_ICONS[key as keyof typeof KIT_ICONS] === initialKit.icon) || 'home'
  })

  const [errors, setErrors] = useState<EditKitFormErrors>({})

  const handleInputChange = (field: keyof EditKitFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Очищаем ошибку при изменении
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: EditKitFormErrors = {}

    const nameError = validateKitName(formData.name)
    if (nameError) newErrors.name = nameError.message

    const descriptionError = validateKitDescription(formData.description)
    if (descriptionError) newErrors.description = descriptionError.message

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (): Promise<boolean> => {
    if (!validateForm()) {
      return false
    }

    try {
      await updateKit(initialKit.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: KIT_COLORS[formData.color as keyof typeof KIT_COLORS],
        icon: KIT_ICONS[formData.icon as keyof typeof KIT_ICONS]
      })
      return true
    } catch (error) {
      console.error('Ошибка при обновлении аптечки:', error)
      return false
    }
  }

  return {
    formData,
    errors,
    isLoading,
    handleInputChange,
    handleSubmit
  }
}
