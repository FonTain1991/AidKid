import { QuickCreateSheet } from '@/features/quick-create'
import { useNavigationBarColor, useScreenProperties } from '@/shared/hooks'
import { FAB } from '@/shared/ui/FAB'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { useTheme } from '@/app/providers/theme'
import { useHomeScreen, KitList, ErrorState } from '@/features/home'

export function HomeScreen() {
  const { colors } = useTheme()
  const {
    kits,
    loading,
    error,
    refreshKits,
    quickCreateSheetRef,
    quickCreateOptions,
    handleKitPress,
    handleKitEdit,
    handleKitDelete,
    handleAddMedicineToKit,
    handleOptionPress,
  } = useHomeScreen()

  useScreenProperties({
    navigationOptions: {
      title: 'Аптечки'
    }
  })
  useNavigationBarColor()

  if (error) {
    return (
      <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
        <ErrorState error={error} onRetry={refreshKits} />
        <FAB onPress={() => quickCreateSheetRef.current?.present()} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
      <KitList
        kits={kits}
        loading={loading}
        onRefresh={refreshKits}
        onKitPress={handleKitPress}
        onKitEdit={handleKitEdit}
        onKitDelete={handleKitDelete}
        onAddMedicine={handleAddMedicineToKit}
      />

      <FAB onPress={() => quickCreateSheetRef.current?.present()} />

      <QuickCreateSheet
        ref={quickCreateSheetRef}
        options={quickCreateOptions}
        onOptionPress={handleOptionPress}
      />
    </SafeAreaView>
  )
}