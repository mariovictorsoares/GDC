export const useFormatters = () => {
  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatNumber = (value: number | undefined) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    }).format(value || 0)
  }

  return { formatCurrency, formatNumber }
}
