export const groupBy = (items, key) => {
  return items?.reduce((prev, cur) => {
    (prev[cur[key]] = prev[cur[key]] || []).push(cur)
    return prev
  }, {}) || {}
}

// eslint-disable-next-line max-params
export const tree = (items: any[], foreignKey: string, targetKey: string, parent: string | null) => {
  const group = groupBy(items, targetKey)

  function mapChildren(items) {
    if (items === undefined) {
      return []
    }
    return items.map(v => {
      return {
        ...v,
        children: mapChildren(group[v[foreignKey]])
      }
    })
  }

  return mapChildren(group[parent])
}
