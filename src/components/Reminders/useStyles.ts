import { RADIUS, SPACING } from '@/constants'
import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { StyleSheet } from 'react-native'

export const useStyles = () => {
  const { colors } = useTheme()
  return StyleSheet.create({
    reminderCard: {
      borderRadius: RADIUS.md,
      borderWidth: 1,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.20,
      shadowRadius: 1.41,
      elevation: 2,
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    reminderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: SPACING.md,
    },
    reminderTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    reminderIcon: {
      fontSize: FONT_SIZE.xl,
      marginRight: SPACING.sm,
    },
    reminderTitleText: {
      flex: 1,
    },
    reminderMedicine: {
      color: colors.text,
      fontSize: FONT_SIZE.lg,
      fontWeight: FONT_WEIGHT.bold,
      marginBottom: SPACING.xs,
    },
    reminderFrequencyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    frequencyIcon: {
      fontSize: FONT_SIZE.md,
      marginRight: SPACING.xs,
    },
    reminderFrequency: {
      fontSize: FONT_SIZE.sm,
    },
    deleteButton: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.lg,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.error,
    },
    deleteButtonText: {
      color: colors.headerColor,
      fontSize: FONT_SIZE.xl,
      fontWeight: FONT_WEIGHT.bold,
    },
    reminderDetails: {
      gap: SPACING.md,
    },
    reminderTimesContainer: {
      gap: SPACING.sm,
    },
    reminderTimesLabel: {
      color: colors.text,
      fontSize: FONT_SIZE.sm,
      fontWeight: FONT_WEIGHT.bold,
    },
    timesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
    },
    timeChip: {
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primary + '15',
    },
    timeChipText: {
      color: colors.primary,
      fontSize: FONT_SIZE.sm,
      fontWeight: FONT_WEIGHT.bold
    },
    reminderCount: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.italic,
      color: colors.muted,
    },
    nextNotificationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    nextNotificationLabel: {
      fontSize: FONT_SIZE.sm,
      color: colors.text,
    },
    nextNotificationTime: {
      fontSize: FONT_SIZE.md,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: SPACING.xxl,
      paddingHorizontal: SPACING.lg,
    },
    emptyIcon: {
      fontSize: FONT_SIZE.heading * 3,
      marginBottom: SPACING.md,
    },
    emptyTitle: {
      fontSize: FONT_SIZE.xl,
      fontWeight: '600',
      marginBottom: SPACING.sm,
    },
    emptyText: {
      fontSize: FONT_SIZE.md,
      textAlign: 'center',
      marginBottom: SPACING.xl,
    },
    reminderDescription: {
      fontSize: FONT_SIZE.sm,
      color: colors.muted
    },
  })
}