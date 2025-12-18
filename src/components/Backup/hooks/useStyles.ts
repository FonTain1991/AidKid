import { SPACING } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { useMemo } from 'react'
import { StyleSheet } from 'react-native'

export const useStyles = () => {
  const { colors } = useTheme()

  return useMemo(() => StyleSheet.create({
    section: {
      marginBottom: SPACING.xl,
    },
    sectionTitle: {
      fontSize: FONT_SIZE.xl,
      fontWeight: FONT_WEIGHT.bold,
      marginBottom: SPACING.md,
    },
    subsectionTitle: {
      fontSize: FONT_SIZE.lg,
      fontWeight: FONT_WEIGHT.medium,
      marginBottom: SPACING.sm,
      marginTop: SPACING.md,
      color: colors.text,
    },
    primaryButton: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: colors.primary,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: FONT_SIZE.lg,
      fontWeight: FONT_WEIGHT.medium,
    },
    backupItem: {
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
    },
    backupInfo: {
      marginBottom: SPACING.sm,
    },
    backupName: {
      fontSize: FONT_SIZE.md,
      fontWeight: FONT_WEIGHT.bold,
      marginBottom: SPACING.xs,
    },
    backupDate: {
      fontSize: FONT_SIZE.sm,
      marginBottom: SPACING.xs,
    },
    backupSize: {
      fontSize: FONT_SIZE.sm,
    },
    backupActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
    },
    actionButton: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: 8,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center'
    },
    actionButtonText: {
      fontSize: FONT_SIZE.sm,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.headerColor
    },
    googleButton: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: 12,
      alignItems: 'center',
    },
    googleButtonText: {
      color: colors.headerColor,
      fontSize: FONT_SIZE.lg,
      fontWeight: FONT_WEIGHT.medium,
    },
    offlineWarning: {
      padding: SPACING.sm,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: SPACING.sm,
    },
    offlineText: {
      fontSize: FONT_SIZE.sm,
      fontWeight: '500',
      textAlign: 'center',
    },
    googleInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: SPACING.md,
      borderRadius: 12,
      marginBottom: SPACING.md,
    },
    googleEmail: {
      fontSize: FONT_SIZE.md,
      fontWeight: FONT_WEIGHT.medium,
    },
    googleSignOut: {
      fontSize: FONT_SIZE.sm,
      fontWeight: FONT_WEIGHT.medium,
    },
    driveBackups: {
      marginTop: SPACING.md,
    },
  }), [colors])
}