import { StyleSheet } from 'react-native'
import { SPACING } from '../config/constants/spacing'
import { ThemeColors } from '@/app/providers/theme/light/light'

export const successBottomSheetStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  icon: {
    fontSize: 40,
    color: colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.primary,
    borderColor: colors.border,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonActive: {
    backgroundColor: colors.primary,
    opacity: 0.8,
    borderRadius: 12,
    borderColor: colors.border,
  },
})
