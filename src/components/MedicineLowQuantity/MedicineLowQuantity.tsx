import { Pressable, View } from 'react-native'
import { Text } from '../Text'
import { useAppStore } from '@/store'
import { memo, useMemo } from 'react'
import { Medicine } from '@/services/models'
import { useMyNavigation } from '@/hooks'
import { useStyles } from './styles'

export const MedicineLowQuantity = memo(() => {
  const { medicines } = useAppStore(state => state)
  const styles = useStyles()
  const navigation = useMyNavigation()

  // Подсчет лекарств с низким запасом
  const lowStockCount = useMemo(() => {
    return medicines.filter((medicine: Medicine) => medicine?.quantity < 5).length
  }, [medicines])

  // Подсчет истекающих лекарств (в течение 30 дней)
  const expiringCount = useMemo(() => {
    const now = Date.now()
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000 // 30 дней в миллисекундах
    const thirtyDaysFromNow = now + thirtyDaysInMs

    return medicines.filter(({ expirationDate }: Medicine) => {
      if (!expirationDate) {
        return false
      }
      // Проверяем, что срок годности истекает в ближайшие 30 дней и еще не истек
      return expirationDate <= thirtyDaysFromNow && expirationDate > now
    }).length
  }, [medicines])

  return (
    <View style={(!!expiringCount || !!lowStockCount) ? styles.alertsContainer : undefined}>
      {expiringCount > 0 && (
        <Pressable
          style={[styles.alertCard, { backgroundColor: '#FFF3E0', borderColor: '#FF9800' }]}
          onPress={() => navigation.navigate('expiringMedicines' as never)}
        >
          <Text style={styles.alertIcon}>⏰</Text>
          <View style={styles.alertContent}>
            <Text style={[styles.alertTitle, { color: '#E65100' }]}>
              Истекает срок годности
            </Text>
            <Text style={[styles.alertText, { color: '#F57C00' }]}>
              {expiringCount} {expiringCount === 1 ? 'лекарство' : 'лекарств'} требует внимания
            </Text>
          </View>
          <Text style={[styles.alertArrow, { color: '#FF9800' }]}>›</Text>
        </Pressable>
      )}

      {lowStockCount > 0 && (
        <Pressable
          style={[styles.alertCard, { backgroundColor: '#FFEBEE', borderColor: '#F44336' }]}
          onPress={() => navigation.navigate('lowStockMedicines' as never)}
        >
          <Text style={styles.alertIcon}>📦</Text>
          <View style={styles.alertContent}>
            <Text style={[styles.alertTitle, { color: '#C62828' }]}>
              Заканчиваются
            </Text>
            <Text style={[styles.alertText, { color: '#E53935' }]}>
              {lowStockCount} {lowStockCount === 1 ? 'лекарство' : 'лекарств'} с низким запасом
            </Text>
          </View>
          <Text style={[styles.alertArrow, { color: '#F44336' }]}>›</Text>
        </Pressable>
      )}
    </View>
  )
})