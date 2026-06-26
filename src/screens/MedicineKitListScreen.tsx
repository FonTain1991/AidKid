import { Empty } from '@/components/Empty'
import { FloatingButton } from '@/components/FloatingButton'
import { Background, Flex, PaddingHorizontal, SafeAreaView } from '@/components/Layout'
import { LimitIndicator } from '@/components/LimitIndicator'
import { KitExportButton } from '@/components/KitExport'
import { MedicineKitList } from '@/components/MedicineKitList'
import { MedicineList } from '@/components/MedicineList'
import { MedicineLowQuantity } from '@/components/MedicineLowQuantity'
import { ModalUpdateApp } from '@/components/UpdateApp'
import { SPACING } from '@/constants'
import { useEvent, useNavigationBarColor, useScreenProperties, type UseScreenPropertiesOptions } from '@/hooks'
import { useTranslation } from 'react-i18next'
import { getLimitsInfo } from '@/lib'
import { useTheme } from '@/providers/theme'
import { useAppStore } from '@/store'
import { useFocusEffect } from '@react-navigation/native'
import { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

export function MedicineKitListScreen() {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const [searchText, setSearchText] = useState('')
  const [limitsInfo, setLimitsInfo] = useState<any>(null)
  const { medicineKits, medicines } = useAppStore(state => state)

  const navigationOptions = useMemo<UseScreenPropertiesOptions>(
    () => ({
      navigationOptions: {
        headerShown: true,
        title: t('screens.medicineKits'),
        headerSearchBarOptions: {
          placeholder: t('medicine.searchPlaceholder'),
          onChangeText: event => {
            setSearchText(event.nativeEvent.text)
          },
          onCancelButtonPress: () => {
            setSearchText('')
          },
          headerIconColor: colors.text,
          shouldShowHintSearchIcon: false,
        },
        headerRight: () => <KitExportButton rootKitId={null} />,
      },
    }),
    [colors.text, t]
  )

  useScreenProperties(navigationOptions)
  useNavigationBarColor()

  const loadLimitsInfo = useEvent(async () => {
    try {
      const info = await getLimitsInfo()
      setLimitsInfo(info)
    } catch (error) {
      console.error('Failed to load limits info:', error)
    }
  })

  useFocusEffect(useEvent(() => {
    loadLimitsInfo()
  }))

  useEffect(() => {
    loadLimitsInfo()
  }, [loadLimitsInfo, medicineKits.length, medicines.length])

  if (!medicineKits.length) {
    return (
      <SafeAreaView edges={['bottom']}>
        <Background>
          <Empty
            icon='box'
            title={t('empty.noKitsTitle')}
            description={t('empty.noKitsDesc')}
          />
        </Background>
        <FloatingButton />
        <ModalUpdateApp />
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
                  label={t('nav.medicineKits')}
                  showPremiumButton={!limitsInfo.kits.allowed}
                  compact={false}
                />
                <LimitIndicator
                  limitCheck={limitsInfo.medicines}
                  label={t('nav.medicines')}
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
      <ModalUpdateApp />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
})
