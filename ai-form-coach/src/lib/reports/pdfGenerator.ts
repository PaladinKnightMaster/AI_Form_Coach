// Client-side PDF Generation Service

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { SessionReportData, ReportOptions, ReportGenerationResult } from './types';

export class PDFReportGenerator {
  private isGenerating = false;

  async generateReport(
    sessionData: SessionReportData,
    options: ReportOptions,
    isProUser: boolean
  ): Promise<ReportGenerationResult> {
    if (this.isGenerating) {
      return {
        success: false,
        error: 'Report generation already in progress'
      };
    }

    this.isGenerating = true;

    try {
      // Create report HTML element
      const reportElement = this.createReportElement(sessionData, options, isProUser);
      
      // Add to DOM temporarily
      document.body.appendChild(reportElement);
      
      // Generate PDF
      const pdf = await this.generatePDFFromElement(reportElement, options);
      
      // Clean up
      document.body.removeChild(reportElement);
      
      // Generate filename
      const date = new Date(sessionData.startedAt).toISOString().split('T')[0];
      const exercise = sessionData.exercise.charAt(0).toUpperCase() + sessionData.exercise.slice(1);
      const fileName = `FormReport_${exercise}_${date}.pdf`;
      
      // Save file
      pdf.save(fileName);
      
      // Calculate file size (approximate)
      const fileSize = this.estimateFileSize(pdf, options);
      
      this.isGenerating = false;
      
      return {
        success: true,
        fileName,
        fileSize
      };
    } catch (error) {
      this.isGenerating = false;
      console.error('Error generating PDF report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private createReportElement(
    sessionData: SessionReportData,
    options: ReportOptions,
    isProUser: boolean
  ): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 210mm;
      min-height: 297mm;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20mm;
      box-sizing: border-box;
    `;

    const content = this.generateReportHTML(sessionData, options, isProUser);
    container.innerHTML = content;
    
    return container;
  }

  private generateReportHTML(
    sessionData: SessionReportData,
    options: ReportOptions,
    isProUser: boolean
  ): string {
    const exercise = sessionData.exercise.charAt(0).toUpperCase() + sessionData.exercise.slice(1);
    const date = new Date(sessionData.startedAt).toLocaleDateString();
    const duration = Math.floor(sessionData.duration / 60);
    const durationSeconds = sessionData.duration % 60;
    
    return `
      <div style="color: #1f2937;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px;">
          <h1 style="color: #3b82f6; font-size: 28px; margin: 0; font-weight: 700;">AI Form Coach</h1>
          <h2 style="color: #1f2937; font-size: 24px; margin: 10px 0 0 0; font-weight: 600;">${exercise} Form Report</h2>
          <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>

        <!-- Session Overview -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #3b82f6; font-size: 18px; margin-bottom: 15px; font-weight: 600;">Session Overview</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 20px; border-radius: 8px;">
            <div>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${date}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Duration:</strong> ${duration}:${durationSeconds.toString().padStart(2, '0')}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Total Reps:</strong> ${sessionData.totalReps}</p>
            </div>
            <div>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Correct Rate:</strong> ${Math.round(sessionData.correctRate * 100)}%</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Avg Quality:</strong> ${Math.round(sessionData.avgQualityScore)}%</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Avg ROM:</strong> ${Math.round(sessionData.avgRomScore)}%</p>
            </div>
          </div>
        </div>

        <!-- Performance Insights -->
        ${options.includeInsights ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #3b82f6; font-size: 18px; margin-bottom: 15px; font-weight: 600;">Performance Insights</h3>
          <div style="display: grid; gap: 15px;">
            ${sessionData.insights.map(insight => `
              <div style="background: ${insight.severity === 'positive' ? '#f0fdf4' : insight.severity === 'negative' ? '#fef2f2' : '#f8fafc'}; 
                          border-left: 4px solid ${insight.severity === 'positive' ? '#10b981' : insight.severity === 'negative' ? '#ef4444' : '#6b7280'}; 
                          padding: 15px; border-radius: 4px;">
                <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${insight.title}</h4>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;">${insight.description}</p>
                ${insight.recommendation ? `<p style="margin: 0; font-size: 13px; color: #6b7280; font-style: italic;">💡 ${insight.recommendation}</p>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Next Focus Areas -->
        ${options.includeNextFocus ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #3b82f6; font-size: 18px; margin-bottom: 15px; font-weight: 600;">Next Focus Areas</h3>
          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px;">
            <ul style="margin: 0; padding-left: 20px;">
              ${sessionData.nextFocus.map(focus => `<li style="margin: 5px 0; font-size: 14px; color: #92400e;">${focus}</li>`).join('')}
            </ul>
          </div>
        </div>
        ` : ''}

        <!-- Rep Details -->
        ${options.includeDetailedReps ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #3b82f6; font-size: 18px; margin-bottom: 15px; font-weight: 600;">Rep Details</h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Rep</th>
                  <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Correct</th>
                  <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Quality</th>
                  <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">ROM</th>
                  <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Tempo</th>
                </tr>
              </thead>
              <tbody>
                ${sessionData.reps.map(rep => `
                  <tr>
                    <td style="border: 1px solid #e5e7eb; padding: 8px;">${rep.idx}</td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px;">
                      ${rep.isCorrect === true ? '✅' : rep.isCorrect === false ? '❌' : '—'}
                    </td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px;">
                      ${rep.qualityScore ? Math.round(rep.qualityScore) + '%' : '—'}
                    </td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px;">
                      ${rep.romScore ? Math.round(rep.romScore) + '%' : '—'}
                    </td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px;">
                      ${rep.tempo ? rep.tempo.charAt(0).toUpperCase() + rep.tempo.slice(1) : '—'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">Generated by AI Form Coach</p>
          ${!isProUser && options.includeWatermark ? `
            <p style="margin: 5px 0 0 0; color: #9ca3af;">Free Report - Upgrade to Pro for watermark removal</p>
          ` : ''}
        </div>
      </div>
    `;
  }

  private async generatePDFFromElement(element: HTMLElement, options: ReportOptions): Promise<jsPDF> {
    const canvas = await html2canvas(element, {
      scale: options.quality === 'high' ? 2 : 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: element.offsetWidth,
      height: element.offsetHeight
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.8);
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf;
  }

  private estimateFileSize(pdf: jsPDF, options: ReportOptions): number {
    // Rough estimation based on content and quality
    const baseSize = 500; // KB
    const qualityMultiplier = options.quality === 'high' ? 2 : 1;
    const contentMultiplier = options.includeDetailedReps ? 1.5 : 1;
    
    return Math.round(baseSize * qualityMultiplier * contentMultiplier);
  }
}

export const pdfReportGenerator = new PDFReportGenerator();
