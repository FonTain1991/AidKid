import { StyleSheet } from 'react-native'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { useTheme } from '@/app/providers/theme'

export const useQuickIntakeStyles = () => {
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
    medicineCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      position: 'relative',
    },
    medicineHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    medicineImage: {
      width: 40,
      height: 40,
      borderRadius: 8,
      marginRight: SPACING.sm,
    },
    medicineImagePlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.sm,
    },
    medicineImagePlaceholderText: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
    },
    medicineInfo: {
      flex: 1,
    },
    medicineName: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
      color: colors.text,
    },
    medicineDetails: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      marginTop: SPACING.xs,
    },
    stockInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: SPACING.sm,
    },
    stockLabel: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      marginRight: SPACING.sm,
    },
    stockValue: {
      fontSize: FONT_SIZE.sm,
      fontWeight: '600',
    },
    intakeButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: SPACING.sm,
    },
    intakeButtonText: {
      color: colors.white,
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
    },
    intakeButtonDisabled: {
      backgroundColor: colors.muted,
    },
    intakeButtonTextDisabled: {
      color: colors.textSecondary,
    },
    checkmark: {
      position: 'absolute',
      top: SPACING.sm,
      right: SPACING.sm,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmarkText: {
      color: colors.white,
      fontSize: FONT_SIZE.sm,
      fontWeight: 'bold',
    },
    floatingButton: {
      position: 'absolute',
      bottom: SPACING.xl,
      left: SPACING.lg,
      right: SPACING.lg,
      borderRadius: 12,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    floatingButtonContent: {
      paddingVertical: SPACING.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    floatingButtonText: {
      color: colors.white,
      fontSize: FONT_SIZE.lg,
      fontWeight: '600',
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
    emptyText: {
      fontSize: FONT_SIZE.md,
      textAlign: 'center',
      lineHeight: 22,
      color: colors.textSecondary,
    },
    scroll: {
      flex: 1,
    },
    title: {
      fontSize: FONT_SIZE.heading,
      fontWeight: 'bold',
    },
    subtitle: {
      fontSize: FONT_SIZE.md,
      marginTop: SPACING.xs,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: FONT_SIZE.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xl,
    },
    emptyTitle: {
      fontSize: FONT_SIZE.xl,
      fontWeight: 'bold',
      marginBottom: SPACING.sm,
    },
    emptyDescription: {
      fontSize: FONT_SIZE.md,
      textAlign: 'center',
    },
    medicinesList: {
      paddingHorizontal: SPACING.md,
    },
    kitSection: {
      marginBottom: SPACING.lg,
    },
    kitTitle: {
      fontSize: FONT_SIZE.lg,
      fontWeight: '600',
      marginBottom: SPACING.md,
    },
    medicineContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    medicinePhoto: {
      width: 50,
      height: 50,
      borderRadius: 8,
      marginRight: SPACING.md,
    },
    medicinePhotoPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 8,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.md,
    },
    medicinePhotoIcon: {
      fontSize: 24,
    },
    medicineForm: {
      fontSize: FONT_SIZE.sm,
      marginTop: SPACING.xs,
    },
    medicineRight: {
      alignItems: 'flex-end',
    },
    stockBadge: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: 4,
      marginBottom: SPACING.xs,
    },
    stockText: {
      color: colors.white,
      fontSize: FONT_SIZE.sm,
      fontWeight: '600',
    },
    infoSection: {
      padding: SPACING.md,
      marginTop: SPACING.lg,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.xl,
    },
    infoTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
      marginBottom: SPACING.sm,
    },
    infoText: {
      fontSize: FONT_SIZE.sm,
      lineHeight: 20,
    },
  })
}
