import { RADIUS, SPACING, WIDTH } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { useMemo } from 'react'
import { StyleSheet } from 'react-native'

export const useStyles = () => {
  const { colors } = useTheme()

  return useMemo(() => {
    return StyleSheet.create({
      photoContainer: {
        alignItems: 'center',
        marginBottom: SPACING.md
      },
      photoPreview: {
        paddingTop: SPACING.sm,
        width: '100%',
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        backgroundColor: colors.border,
      },
      photoImage: {
        height: 200,
        resizeMode: 'cover',
      },
      photoActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        padding: SPACING.sm,
      },
      photoButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
      },
      photoButtonText: {
        color: 'white',
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.medium,
      },
      buttonIcon: {
        marginRight: 0,
      },
      addPhotoButton: {
        width: WIDTH - (SPACING.md * 2),
        borderColor: colors.border,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: RADIUS.md,
        padding: SPACING.xl,
        alignItems: 'center',
        backgroundColor: colors.inputBackground,
      },
      addPhotoIcon: {
        fontSize: FONT_SIZE.xl * 2,
        marginBottom: SPACING.sm,
      },
      addPhotoText: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.medium,
        color: colors.text,
      },
      addPhotoHint: {
        fontSize: FONT_SIZE.sm,
        textAlign: 'center',
        marginTop: SPACING.xs,
        color: colors.muted
      },
    })
  }, [colors])
}