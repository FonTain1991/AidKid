import { StyleSheet } from 'react-native'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { useTheme } from '@/app/providers/theme'

export const useAddReminderStyles = () => {
  const { colors } = useTheme()

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: SPACING.lg,
      paddingBottom: SPACING.sm,
      paddingHorizontal: SPACING.md,
    },
    headerTitle: {
      fontSize: FONT_SIZE.heading,
      fontWeight: 'bold',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: FONT_SIZE.md,
      color: colors.textSecondary,
      marginTop: SPACING.xs,
    },
    content: {
      padding: SPACING.lg,
    },
    section: {
      marginBottom: SPACING.xl,
      paddingHorizontal: SPACING.md,
    },
    sectionTitle: {
      fontSize: FONT_SIZE.lg,
      fontWeight: '600',
      color: colors.text,
      marginBottom: SPACING.md,
    },
    familyMemberCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: SPACING.md,
      marginRight: SPACING.sm,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      minWidth: 80,
    },
    familyMemberSelected: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    familyMemberHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    familyMemberAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: SPACING.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    familyMemberAvatarText: {
      color: colors.white,
      fontSize: FONT_SIZE.lg,
      fontWeight: 'bold',
    },
    familyMemberName: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    familyMemberCheck: {
      fontSize: FONT_SIZE.lg,
      color: colors.primary,
    },
    titleInput: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      color: colors.text,
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timeIcon: {
      fontSize: FONT_SIZE.lg,
      marginRight: SPACING.sm,
      color: colors.textSecondary,
    },
    timeText: {
      fontSize: FONT_SIZE.md,
      color: colors.text,
      flex: 1,
    },
    frequencyContainer: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    frequencyButton: {
      flex: 1,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    frequencyButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    frequencyButtonText: {
      fontSize: FONT_SIZE.sm,
      fontWeight: '600',
      color: colors.text,
    },
    frequencyButtonTextSelected: {
      color: colors.white,
    },
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quantityLabel: {
      fontSize: FONT_SIZE.md,
      color: colors.text,
      marginRight: SPACING.sm,
    },
    quantityInput: {
      flex: 1,
      fontSize: FONT_SIZE.md,
      color: colors.text,
      textAlign: 'center',
    },
    selectedMedicinesContainer: {
      marginTop: SPACING.md,
    },
    selectedMedicineCard: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: SPACING.sm,
      marginBottom: SPACING.sm,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectedMedicineName: {
      fontSize: FONT_SIZE.sm,
      color: colors.text,
      flex: 1,
    },
    removeMedicineButton: {
      padding: SPACING.xs,
    },
    removeMedicineText: {
      fontSize: FONT_SIZE.lg,
      color: colors.error,
    },
    selectMedicineButton: {
      backgroundColor: colors.primary,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: SPACING.sm,
    },
    selectMedicineButtonText: {
      color: colors.white,
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.xl,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: SPACING.xl,
      marginBottom: SPACING.lg,
    },
    saveButtonText: {
      color: colors.white,
      fontSize: FONT_SIZE.lg,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: FONT_SIZE.md,
      color: colors.text,
    },
    scroll: {
      flex: 1,
    },
    title: {
      fontSize: FONT_SIZE.heading,
      fontWeight: 'bold',
      color: colors.text,
    },
    subtitle: {
      fontSize: FONT_SIZE.md,
      color: colors.textSecondary,
    },
    emptyContainer: {
      padding: SPACING.lg,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: FONT_SIZE.md,
      color: colors.text,
    },
    inputContainer: {
      marginBottom: SPACING.lg,
    },
    inputLabel: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
      marginBottom: SPACING.sm,
      color: colors.text,
    },
    textInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: SPACING.md,
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      color: colors.text,
    },
    textInputText: {
      fontSize: FONT_SIZE.md,
      color: colors.text,
    },
    timePicker: {
      marginVertical: SPACING.sm,
    },
    frequencyOption: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 8,
      padding: SPACING.md,
      alignItems: 'center',
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    frequencyIcon: {
      fontSize: FONT_SIZE.xl,
      marginBottom: SPACING.xs,
      color: colors.textSecondary,
    },
    frequencyLabel: {
      fontSize: FONT_SIZE.sm,
      fontWeight: '600',
      color: colors.text,
    },
    quantityButton: {
      width: 40,
      height: 40,
      borderWidth: 1,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    quantityButtonText: {
      fontSize: FONT_SIZE.xl,
      fontWeight: 'bold',
      color: colors.text,
    },
    quantityDisplay: {
      width: 60,
      height: 40,
      borderWidth: 1,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
    },
    quantityText: {
      fontSize: FONT_SIZE.lg,
      fontWeight: '600',
      color: colors.text,
    },
    timePickerContainer: {
      marginBottom: SPACING.md,
      paddingLeft: SPACING.sm,
    },
    timePickerLabel: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
      marginBottom: SPACING.xs,
      color: colors.text,
    },
    buttonContainer: {
      paddingHorizontal: SPACING.md,
      marginTop: SPACING.lg,
    },
    createButton: {
      paddingVertical: SPACING.md,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: colors.primary,
    },
    createButtonText: {
      color: colors.white,
      fontSize: FONT_SIZE.lg,
      fontWeight: '600',
    },
    infoSection: {
      marginTop: SPACING.xl,
      paddingHorizontal: SPACING.md,
      paddingBottom: SPACING.md,
    },
    infoTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
      marginBottom: SPACING.sm,
      color: colors.text,
    },
    infoText: {
      fontSize: FONT_SIZE.sm,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    addFamilyButton: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
    },
    addFamilyButtonText: {
      fontSize: FONT_SIZE.sm,
      fontWeight: '600',
      color: colors.primary,
    },
    noFamilyContainer: {
      padding: SPACING.md,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
    },
    noFamilyText: {
      fontSize: FONT_SIZE.sm,
      textAlign: 'center',
      color: colors.textSecondary,
    },
    familyScroll: {
      flexDirection: 'row',
    },
    familyAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    familyAvatarText: {
      fontSize: 28,
      color: colors.white,
      fontWeight: 'bold',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xl,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: SPACING.lg,
    },
    emptyTitle: {
      fontSize: FONT_SIZE.lg,
      fontWeight: '600',
      marginBottom: SPACING.sm,
      textAlign: 'center',
      color: colors.text,
    },
    familyMemberHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    emptyDescription: {
      fontSize: FONT_SIZE.md,
      textAlign: 'center',
      color: colors.textSecondary,
    },
  })
}
