import { Empty } from '@/components/Empty'
import { Background, Flex, PaddingHorizontal, SafeAreaView } from '@/components/Layout'
import { MedicineItem } from '@/components/MedicineList/MedicineItem'
import { Text } from '@/components/Text'
import { SPACING } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { Medicine } from '@/services/models'
import { useAppStore } from '@/store'
import { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useTheme } from '@/providers/theme'

export function ExpiringMedicinesScreen() {
  const { colors } = useTheme()
  const { medicines } = useAppStore(state => state)

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: 'Истекает срок годности'
    }
  })

  useNavigationBarColor()

  // Фильтруем лекарства с истекающим сроком годности (в течение 30 дней)
  const expiringMedicines = useMemo(() => {
    const now = Date.now()
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000 // 30 дней в миллисекундах
    const thirtyDaysFromNow = now + thirtyDaysInMs

    return medicines
      .filter((medicine: Medicine) => {
        if (!medicine.expirationDate) {
          return false
        }
        // Проверяем, что срок годности истекает в ближайшие 30 дней и еще не истек
        return medicine.expirationDate <= thirtyDaysFromNow && medicine.expirationDate > now
      })
      .sort((a: Medicine, b: Medicine) => (a.expirationDate || 0) - (b.expirationDate || 0))
  }, [medicines])

  if (!expiringMedicines.length) {
    return (
      <SafeAreaView edges={['bottom']}>
        <Background>
          <Empty
            icon='check-circle'
            title='Все хорошо!'
            description='Нет лекарств с истекающим сроком годности'
          />
        </Background>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['bottom']}>
      <Background>
        <Flex>
          <ScrollView
            keyboardShouldPersistTaps='handled'
            contentContainerStyle={styles.contentContainer}
          >
            <PaddingHorizontal>
              <View style={styles.header}>
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                  {expiringMedicines.length} {expiringMedicines.length === 1 ? 'лекарство' : 'лекарств'} требует внимания
                </Text>
              </View>
            </PaddingHorizontal>

            <View style={styles.medicinesList}>
              {expiringMedicines.map((medicine: Medicine) => (
                <MedicineItem key={medicine.id} medicine={medicine} showKit={true} />
              ))}
            </View>
          </ScrollView>
        </Flex>
      </Background>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingVertical: SPACING.md,
  },
  header: {
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
  },
  medicinesList: {
    gap: SPACING.md,
  },
})

