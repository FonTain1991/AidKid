import { memo, useRef, useState, useEffect } from 'react'
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { BottomSheet, BottomSheetRef } from '../BottomSheet'
import { ListButton } from '../ListButton'
import { ModalSafeAreaView } from '../ModalSafeAreaView'
import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { useEvent } from '@/shared/hooks'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { Medicine, MedicineStock } from '@/entities/medicine/model/types'
import { getMedicinePhotoUri } from '@/shared/lib'
import { databaseService } from '@/shared/lib/database'
import { MedicineKit } from '@/entities/kit/model/types'

interface MedicinePickerProps {
  value?: Medicine[]
  onChange?: (medicines: Medicine[]) => void
  fieldName?: string
  multiple?: boolean
}

export const MedicinePicker = memo(({ value = [], onChange, fieldName = 'Лекарства', multiple = true }: MedicinePickerProps) => {
  const { colors } = useTheme()
  const bottomSheetRef = useRef<BottomSheetRef>(null)
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [stocks, setStocks] = useState<Map<string, MedicineStock>>(new Map())
  const [kits, setKits] = useState<Map<string, MedicineKit>>(new Map())
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadMedicines()
  }, [])

  const loadMedicines = async () => {
    try {
      setIsLoading(true)
      await databaseService.init()

      const allKits = await databaseService.getKits()
      const kitsMap = new Map(allKits.map(kit => [kit.id, kit]))
      setKits(kitsMap)

      const allMedicines = await databaseService.getMedicines()
      setMedicines(allMedicines)

      const stocksMap = new Map<string, MedicineStock>()
      for (const medicine of allMedicines) {
        try {
          const stock = await databaseService.getMedicineStock(medicine.id)
          if (stock) {
            stocksMap.set(medicine.id, stock)
          }
        } catch (error) {
          console.warn(`Failed to load stock for ${medicine.id}`)
        }
      }
      setStocks(stocksMap)
    } catch (error) {
      console.error('Failed to load medicines:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onOpen = useEvent(() => {
    bottomSheetRef.current?.present()
  })

  const toggleMedicine = useEvent((medicine: Medicine) => {
    if (multiple) {
      const isSelected = value.some(m => m.id === medicine.id)
      if (isSelected) {
        onChange?.(value.filter(m => m.id !== medicine.id))
      } else {
        onChange?.([...value, medicine])
      }
    } else {
      onChange?.([medicine])
      bottomSheetRef.current?.dismiss()
    }
  })

  const filteredMedicines = medicines.filter(medicine => {
    if (!searchQuery) {
      return true
    }
    const query = searchQuery.toLowerCase()
    const kitName = kits.get(medicine.kitId)?.name?.toLowerCase() || ''
    return (
      medicine.name.toLowerCase().includes(query) ||
      medicine.form.toLowerCase().includes(query) ||
      medicine.manufacturer?.toLowerCase().includes(query) ||
      kitName.includes(query)
    )
  })

  const displayValue = value.length === 0
    ? undefined
    : value.length === 1
      ? value[0].name
      : `${value.length} лекарств выбрано`

  const getStockInfo = (medicine: Medicine) => {
    const stock = stocks.get(medicine.id)
    if (!stock) {
      return { text: 'Нет в наличии', color: colors.muted }
    }
    if (stock.quantity === 0) {
      return { text: 'Закончилось', color: colors.error }
    }
    if (stock.quantity <= 5) {
      return { text: `${stock.quantity} ${stock.unit}`, color: colors.warning }
    }
    return { text: `${stock.quantity} ${stock.unit}`, color: colors.success }
  }

  return (
    <View>
      <ListButton
        fieldName={fieldName}
        value={displayValue}
        onPress={onOpen}
      />
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={['90%']}
      >
        <ModalSafeAreaView edges={['bottom']} style={{ backgroundColor: colors.bottomBarBackground, flex: 1 }}>
          {/* Заголовок с кнопкой закрытия */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Выбор лекарств</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => bottomSheetRef.current?.dismiss()}
            >
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Поиск */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder='Поиск лекарств...'
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Выбранные лекарства */}
          {value.length > 0 && (
            <View style={[styles.selectedContainer, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.selectedText, { color: colors.primary }]}>
                Выбрано: {value.length} {value.length === 1 ? 'лекарство' : 'лекарств'}
              </Text>
            </View>
          )}

          {/* Список лекарств */}
          <BottomSheetFlatList
            data={filteredMedicines}
            keyExtractor={(item: Medicine) => item.id}
            renderItem={({ item }: { item: Medicine }) => {
              const medicine = item
              const isSelected = value.some(m => m.id === medicine.id)
              const stockInfo = getStockInfo(medicine)
              const kitName = kits.get(medicine.kitId)?.name || ''

              return (
                <TouchableOpacity
                  style={[
                    styles.medicineCard,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                      backgroundColor: isSelected ? colors.primary + '10' : colors.card
                    }
                  ]}
                  onPress={() => toggleMedicine(medicine)}
                >
                  {/* Фото лекарства */}
                  {medicine.photoPath ? (
                    <Image
                      source={{ uri: getMedicinePhotoUri(medicine.photoPath) || undefined }}
                      style={styles.medicinePhoto}
                    />
                  ) : (
                    <View style={[styles.medicinePhotoPlaceholder, { backgroundColor: colors.border }]}>
                      <Text style={styles.medicinePhotoIcon}>💊</Text>
                    </View>
                  )}

                  {/* Информация */}
                  <View style={styles.medicineInfo}>
                    <Text style={[styles.medicineName, { color: colors.text }]}>
                      {medicine.name}
                    </Text>
                    <Text style={[styles.medicineForm, { color: colors.textSecondary }]}>
                      {medicine.form}
                    </Text>
                    <Text style={[styles.medicineKit, { color: colors.textSecondary }]}>
                      📦 {kitName}
                    </Text>
                  </View>

                  {/* Статус и чекбокс */}
                  <View style={styles.medicineRight}>
                    <View style={[styles.stockBadge, { backgroundColor: stockInfo.color }]}>
                      <Text style={styles.stockText}>{stockInfo.text}</Text>
                    </View>
                    {isSelected && (
                      <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )
            }}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {isLoading ? 'Загрузка...' : searchQuery ? 'Ничего не найдено' : 'Нет лекарств'}
                </Text>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />

          {/* Кнопка "Готово" */}
          {value.length > 0 && (
            <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.bottomBarBackground }]}>
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: colors.primary }]}
                onPress={() => bottomSheetRef.current?.dismiss()}
              >
                <Text style={styles.doneButtonText}>
                  Готово ({value.length})
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ModalSafeAreaView>
      </BottomSheet>
    </View>
  )
})

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  closeButton: {
    padding: SPACING.sm,
  },
  closeButtonText: {
    fontSize: 24,
    lineHeight: 24,
  },
  searchContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
  },
  clearIcon: {
    fontSize: 20,
    padding: SPACING.xs,
  },
  selectedContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.md,
    paddingTop: 0,
  },
  medicineCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  medicinePhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: SPACING.md,
  },
  medicinePhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicinePhotoIcon: {
    fontSize: 32,
  },
  medicineInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  medicineName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
  },
  medicineForm: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs / 2,
  },
  medicineKit: {
    fontSize: FONT_SIZE.sm,
  },
  medicineRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  stockBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    marginBottom: SPACING.xs,
  },
  stockText: {
    color: 'white',
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
  },
  footer: {
    borderTopWidth: 1,
    padding: SPACING.md,
  },
  doneButton: {
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
})

