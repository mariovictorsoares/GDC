import type { Pedido, PedidoItem } from '~/types'

export const useComprasExport = () => {
  const { empresaAtiva } = useEmpresa()
  const { formatCurrency, formatNumber } = useFormatters()

  const imprimirLista = (pedido: Pedido) => {
    const itens = pedido.itens || []
    const hojeStr = new Date().toLocaleDateString('pt-BR')
    const empresa = empresaAtiva?.value?.nome || ''
    const nomeLista = pedido.nome || `Pedido ${new Date(pedido.data).toLocaleDateString('pt-BR')}`

    const linhas = itens.map((item, idx) => {
      const preco = item.preco_estimado || 0
      const total = preco * item.quantidade
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;">${idx + 1}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${item.produto?.nome || '-'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.produto?.unidade?.sigla || '-'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatNumber(item.quantidade)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">${preco > 0 ? formatCurrency(preco) : '-'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${total > 0 ? formatCurrency(total) : '-'}</td>
      </tr>`
    }).join('')

    const valorTotal = itens.reduce((sum, item) => sum + (item.preco_estimado || 0) * item.quantidade, 0)

    const html = `<html><head><title>Lista de Compras - ${nomeLista}</title>
      <style>
        @media print { body { margin:0; padding:20px; } }
        body { font-family: Arial, sans-serif; color: #111827; padding: 20px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .subtitle { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #d1d5db; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .footer { margin-top: 24px; font-size: 11px; color: #9ca3af; text-align: center; }
        .total-row { background-color: #f0fdf4; font-weight: 700; }
      </style></head><body>
      <h1>${nomeLista}</h1>
      <div class="subtitle">${empresa} · ${hojeStr} · ${itens.length} produto(s)${valorTotal > 0 ? ' · Valor estimado: ' + formatCurrency(valorTotal) : ''}</div>
      <table>
        <thead><tr>
          <th class="text-center" style="width:40px;">#</th>
          <th>Produto</th>
          <th class="text-center" style="width:50px;">Un.</th>
          <th class="text-right" style="width:80px;">Qtd.</th>
          <th class="text-right" style="width:100px;">Preco Est.</th>
          <th class="text-right" style="width:100px;">Total</th>
        </tr></thead>
        <tbody>${linhas}
          <tr class="total-row">
            <td colspan="5" style="padding:8px 10px;text-align:right;border-top:2px solid #d1d5db;">TOTAL ESTIMADO</td>
            <td style="padding:8px 10px;text-align:right;border-top:2px solid #d1d5db;">${formatCurrency(valorTotal)}</td>
          </tr>
        </tbody>
      </table>
      ${pedido.observacao ? '<p style="margin-top:16px;font-size:12px;color:#6b7280;">Obs: ' + pedido.observacao + '</p>' : ''}
      <div class="footer">CMV360 - Compras</div>
      <script>window.onload=function(){window.print();}<\/script>
    </body></html>`

    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  const enviarWhatsApp = (pedido: Pedido) => {
    const itens = pedido.itens || []
    const empresa = empresaAtiva?.value?.nome || ''
    const hojeStr = new Date().toLocaleDateString('pt-BR')
    const nomeLista = pedido.nome || `Pedido ${new Date(pedido.data).toLocaleDateString('pt-BR')}`

    const itensTexto = itens.map((item, idx) => {
      return `${idx + 1}. ${item.produto?.nome || '-'} — ${formatNumber(item.quantidade)} ${item.produto?.unidade?.sigla || ''}`
    })

    const valorTotal = itens.reduce((sum, item) => sum + (item.preco_estimado || 0) * item.quantidade, 0)

    let texto = `*LISTA DE COMPRAS*\n`
    texto += `${nomeLista}\n`
    texto += `Empresa: ${empresa}\n`
    texto += `Data: ${hojeStr}\n\n`
    texto += `*ITENS:*\n`
    texto += itensTexto.join('\n')
    texto += `\n\nTotal: ${itens.length} ${itens.length === 1 ? 'item' : 'itens'}`
    if (valorTotal > 0) texto += `\nValor estimado: ${formatCurrency(valorTotal)}`
    if (pedido.observacao) texto += `\nObs: ${pedido.observacao}`

    const encoded = encodeURIComponent(texto)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  return { imprimirLista, enviarWhatsApp }
}
