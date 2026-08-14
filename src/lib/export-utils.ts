import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { Quotation } from './types';

/**
 * Downloads the quotation preview as high-resolution PDF
 */
export async function downloadPDF(elementId: string = 'quotation-capture-area', filename: string = 'Quotation.pdf') {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found for PDF export');
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#FAF9F6',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback to window print if canvas fails
    window.print();
  }
}

/**
 * Downloads the quotation preview as PNG image
 */
export async function downloadPNG(elementId: string = 'quotation-capture-area', filename: string = 'Quotation.png') {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const dataUrl = await toPng(element, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#FAF9F6',
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error exporting image:', error);
  }
}

/**
 * Opens print dialog for quotation
 */
export function triggerPrint() {
  window.print();
}

import { generateWhatsAppShareUrl } from './utils';

/**
 * Generates luxury personalized WhatsApp share text and link with interactive portal URL
 */
export function shareViaWhatsApp(quotation: Quotation) {
  const url = generateWhatsAppShareUrl(quotation);
  window.open(url, '_blank');
}
