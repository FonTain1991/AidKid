import { SPACING, WIDTH } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useEvent } from '@/hooks'
import { FamilyMember } from '@/services/models'
import { useAppStore } from '@/store'
import { useFocusEffect } from '@react-navigation/native'
import { useMemo, useRef } from 'react'
import { Animated, NativeScrollEvent, NativeSyntheticEvent, Pressable, View } from 'react-native'
import { Text } from '../Text'

type SpacerItem = {
  key: string
  spacer: true
}

type CarouselItem = FamilyMember | SpacerItem

const isSpacerItem = (item: CarouselItem): item is SpacerItem => {
  return 'spacer' in item
}

const itemSize = WIDTH / 3
const spacerItemSize = (WIDTH - itemSize) / 2

let lastCarouselOffset = 0

const Item = ({ item, index, scrollX }: { item: CarouselItem, index: number, scrollX: any }) => {
  const inputRange = [
    (index - 2) * itemSize,
    (index - 1) * itemSize,
    index * itemSize,
  ]

  const translateY = scrollX.interpolate({
    inputRange,
    outputRange: [0, 50, 0]
  })

  if (isSpacerItem(item)) {
    return <View style={{ width: spacerItemSize, height: 1 }} />
  }

  return (
    <View style={{ width: itemSize }}>
      <Animated.View style={[{
        width: itemSize,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ translateY }],
      }]}>
        <View style={{
          width: 80,
          height: 80,
          backgroundColor: item.color,
          borderRadius: 40,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: FONT_SIZE.lg * 2
          }}>{item.avatar}</Text>
        </View>
        <Text style={{
          fontSize: FONT_SIZE.md,
          fontWeight: FONT_WEIGHT.medium,
          lineHeight: FONT_SIZE.md,
          marginTop: SPACING.xs
        }}>{item.name}</Text>
      </Animated.View>
    </View>
  )
}

export function FamilyMemberCarousel() {
  const { familyMembers } = useAppStore(state => state)
  const listRef = useRef<Animated.FlatList<CarouselItem> | null>(null)
  const scrollX = useRef(new Animated.Value(lastCarouselOffset)).current

  const handleFocus = useEvent(() => {
    requestAnimationFrame(() => {
      const offset = lastCarouselOffset
      scrollX.setValue(offset)
      listRef.current?.scrollToOffset({ offset, animated: false })
    })
  })

  useFocusEffect(handleFocus)

  const data: CarouselItem[] = useMemo(() => {
    return [
      { key: 'left-spacer', spacer: true },
      ...familyMembers,
      { key: 'right-spacer', spacer: true },
    ]
  }, [familyMembers])

  const handleMomentumEnd = useEvent((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    lastCarouselOffset = event.nativeEvent.contentOffset.x
  })

  if (familyMembers.length === 0) {
    return <Text>No family members found</Text>
  }

  return (
    <Animated.FlatList
      ref={listRef}
      data={data}
      renderItem={({ item, index }) => (
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, }]}
          onPress={() => {
            listRef.current?.scrollToOffset({ offset: (index - 1) * itemSize, animated: true })
          }}
        >
          <Item item={item} index={index} scrollX={scrollX} />
        </Pressable>
      )}
      style={{
        flexGrow: 0,
        height: 154 + SPACING.xs,
        marginTop: SPACING.xs
      }}
      snapToInterval={itemSize}
      horizontal
      decelerationRate={0}
      bounces={false}
      showsHorizontalScrollIndicator={false}
      pagingEnabled
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
      scrollEventThrottle={16}
      onMomentumScrollEnd={handleMomentumEnd}
      onScrollEndDrag={handleMomentumEnd}
    />
  )
}