import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface DashboardData {
  totalAtividades: number;
  atividadesPrevistas: number;
  atividadesNaoPrevistas: number;
  atividadesCompletas: number;
  atividadesAtrasadas: number;
  atividadesNaoIniciadas: number;
  dataAnalise: string;
  periodo: string;
  comparacao: {
    execucaoDecrescimo: number;
    incompletasAcrescimo: number;
    dataAnterior: string;
  };
}

export async function exportDashboardToPDF(dashboardElement: HTMLElement, data: DashboardData) {
  try {
    // Capture the dashboard as an image
    const canvas = await html2canvas(dashboardElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#f5f5f0",
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Add image to PDF
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

    // Add additional pages if needed
    let heightLeft = imgHeight - 297; // A4 height
    let position = 0;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }

    // Add metadata
    pdf.setProperties({
      title: `Relatório Semanal - ${data.dataAnalise}`,
      subject: "Análise de Cronograma",
      author: "San Remo ERP",
      keywords: "relatório, análise, cronograma",
    });

    // Download
    const fileName = `relatorio_semanal_${data.dataAnalise.replace(/\//g, "-")}.pdf`;
    pdf.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error("PDF export error:", error);
    throw new Error("Erro ao exportar PDF: " + (error as Error).message);
  }
}

export function addFooterToPDF(pdf: jsPDF, pageCount: number) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    
    // Footer background
    pdf.setFillColor(22, 33, 52);
    pdf.rect(0, pageHeight - 10, pageWidth, 10, "F");

    // Footer text
    pdf.setFontSize(8);
    pdf.setTextColor(160, 165, 180);
    pdf.text(
      `San Remo ERP - Gerado em ${new Date().toLocaleString("pt-BR")}`,
      10,
      pageHeight - 4
    );
    pdf.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - 20,
      pageHeight - 4
    );
  }
}
