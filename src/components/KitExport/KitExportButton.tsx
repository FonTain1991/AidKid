import { BottomSheet, BottomSheetRef } from '@/components/BottomSheet'
import { ModalSafeAreaView } from '@/components/ModalSafeAreaView'
import { Text } from '@/components/Text'
import { SPACING } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useEvent } from '@/hooks'
import { buildKitHtmlReport, buildKitShareReport, buildKitTrees, countKitTreeMedicines } from '@/lib/kitExport'
import { useTheme } from '@/providers/theme'
import { useAppStore } from '@/store'
import { BottomSheetView } from '@gorhom/bottom-sheet'
import dayjs from 'dayjs'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native'
import RNFS from 'react-native-fs'
import { generatePDF } from 'react-native-html-to-pdf'
import Share from 'react-native-share'
import Icon from 'react-native-vector-icons/Feather'

interface KitExportButtonProps {
  rootKitId: number | null
  title?: string
}

export const KitExportButton = memo(({ rootKitId, title }: KitExportButtonProps) => {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { medicineKits, medicines } = useAppStore(state => state)
  const bottomSheetRef = useRef<BottomSheetRef>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [isSharingPdf, setIsSharingPdf] = useState(false)

  const reportTitle = title ?? t('screens.medicineKits')

  const exportParams = useMemo(() => {
    const getUnitLabel = (unitValue: string) => t(`units.${unitValue}Short`)
    const formatExpirationDate = (expirationDate: number) => dayjs(+expirationDate).format('DD.MM.YYYY')
    const trees = buildKitTrees(rootKitId, medicineKits, medicines, getUnitLabel, formatExpirationDate)

    return {
      appName: t('app.name'),
      title: reportTitle,
      generatedAtLabel: t('medicineKit.generatedAt'),
      generatedAt: dayjs().format('DD.MM.YYYY HH:mm'),
      labels: {
        medicines: t('nav.medicines'),
        quantity: t('medicineKit.quantityColumn'),
        expirationDate: t('medicine.expirationDate'),
        noMedicines: t('medicineKit.noMedicinesInKit'),
        totalMedicines: t('medicineKit.totalMedicines'),
      },
      trees,
    }
  }, [medicineKits, medicines, reportTitle, rootKitId, t])

  const hasExportData = exportParams.trees.length > 0 && countKitTreeMedicines(exportParams.trees) > 0

  const handleOpen = useEvent(() => {
    bottomSheetRef.current?.present()
  })

  const handleDismiss = useEvent(() => {
    bottomSheetRef.current?.dismiss()
  })

  const handleShare = useCallback(async () => {
    if (isSharing || !hasExportData) {
      return
    }

    try {
      setIsSharing(true)
      bottomSheetRef.current?.dismiss()

      await Share.open({
        title: t('medicineKit.shareReportTitle'),
        message: buildKitShareReport(exportParams),
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'User did not share') {
        return
      }

      console.error('Failed to share kit report:', error)
      Alert.alert(t('common.error'), t('medicineKit.shareFailed'))
    } finally {
      setIsSharing(false)
    }
  }, [exportParams, hasExportData, isSharing, t])

  const handleSharePdf = useCallback(async () => {
    if (isSharingPdf || !hasExportData) {
      return
    }

    try {
      setIsSharingPdf(true)
      bottomSheetRef.current?.dismiss()

      const timestamp = dayjs().format('YYYYMMDD_HHmmss')
      const fileName = `aidkit_kit_${timestamp}`
      const html = buildKitHtmlReport(exportParams)
      const pdf = await generatePDF({
        html,
        fileName,
      })
      const pdfPath = pdf.filePath?.replace(/^file:\/\//, '')

      if (!pdfPath) {
        throw new Error('PDF file path is empty')
      }

      const pdfExists = await RNFS.exists(pdfPath)
      if (!pdfExists) {
        throw new Error(`PDF file does not exist: ${pdfPath}`)
      }

      await Share.open({
        title: t('statistics.exportPdf'),
        url: `file://${pdfPath}`,
        type: 'application/pdf',
        filename: `${fileName}.pdf`,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'User did not share') {
        return
      }

      console.error('Failed to share kit PDF:', error)
      Alert.alert(t('common.error'), t('medicineKit.shareFailed'))
    } finally {
      setIsSharingPdf(false)
    }
  }, [exportParams, hasExportData, isSharingPdf, t])

  if (!hasExportData) {
    return null
  }

  const isBusy = isSharing || isSharingPdf

  return (
    <>
      <Pressable
        onPress={handleOpen}
        disabled={isBusy}
        style={({ pressed }) => [styles.iconButton, { opacity: pressed || isBusy ? 0.7 : 1 }]}
        hitSlop={8}
      >
        {isBusy ? (
          <ActivityIndicator size='small' color={colors.text} />
        ) : (
          <Icon name='share-2' size={22} color={colors.text} />
        )}
      </Pressable>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={[]}
        enableDynamicSizing
        onDismiss={handleDismiss}
      >
        <BottomSheetView>
          <ModalSafeAreaView edges={['bottom']}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                {t('medicineKit.exportKit')}
              </Text>
            </View>
            <Pressable
              onPress={handleShare}
              disabled={isSharing}
              style={({ pressed }) => [styles.sheetItem, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.sheetItemText, { color: colors.text }]}>
                {t('common.share')}
              </Text>
              {isSharing && <ActivityIndicator size='small' color={colors.primary} />}
            </Pressable>
            <Pressable
              onPress={handleSharePdf}
              disabled={isSharingPdf}
              style={({ pressed }) => [styles.sheetItem, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.sheetItemText, { color: colors.text }]}>
                {t('statistics.exportPdf')}
              </Text>
              {isSharingPdf && <ActivityIndicator size='small' color={colors.primary} />}
            </Pressable>
          </ModalSafeAreaView>
        </BottomSheetView>
      </BottomSheet>
    </>
  )
})

const styles = StyleSheet.create({
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetHeader: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  sheetTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  sheetItemText: {
    fontSize: FONT_SIZE.md,
  },
})
