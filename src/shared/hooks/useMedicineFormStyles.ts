import { StyleSheet } from 'react-native'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { useTheme } from '@/app/providers/theme'

export const useMedicineFormStyles = () => {
  const { colors } = useTheme()

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    rowContainer: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    dosageContainer: {
      flex: 1,
    },
    unitContainer: {
      flex: 1,
    },
    dosageInput: {
      flex: 1,
    },
    photoContainer: {
      alignItems: 'center',
      marginVertical: SPACING.sm,
    },
    photoPreview: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    photoImage: {
      width: '100%',
      height: 200,
      backgroundColor: colors.border,
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
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.xs,
    },
    photoButtonText: {
      color: 'white',
      fontSize: FONT_SIZE.sm,
      fontWeight: '600',
    },
    buttonIcon: {
      marginRight: 0,
    },
    addPhotoButton: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: SPACING.xl,
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
    },
    addPhotoIcon: {
      fontSize: 48,
      marginBottom: SPACING.sm,
    },
    addPhotoText: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
    },
    addPhotoHint: {
      fontSize: FONT_SIZE.sm,
      textAlign: 'center',
    },
    scanButton: {
      marginTop: SPACING.sm,
      paddingVertical: SPACING.md,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.xs,
    },
    scanButtonText: {
      color: 'white',
      fontSize: FONT_SIZE.sm,
      fontWeight: '600',
    },
  })
}
