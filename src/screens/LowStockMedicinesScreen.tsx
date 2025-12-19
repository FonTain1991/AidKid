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

export function LowStockMedicinesScreen() {
  const { colors } = useTheme()
  const { medicines } = useAppStore(state => state)

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: 'Лекарства с низким запасом'
    }
  })

  useNavigationBarColor()

  // Фильтруем лекарства с низким запасом (quantity < 5)
  const lowStockMedicines = useMemo(() => {
    return medicines
      .filter((medicine: Medicine) => medicine.quantity && medicine.quantity < 5)
      .sort((a: Medicine, b: Medicine) => (a.quantity || 0) - (b.quantity || 0))
  }, [medicines])


  if (lowStockMedicines.length === 0) {
    return (
      <SafeAreaView edges={['bottom']}>
        <Background>
          <Empty
            icon='check-circle'
            title='Все хорошо!'
            description='Нет лекарств с низким запасом'
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
                  {lowStockMedicines.length} {lowStockMedicines.length === 1 ? 'лекарство' : 'лекарств'} с низким запасом
                </Text>
              </View>
            </PaddingHorizontal>

            <View style={styles.medicinesList}>
              {lowStockMedicines.map((medicine: Medicine) => (
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
  title: {
    fontSize: FONT_SIZE.heading,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
  },
  medicinesList: {
    gap: SPACING.md,
  },
})

