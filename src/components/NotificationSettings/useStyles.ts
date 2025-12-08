import { RADIUS, SPACING } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { useMemo } from 'react'
import { StyleSheet } from 'react-native'

export const useStyles = () => {
  const { colors } = useTheme()
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
      },
      scroll: {
        flex: 1,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      loadingText: {
        fontSize: FONT_SIZE.lg,
      },
      header: {
        padding: SPACING.md,
        paddingBottom: SPACING.sm,
      },
      title: {
        fontSize: FONT_SIZE.md * 2,
        fontWeight: FONT_WEIGHT.bold,
        marginBottom: SPACING.sm,
      },
      subtitle: {
        fontSize: FONT_SIZE.lg
      },
      section: {
        marginTop: SPACING.md
      },
      sectionTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.bold,
        marginBottom: SPACING.md,
        paddingHorizontal: SPACING.md,
        color: colors.text,
      },
      statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      statusContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
      },
      statusIcon: {
        fontSize: FONT_SIZE.xl,
        marginRight: SPACING.sm,
      },
      statusText: {
        flex: 1,
      },
      statusTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        marginBottom: 2,
        color: colors.text,
      },
      statusDescription: {
        fontSize: FONT_SIZE.md,
        color: colors.muted,
      },
      actionButton: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.md,
        backgroundColor: colors.primary,
      },
      actionButtonText: {
        color: 'white',
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
      },
      menuItem: {
        borderBottomWidth: 1,
        paddingHorizontal: SPACING.md,
        borderBottomColor: colors.border,
      },
      menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
      },
      menuIcon: {
        fontSize: FONT_SIZE.lg,
        marginRight: SPACING.sm,
        width: 24,
        textAlign: 'center',
      },
      menuText: {
        flex: 1,
      },
      menuTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        marginBottom: 2,
        color: colors.text,
      },
      menuDescription: {
        marginRight: SPACING.sm,
        fontSize: FONT_SIZE.md,
        color: colors.muted,
      },
      menuArrow: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.bold,
        color: colors.muted,
      },
      testButton: {
        marginHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        alignItems: 'center',
      },
      testButtonText: {
        color: 'white',
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
      },
      infoSection: {
        marginTop: SPACING.md,
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
      },
      infoTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        marginBottom: SPACING.sm,
        color: colors.text,
      },
      infoText: {
        fontSize: FONT_SIZE.md,
        lineHeight: 20,
        color: colors.muted,
      },
      infoCard: {
        marginHorizontal: SPACING.md,
        marginTop: SPACING.sm,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
      },
      dangerButton: {
        marginHorizontal: SPACING.md,
        marginTop: SPACING.sm,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        alignItems: 'center',
      },
      dangerButtonText: {
        color: 'white',
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold
      },
      checkAllButton: {
        marginHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        alignItems: 'center',
      },
      checkAllButtonText: {
        color: 'white',
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
      },
    })
  }, [colors])
}