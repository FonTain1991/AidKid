import { useState } from 'react'
import { CreateKitFormData, CreateKitFormErrors } from './types'
import { validateKitName, validateKitDescription } from '@/shared/lib/validation'
import { useKitStore } from '@/entities/kit/model/store'
import { KIT_COLORS, KIT_ICONS } from '@/shared/config/constants'

export const useCreateKitForm = () => {
  const { addKit, isLoading, kits, loadKits } = useKitStore()
  const [formData, setFormData] = useState<CreateKitFormData>({
    name: '',
    description: '',
    color: 'green',
    icon: 'home',
    selectedParentId: ''
  })
  const [errors, setErrors] = useState<CreateKitFormErrors>({})

  const handleInputChange = (field: keyof CreateKitFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Очищаем ошибку при изменении
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: CreateKitFormErrors = {}

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
      await addKit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: KIT_COLORS[formData.color as keyof typeof KIT_COLORS],
        icon: KIT_ICONS[formData.icon as keyof typeof KIT_ICONS],
        parentId: formData.selectedParentId && formData.selectedParentId !== '' ? formData.selectedParentId : undefined
      })
      return true
    } catch (error) {
      console.error('Ошибка при создании аптечки:', error)
      return false
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: 'green',
      icon: 'home',
      selectedParentId: ''
    })
    setErrors({})
  }

  return {
    formData,
    errors,
    isLoading,
    kits,
    loadKits,
    handleInputChange,
    handleSubmit,
    resetForm
  }
}
