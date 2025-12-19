import { SPACING } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { useMemo } from 'react'
import { StyleSheet } from 'react-native'

export const useStyles = () => {
  const { colors } = useTheme()
  return useMemo(() => {
    return StyleSheet.create({
      content: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md
      },
      disclaimer: {
        fontSize: FONT_SIZE.xs,
        color: colors.muted,
        marginTop: SPACING.lg,
        lineHeight: 18
      },
      header: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
      },
      premiumIcon: {
        fontSize: 64,
        marginBottom: SPACING.md,
      },
      title: {
        fontSize: FONT_SIZE.heading,
        fontFamily: 'Roboto-Bold',
        color: colors.text,
        marginBottom: SPACING.xs,
        textAlign: 'center',
      },
      subtitle: {
        fontSize: FONT_SIZE.md,
        color: colors.textSecondary,
        lineHeight: 24,
        textAlign: 'center',
        paddingHorizontal: SPACING.md,
      },
      premiumBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: SPACING.md,
      },
      premiumBadgeText: {
        color: colors.white,
        fontSize: FONT_SIZE.sm,
        fontFamily: 'Roboto-Medium',
      },
      featuresContainer: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
      },
      featuresTitle: {
        fontSize: FONT_SIZE.lg,
        fontFamily: 'Roboto-Bold',
        color: colors.text,
        marginBottom: SPACING.md,
      },
      featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: SPACING.sm,
      },
      featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '50%',
        marginBottom: SPACING.md,
      },
      featureIcon: {
        fontSize: 18,
        marginRight: SPACING.xs,
        color: colors.primary,
      },
      featureText: {
        fontSize: FONT_SIZE.sm,
        color: colors.text,
        flex: 1,
      },
      packagesContainer: {
        gap: SPACING.md,
        marginBottom: SPACING.lg,
      },
      packageCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: SPACING.lg,
        borderWidth: 2,
        borderColor: colors.border,
        position: 'relative',
        overflow: 'hidden',
      },
      packageCardRecommended: {
        borderColor: colors.primary,
        borderWidth: 3,
        backgroundColor: colors.primary + '08',
      },
      recommendedBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: colors.primary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderBottomLeftRadius: 12,
        zIndex: 1,
      },
      recommendedText: {
        color: colors.white,
        fontSize: FONT_SIZE.xs,
        fontFamily: 'Roboto-Bold',
      },
      packageContent: {
        marginTop: SPACING.xs,
      },
      packageTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.xs,
      },
      packageTitle: {
        fontSize: FONT_SIZE.lg,
        fontFamily: 'Roboto-Bold',
        color: colors.text,
        flex: 1,
        marginRight: SPACING.md,
      },
      packagePriceContainer: {
        alignItems: 'flex-end',
      },
      packagePrice: {
        fontSize: FONT_SIZE.xxl,
        fontFamily: 'Roboto-Bold',
        color: colors.primary,
        lineHeight: 32,
      },
      packagePricePeriod: {
        fontSize: FONT_SIZE.xs,
        color: colors.textSecondary,
        fontFamily: 'Roboto-Regular',
      },
      packageDescription: {
        fontSize: FONT_SIZE.sm,
        color: colors.textSecondary,
        marginBottom: SPACING.md,
        lineHeight: 20,
      },
      packageButton: {
        marginTop: SPACING.xs,
      },
      restoreButton: {
        marginTop: SPACING.md,
      },
      errorContainer: {
        backgroundColor: colors.error + '20',
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.md,
      },
      errorText: {
        color: colors.error,
        fontSize: FONT_SIZE.sm,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      emptyState: {
        alignItems: 'center',
        padding: SPACING.xl,
      },
      emptyStateText: {
        fontSize: FONT_SIZE.md,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.md,
      },
      manageSection: {
        marginTop: SPACING.md,
        paddingHorizontal: SPACING.md,
        alignItems: 'center',
      },
      manageButton: {
        marginBottom: SPACING.sm,
        width: '100%',
      },
      manageHint: {
        fontSize: FONT_SIZE.sm,
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: SPACING.md,
      },
      refundInfoSection: {
        marginTop: SPACING.xl,
        paddingVertical: SPACING.md,
        backgroundColor: colors.card,
        borderRadius: 12
      },
      refundTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        marginBottom: SPACING.sm,
      },
      refundText: {
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
      },
      canceledWarning: {
        marginTop: SPACING.md,
        padding: SPACING.md,
        backgroundColor: colors.error + '15',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.error + '40',
      },
      canceledTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        marginBottom: SPACING.sm,
      },
      canceledText: {
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
      },
    })
  }, [colors])
}