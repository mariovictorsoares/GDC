export const usePagination = <T>(items: Ref<T[]> | ComputedRef<T[]>, defaultPageSize = 10) => {
  const page = ref(1)
  const pageSize = ref(defaultPageSize)

  const paginatedItems = computed(() => {
    const start = (page.value - 1) * pageSize.value
    const end = start + pageSize.value
    return items.value.slice(start, end)
  })

  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(items.value.length / pageSize.value))
  })

  const totalItems = computed(() => items.value.length)

  // Reset para pagina 1 quando os itens mudam ou o tamanho da pagina muda
  watch([items, pageSize], () => {
    if (page.value > totalPages.value) {
      page.value = 1
    }
  })

  return {
    page,
    pageSize,
    paginatedItems,
    totalPages,
    totalItems
  }
}
