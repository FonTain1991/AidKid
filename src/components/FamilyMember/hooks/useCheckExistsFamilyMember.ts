import { useMyNavigation } from '@/hooks'
import { useAppStore } from '@/store'
import { useEffect } from 'react'
import { Alert } from 'react-native'
import { useTranslation } from 'react-i18next'

export const useCheckExistsFamilyMember = () => {
  const { t } = useTranslation()
  const { familyMembers } = useAppStore(state => state)
  const { navigate, replace } = useMyNavigation()

  useEffect(() => {
    if (familyMembers.length) {
      return
    }
    Alert.alert(
      t('familyMember.attention'),
      t('familyMember.addRequired'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => replace('bottomNavigation', {
            screen: 'medicineKit'
          })
        },
        {
          text: t('medicine.add'),
          onPress: () => {
            navigate('familyMember', {
              referer: 'takingMedications'
            })
          }
        }
      ]
    )
  }, [familyMembers, navigate, replace])
}