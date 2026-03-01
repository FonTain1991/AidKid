import { AddShoppingListForm } from '@/components/AddShoppingListForm'
import { SafeAreaView } from '@/components/Layout'
import { SPACING } from '@/constants'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

export const AddShoppingItemScreen = memo(() => {
  const { t } = useTranslation()

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: t('screens.addShoppingItem')
    }
  })
  useNavigationBarColor()

  return (
    <SafeAreaView
      edges={['bottom']}
      style={styles.container}
    >
      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        <AddShoppingListForm />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.md
  }
})