import { SPACING } from '@/constants'
import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { StyleSheet } from 'react-native'

const HEIGHT_ITEM = 48
export const useListStyles = () => {
  const styles = StyleSheet.create({
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      minHeight: HEIGHT_ITEM
    },
    itemContent: {
      flex: 1,
      marginRight: SPACING.sm,
    },
    itemText: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.medium,
      marginBottom: SPACING.xs,
    },
    itemSubtitle: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.regular,
    },
    fieldName: {
      marginBottom: SPACING.md,
    },
    fieldNameText: {
      fontSize: FONT_SIZE.xl,
      fontFamily: FONT_FAMILY.bold,
      fontWeight: FONT_WEIGHT.bold,
      lineHeight: FONT_SIZE.xl * 1.5,
    },
    noItemsText: {
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.regular,
      textAlign: 'center',
      marginVertical: SPACING.md,
    }

  })

  return {
    styles,
  }
}
