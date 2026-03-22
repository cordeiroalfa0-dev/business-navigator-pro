import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { Material } from '../types/material'

// Logo San Remo Construtora em Base64
const LOGO_SAN_REMO = `data:image/png;base64,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`

export const relatorioService = {
  async getEstatisticasPorDestino() {
    try {
      const { data, error } = await supabase
        .from('materiais')
        .select('destino');

      if (error) throw error;

      const stats = {
        'Almoxarifado': 0,
        'Palazzo Lumini': 0,
        'Queen Victoria': 0,
        'Chateau Carmelo': 0
      };

      data?.forEach((item: any) => {
        if (item.destino in stats) {
          stats[item.destino as keyof typeof stats]++;
        }
      });

      return stats;
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
      return {
        'Almoxarifado': 0,
        'Palazzo Lumini': 0,
        'Queen Victoria': 0,
        'Chateau Carmelo': 0
      };
    }
  },

  gerarPDF(materiais: Material[], filtros: string, userEmail?: string) {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // ===========================================
    // CABEÇALHO COM LOGOTIPO SAN DEMO
    // ===========================================
    
    // Fundo do cabeçalho removido (era azul)
    // doc.setFillColor(6, 182, 212)
    // doc.rect(0, 0, pageWidth, 55, 'F')
    
    // Adicionar logotipo San Remo centralizado
    try {
      const logoWidth = 50
      const logoX = (pageWidth - logoWidth) / 2
      doc.addImage(LOGO_SAN_REMO, 'PNG', logoX, 8, logoWidth, 12)
    } catch (error) {
      console.warn('Erro ao adicionar logo:', error)
    }

    // Título do relatório (cor alterada para preto)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(26)
    doc.setFont('helvetica', 'bold')
    doc.text('RELATÓRIO DE MATERIAIS', pageWidth / 2, 27, { align: 'center' })
    
    // Subtítulo com filtros
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(filtros, pageWidth / 2, 37, { align: 'center' })
    
    // Linha decorativa (cor alterada para cinza)
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.line(14, 45, pageWidth - 14, 45)

    // ===========================================
    // INFORMAÇÕES DO RELATÓRIO
    // ===========================================
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    
    const dataGeracao = new Date().toLocaleString('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short'
    })
    
    let yPosition = 65
    
    doc.setFont('helvetica', 'bold')
    doc.text('Data de Geração:', 14, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(dataGeracao, 50, yPosition)
    
    if (userEmail) {
      yPosition += 6
      doc.setFont('helvetica', 'bold')
      doc.text('Gerado por:', 14, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.text(userEmail, 50, yPosition)
    }
    
    yPosition += 6
    doc.setFont('helvetica', 'bold')
    doc.text('Total de Registros:', 14, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(materiais.length.toString(), 50, yPosition)
    
    const totalQuantidade = materiais.reduce((acc, m) => acc + m.quantidade, 0)
    yPosition += 6
    doc.setFont('helvetica', 'bold')
    doc.text('Quantidade Total:', 14, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(totalQuantidade.toString(), 50, yPosition)

    // ===========================================
    // TABELA DE DADOS
    // ===========================================
    const tableData = materiais.map(m => [
      m.nome,
      m.categoria,
      m.quantidade.toString(),
      m.unidade,
      m.destino,
      new Date(m.data_entrada).toLocaleDateString('pt-BR'),
      m.responsavel || '-'
    ])

    autoTable(doc, {
      startY: yPosition + 12,
      head: [['Material', 'Categoria', 'Qtd', 'Unidade', 'Destino', 'Data', 'Responsável']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [100, 100, 100], // Cinza escuro (era azul)
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        cellPadding: 4
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [0, 0, 0],
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Cinza claro
      },
      columnStyles: {
        0: { cellWidth: 40 }, // Material
        1: { cellWidth: 28 }, // Categoria
        2: { cellWidth: 15, halign: 'center' }, // Quantidade
        3: { cellWidth: 20, halign: 'center' }, // Unidade
        4: { cellWidth: 32 }, // Destino
        5: { cellWidth: 22, halign: 'center' }, // Data
        6: { cellWidth: 28 } // Responsável
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Rodapé em cada página
        const pageNumber = doc.getCurrentPageInfo().pageNumber
        const totalPages = doc.getNumberOfPages()
        
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.setFont('helvetica', 'normal')
        
        // Número da página
        doc.text(
          `Página ${pageNumber} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        )
        
        // Rodapé com nome da empresa
        doc.setFontSize(7)
        doc.text(
          'San Remo Construtora - Relatório Gerado Automaticamente',
          14,
          pageHeight - 10
        )
      }
    })

    // ===========================================
    // SALVAR ARQUIVO
    // ===========================================
    const timestamp = new Date().getTime()
    const fileName = `relatorio-san-remo-${timestamp}.pdf`
    doc.save(fileName)
    
  },

  exportarExcel(materiais: Material[], nomeArquivo: string, userEmail?: string) {
    // ===========================================
    // PREPARAR DADOS
    // ===========================================
    const dadosExcel = materiais.map(m => ({
      'Material': m.nome,
      'Categoria': m.categoria,
      'Quantidade': m.quantidade,
      'Unidade': m.unidade,
      'Destino': m.destino,
      'Data de Entrada': new Date(m.data_entrada).toLocaleDateString('pt-BR'),
      'Responsável': m.responsavel || '-',
      'Observações': m.observacoes || '-'
    }))

    // ===========================================
    // SHEET 1: MATERIAIS
    // ===========================================
    const ws = XLSX.utils.json_to_sheet(dadosExcel)

    // Ajustar largura das colunas
    const columnWidths = [
      { wch: 35 }, // Material
      { wch: 22 }, // Categoria
      { wch: 12 }, // Quantidade
      { wch: 15 }, // Unidade
      { wch: 28 }, // Destino
      { wch: 16 }, // Data
      { wch: 28 }, // Responsável
      { wch: 45 }  // Observações
    ]
    ws['!cols'] = columnWidths

    // ===========================================
    // SHEET 2: INFORMAÇÕES E ESTATÍSTICAS
    // ===========================================
    const totalQuantidade = materiais.reduce((acc, m) => acc + m.quantidade, 0)
    const categorias = [...new Set(materiais.map(m => m.categoria))]
    const destinos = [...new Set(materiais.map(m => m.destino))]
    
    const infoData = [
      ['SAN DEMO CONSTRUTORA'],
      ['RELATÓRIO DE MATERIAIS'],
      [''],
      ['Data de Geração:', new Date().toLocaleString('pt-BR')],
      ['Gerado por:', userEmail || 'Sistema'],
      [''],
      ['ESTATÍSTICAS'],
      ['Total de Registros:', materiais.length],
      ['Quantidade Total de Unidades:', totalQuantidade],
      ['Categorias Diferentes:', categorias.length],
      ['Destinos:', destinos.length],
      [''],
      ['CATEGORIAS ENCONTRADAS'],
      ...categorias.map(cat => [cat]),
      [''],
      ['DESTINOS'],
      ...destinos.map(dest => [dest])
    ]
    
    const wsInfo = XLSX.utils.aoa_to_sheet(infoData)
    wsInfo['!cols'] = [{ wch: 30 }, { wch: 50 }]

    // ===========================================
    // CRIAR WORKBOOK
    // ===========================================
    const wb = XLSX.utils.book_new()
    
    XLSX.utils.book_append_sheet(wb, ws, 'Materiais')
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Informações')

    // ===========================================
    // EXPORTAR ARQUIVO
    // ===========================================
    const timestamp = new Date().getTime()
    const fileName = `${nomeArquivo}-${timestamp}.xlsx`
    XLSX.writeFile(wb, fileName)
    
  }
}