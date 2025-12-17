import { SPACING } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useMyNavigation } from '@/hooks'
import { FamilyMember } from '@/services/models'
import { useAppStore } from '@/store'
import { FlatList, Pressable, View } from 'react-native'
import { PaddingHorizontal, Row } from '../Layout'
import { Text } from '../Text'
import { useTheme } from '@/providers/theme'

const Item = ({ item }: { item: FamilyMember }) => {
  const { navigate } = useMyNavigation()

  const handlePress = () => {
    navigate('familyMember', { familyMemberId: item.id })
  }
  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
      <PaddingHorizontal>
        <Row itemsCenter>
          <View style={{
            width: 50,
            height: 50,
            backgroundColor: item.color,
            borderRadius: 40,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{
              fontSize: FONT_SIZE.heading
            }}>{item.avatar}</Text>
          </View>
          <Text style={{
            fontSize: FONT_SIZE.xl,
            fontWeight: FONT_WEIGHT.medium,
            lineHeight: FONT_SIZE.md,
            marginLeft: SPACING.md
          }}>{item.name}</Text>
        </Row>
      </PaddingHorizontal>
    </Pressable>
  )
}

export function FamilyMembers() {
  const { familyMembers } = useAppStore(state => state)
  const { colors } = useTheme()

  if (familyMembers.length === 0) {
    return <Text>No family members found</Text>
  }

  return (
    <FlatList
      data={familyMembers}
      renderItem={({ item }) => <Item item={item} />}
      contentContainerStyle={{ paddingVertical: SPACING.md, flex: 1 }}
      ItemSeparatorComponent={() => (
        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            margin: SPACING.md,
          }}
        />
      )}

    />
  )
}