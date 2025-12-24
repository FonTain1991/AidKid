import { Empty } from '@/components/Empty'
import { FloatingButton } from '@/components/FloatingButton'
import { Background, Flex, PaddingHorizontal, SafeAreaView } from '@/components/Layout'
import { LimitIndicator } from '@/components/LimitIndicator'
import { MedicineKitList } from '@/components/MedicineKitList'
import { MedicineList } from '@/components/MedicineList'
import { MedicineLowQuantity } from '@/components/MedicineLowQuantity'
import { SPACING } from '@/constants'
import { useEvent, useNavigationBarColor, useScreenProperties } from '@/hooks'
import { getLimitsInfo } from '@/lib'
import { useTheme } from '@/providers/theme'
import { useAppStore } from '@/store'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

export function MedicineKitListScreen() {
  const { colors } = useTheme()
  const [searchText, setSearchText] = useState('')
  const [limitsInfo, setLimitsInfo] = useState<any>(null)
  const { medicineKits } = useAppStore(state => state)

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: 'Аптечки',
      headerSearchBarOptions: {
        placeholder: 'Поиск лекарства',
        onChangeText: event => {
          setSearchText(event.nativeEvent.text)
        },
        onCancelButtonPress: () => {
          setSearchText('')
        },
        headerIconColor: colors.text,
        shouldShowHintSearchIcon: false,
        autoFocus: true
      }
    },
  })

  useNavigationBarColor()

  const loadLimitsInfo = useEvent(async () => {
    try {
      const info = await getLimitsInfo()
      setLimitsInfo(info)
    } catch (error) {
      console.error('Failed to load limits info:', error)
    }
  })

  useEffect(() => {
    loadLimitsInfo()
  }, [loadLimitsInfo])

  if (!medicineKits.length) {
    return (
      <SafeAreaView edges={['bottom']}>
        <Background>
          <Empty
            icon='box'
            title='Аптечки'
            description='Здесь будут отображаться ваши аптечки'
          />
        </Background>
        <FloatingButton />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={[]}>
      <Background>
        <Flex>
          <ScrollView
            keyboardShouldPersistTaps='handled'
            nestedScrollEnabled
            contentContainerStyle={styles.contentContainer}
          >
            {limitsInfo && !limitsInfo.isPremium && (
              <View style={{
                gap: 16, paddingHorizontal: SPACING.lg,
                marginBottom: SPACING.sm,
              }}>
                <LimitIndicator
                  limitCheck={limitsInfo.kits}
                  label='Аптечки'
                  showPremiumButton={!limitsInfo.kits.allowed}
                  compact={false}
                />
                <LimitIndicator
                  limitCheck={limitsInfo.medicines}
                  label='Лекарства'
                  showPremiumButton={!limitsInfo.medicines.allowed}
                  compact={false}
                />
              </View>
            )}
            {!searchText && (
              <>
                <PaddingHorizontal>
                  <MedicineLowQuantity />
                </PaddingHorizontal>
                <MedicineKitList />
              </>
            )}
            {!!searchText && <MedicineList searchText={searchText} showKit />}
          </ScrollView>
          <FloatingButton />
        </Flex>
      </Background>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  }
})