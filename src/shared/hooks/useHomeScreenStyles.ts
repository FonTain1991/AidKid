import { StyleSheet } from 'react-native'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { useTheme } from '@/app/providers/theme'

export const useHomeScreenStyles = () => {
  const { colors } = useTheme()

  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 0,
      paddingBottom: 0
    },
    scrollView: {
      flex: 1,
    },
    scroll: {
      flex: 1,
      paddingTop: SPACING.md,
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
    alertsContainer: {
      paddingHorizontal: SPACING.lg,
      marginBottom: SPACING.sm,
    },
    alertItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.md,
      borderRadius: 12,
      marginBottom: SPACING.sm,
    },
    alertCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 2,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
    },
    alertIcon: {
      fontSize: FONT_SIZE.lg,
      marginRight: SPACING.sm,
    },
    alertContent: {
      flex: 1,
    },
    alertTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
      color: colors.white,
      marginBottom: SPACING.xs,
    },
    alertText: {
      fontSize: FONT_SIZE.sm,
      color: colors.white,
      opacity: 0.9,
    },
    alertArrow: {
      fontSize: FONT_SIZE.lg,
      color: colors.white,
      opacity: 0.8,
    },
    separatorContainer: {
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.md,
    },
    searchContainer: {
      paddingHorizontal: SPACING.lg,
      marginBottom: SPACING.lg,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
    },
    searchIcon: {
      fontSize: FONT_SIZE.lg,
      marginRight: SPACING.sm,
      color: colors.textSecondary,
    },
    searchInput: {
      flex: 1,
      fontSize: FONT_SIZE.md,
      padding: 0,
      color: colors.text,
    },
    clearIcon: {
      fontSize: FONT_SIZE.lg,
      color: colors.textSecondary,
      paddingLeft: SPACING.sm,
    },
    kitsContainer: {
      paddingHorizontal: SPACING.lg,
    },
    section: {
      marginBottom: SPACING.lg,
    },
    sectionTitle: {
      fontSize: FONT_SIZE.lg,
      fontWeight: '600',
      color: colors.text,
      marginBottom: SPACING.md,
    },
    kitsHeader: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    kitsTitle: {
      fontSize: FONT_SIZE.xl,
      fontWeight: 'bold',
      color: colors.text,
    },
    kitsCount: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
    },
    kitCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      marginBottom: SPACING.md,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
      overflow: 'hidden',
    },
    kitColorBar: {
      height: 6,
      width: '100%',
    },
    kitContent: {
      padding: SPACING.lg,
      alignItems: 'center',
    },
    kitHeader: {
      alignItems: 'center',
      flex: 1,
    },
    kitTitleContainer: {
      alignItems: 'center',
      flex: 1,
    },
    kitTitle: {
      fontSize: FONT_SIZE.xl,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: SPACING.xs,
      textAlign: 'center',
    },
    kitDescription: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      lineHeight: 18,
      textAlign: 'center',
    },
    kitMenuButton: {
      position: 'absolute',
      top: SPACING.sm,
      right: SPACING.sm,
      padding: SPACING.sm,
      borderRadius: 20,
      backgroundColor: colors.inputBackground,
      zIndex: 10,
    },
    kitMenuIcon: {
      fontSize: 20,
      color: colors.textSecondary,
    },
    kitIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.md,
    },
    kitStats: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: SPACING.md,
      paddingTop: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: SPACING.lg,
    },
    kitStat: {
      alignItems: 'center',
    },
    kitStatValue: {
      fontSize: FONT_SIZE.md,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: SPACING.xs,
    },
    kitStatLabel: {
      fontSize: FONT_SIZE.xs,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    searchResults: {
      paddingHorizontal: SPACING.lg,
    },
    searchResultItem: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchResultIcon: {
      fontSize: FONT_SIZE.lg,
      marginRight: SPACING.sm,
    },
    searchResultContent: {
      flex: 1,
    },
    searchResultTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
      color: colors.text,
    },
    searchResultSubtitle: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      marginTop: SPACING.xs,
    },
    medicinesList: {
      paddingHorizontal: SPACING.md,
      gap: SPACING.sm,
    },
    medicineCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      overflow: 'hidden',
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medicineColorBar: {
      height: 4,
    },
    medicineContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.md,
    },
    medicinePhoto: {
      width: 50,
      height: 50,
      borderRadius: 8,
      marginRight: SPACING.md,
      backgroundColor: colors.border,
    },
    medicinePhotoPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 8,
      marginRight: SPACING.md,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    medicinePhotoIcon: {
      fontSize: 28,
      color: colors.textSecondary,
    },
    medicineInfo: {
      flex: 1,
    },
    medicineName: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
      marginBottom: SPACING.xs,
      color: colors.text,
    },
    medicineForm: {
      fontSize: FONT_SIZE.sm,
      marginBottom: SPACING.xs,
      color: colors.textSecondary,
    },
    medicineKit: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
    },
    kitsList: {
      paddingHorizontal: SPACING.md,
      paddingBottom: SPACING.md,
      gap: SPACING.md,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xl,
    },
    loadingText: {
      fontSize: FONT_SIZE.md,
      color: colors.text,
    },
    emptyContainer: {
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
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xl,
    },
  })
}