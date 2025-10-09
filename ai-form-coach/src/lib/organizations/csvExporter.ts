import type { OrganizationMetrics, OrganizationDashboardFilters } from './types';

export class CSVExporter {
  /**
   * Generate CSV content for organization metrics
   */
  static generateCSV(
    metrics: OrganizationMetrics,
    filters: OrganizationDashboardFilters,
    format: 'detailed' | 'summary' = 'summary'
  ): string {
    if (format === 'summary') {
      return this.generateSummaryCSV(metrics, filters);
    } else {
      return this.generateDetailedCSV(metrics, filters);
    }
  }

  /**
   * Generate summary CSV with key metrics
   */
  private static generateSummaryCSV(
    metrics: OrganizationMetrics,
    filters: OrganizationDashboardFilters
  ): string {
    const headers = [
      'Metric',
      'Value',
      'Time Range',
      'Generated At'
    ];

    const rows = [
      ['Form IQ Average', `${(metrics.formIQ.average * 100).toFixed(1)}%`, filters.timeRange, metrics.generatedAt],
      ['Form IQ Trend', metrics.formIQ.trend, filters.timeRange, metrics.generatedAt],
      ['Verified Minutes Total', metrics.verifiedMinutes.total.toString(), filters.timeRange, metrics.generatedAt],
      ['Verified Minutes Average per User', metrics.verifiedMinutes.averagePerUser.toFixed(1), filters.timeRange, metrics.generatedAt],
      ['Verified Minutes Trend', metrics.verifiedMinutes.trend, filters.timeRange, metrics.generatedAt],
      ['Adherence Overall', `${metrics.adherence.overall.toFixed(1)}%`, filters.timeRange, metrics.generatedAt],
      ['Adherence Trend', metrics.adherence.trend, filters.timeRange, metrics.generatedAt],
      ['Total Users', metrics.users.total.toString(), filters.timeRange, metrics.generatedAt],
      ['Active Users', metrics.users.active.toString(), filters.timeRange, metrics.generatedAt],
      ['New Users', metrics.users.new.toString(), filters.timeRange, metrics.generatedAt],
      ['High Engagement Users', metrics.users.engagement.high.toString(), filters.timeRange, metrics.generatedAt],
      ['Medium Engagement Users', metrics.users.engagement.medium.toString(), filters.timeRange, metrics.generatedAt],
      ['Low Engagement Users', metrics.users.engagement.low.toString(), filters.timeRange, metrics.generatedAt],
      ['Resolution Rate', `${metrics.resolution.resolutionRate.toFixed(1)}%`, filters.timeRange, metrics.generatedAt],
      ['Total Flagged', metrics.resolution.totalFlagged.toString(), filters.timeRange, metrics.generatedAt],
      ['Total Resolved', metrics.resolution.totalResolved.toString(), filters.timeRange, metrics.generatedAt]
    ];

    return this.arrayToCSV([headers, ...rows]);
  }

  /**
   * Generate detailed CSV with comprehensive data
   */
  private static generateDetailedCSV(
    metrics: OrganizationMetrics,
    filters: OrganizationDashboardFilters
  ): string {
    const sections = [];

    // Summary section
    sections.push({
      title: 'Summary Metrics',
      headers: ['Metric', 'Value', 'Time Range', 'Generated At'],
      rows: [
        ['Form IQ Average', `${(metrics.formIQ.average * 100).toFixed(1)}%`, filters.timeRange, metrics.generatedAt],
        ['Form IQ Trend', metrics.formIQ.trend, filters.timeRange, metrics.generatedAt],
        ['Verified Minutes Total', metrics.verifiedMinutes.total.toString(), filters.timeRange, metrics.generatedAt],
        ['Verified Minutes Average per User', metrics.verifiedMinutes.averagePerUser.toFixed(1), filters.timeRange, metrics.generatedAt],
        ['Adherence Overall', `${metrics.adherence.overall.toFixed(1)}%`, filters.timeRange, metrics.generatedAt],
        ['Total Users', metrics.users.total.toString(), filters.timeRange, metrics.generatedAt],
        ['Active Users', metrics.users.active.toString(), filters.timeRange, metrics.generatedAt],
        ['Resolution Rate', `${metrics.resolution.resolutionRate.toFixed(1)}%`, filters.timeRange, metrics.generatedAt]
      ]
    });

    // Form IQ Distribution
    sections.push({
      title: 'Form IQ Distribution',
      headers: ['Quality Level', 'Count', 'Percentage'],
      rows: [
        ['Excellent (80-100%)', metrics.formIQ.distribution.excellent.toString(), this.calculatePercentage(metrics.formIQ.distribution.excellent, metrics.formIQ.distribution)],
        ['Good (60-80%)', metrics.formIQ.distribution.good.toString(), this.calculatePercentage(metrics.formIQ.distribution.good, metrics.formIQ.distribution)],
        ['Fair (40-60%)', metrics.formIQ.distribution.fair.toString(), this.calculatePercentage(metrics.formIQ.distribution.fair, metrics.formIQ.distribution)],
        ['Poor (0-40%)', metrics.formIQ.distribution.poor.toString(), this.calculatePercentage(metrics.formIQ.distribution.poor, metrics.formIQ.distribution)]
      ]
    });

    // Verified Minutes by Exercise
    sections.push({
      title: 'Verified Minutes by Exercise',
      headers: ['Exercise', 'Minutes', 'Percentage'],
      rows: [
        ['Squat', metrics.verifiedMinutes.byExercise.squat.toString(), this.calculatePercentage(metrics.verifiedMinutes.byExercise.squat, metrics.verifiedMinutes.byExercise)],
        ['Pushup', metrics.verifiedMinutes.byExercise.pushup.toString(), this.calculatePercentage(metrics.verifiedMinutes.byExercise.pushup, metrics.verifiedMinutes.byExercise)],
        ['Plank', metrics.verifiedMinutes.byExercise.plank.toString(), this.calculatePercentage(metrics.verifiedMinutes.byExercise.plank, metrics.verifiedMinutes.byExercise)],
        ['Other', metrics.verifiedMinutes.byExercise.other.toString(), this.calculatePercentage(metrics.verifiedMinutes.byExercise.other, metrics.verifiedMinutes.byExercise)]
      ]
    });

    // User Engagement
    sections.push({
      title: 'User Engagement Levels',
      headers: ['Engagement Level', 'User Count', 'Percentage'],
      rows: [
        ['High (>3 sessions/week)', metrics.users.engagement.high.toString(), this.calculatePercentage(metrics.users.engagement.high, metrics.users.engagement)],
        ['Medium (1-3 sessions/week)', metrics.users.engagement.medium.toString(), this.calculatePercentage(metrics.users.engagement.medium, metrics.users.engagement)],
        ['Low (<1 session/week)', metrics.users.engagement.low.toString(), this.calculatePercentage(metrics.users.engagement.low, metrics.users.engagement)]
      ]
    });

    // Weekly Form IQ Data
    if (metrics.formIQ.weeklyData && metrics.formIQ.weeklyData.length > 0) {
      sections.push({
        title: 'Weekly Form IQ Trend',
        headers: ['Week', 'Average Form IQ', 'Session Count'],
        rows: metrics.formIQ.weeklyData.map(data => [
          data.week,
          `${(data.average * 100).toFixed(1)}%`,
          data.count.toString()
        ])
      });
    }

    // Weekly Verified Minutes Data
    if (metrics.verifiedMinutes.weeklyData && metrics.verifiedMinutes.weeklyData.length > 0) {
      sections.push({
        title: 'Weekly Verified Minutes',
        headers: ['Week', 'Total Minutes', 'User Count'],
        rows: metrics.verifiedMinutes.weeklyData.map(data => [
          data.week,
          data.totalMinutes.toString(),
          data.userCount.toString()
        ])
      });
    }

    // Weekly Adherence Data
    if (metrics.adherence.weeklyData && metrics.adherence.weeklyData.length > 0) {
      sections.push({
        title: 'Weekly Adherence',
        headers: ['Week', 'Adherence %', 'Target Sessions', 'Actual Sessions'],
        rows: metrics.adherence.weeklyData.map(data => [
          data.week,
          `${data.percentage.toFixed(1)}%`,
          data.targetSessions.toString(),
          data.actualSessions.toString()
        ])
      });
    }

    // User-level Adherence (if PHI is allowed)
    if (filters.includePHI && metrics.adherence.byUser && metrics.adherence.byUser.length > 0) {
      sections.push({
        title: 'User Adherence Details',
        headers: ['User Email', 'Adherence %', 'Total Sessions', 'Target Sessions', 'Last Session Date'],
        rows: metrics.adherence.byUser.map(user => [
          user.userEmail || 'N/A',
          `${user.adherence.toFixed(1)}%`,
          user.totalSessions.toString(),
          user.targetSessions.toString(),
          user.lastSessionDate || 'N/A'
        ])
      });
    }

    // Combine all sections
    const allRows: string[][] = [];
    sections.forEach((section, index) => {
      if (index > 0) {
        allRows.push(['']); // Empty row between sections
      }
      allRows.push([section.title]);
      allRows.push(section.headers);
      allRows.push(...section.rows);
    });

    return this.arrayToCSV(allRows);
  }

  /**
   * Convert array of arrays to CSV string
   */
  private static arrayToCSV(rows: string[][]): string {
    return rows.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const escaped = cell.replace(/"/g, '""');
        if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
          return `"${escaped}"`;
        }
        return escaped;
      }).join(',')
    ).join('\n');
  }

  /**
   * Calculate percentage of a value relative to total
   */
  private static calculatePercentage(value: number, total: Record<string, number>): string {
    const sum = Object.values(total).reduce((acc, val) => acc + val, 0);
    if (sum === 0) return '0.0%';
    return `${((value / sum) * 100).toFixed(1)}%`;
  }

  /**
   * Generate filename for export
   */
  static generateFilename(
    organizationId: string,
    timeRange: string,
    format: 'detailed' | 'summary',
    includePHI: boolean
  ): string {
    const date = new Date().toISOString().split('T')[0];
    const phiSuffix = includePHI ? '-phi' : '';
    const formatSuffix = format === 'detailed' ? '-detailed' : '-summary';
    return `organization-${organizationId}-${timeRange}${formatSuffix}${phiSuffix}-${date}.csv`;
  }

  /**
   * Create downloadable blob
   */
  static createDownloadBlob(csvContent: string): Blob {
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  /**
   * Trigger download
   */
  static downloadCSV(csvContent: string, filename: string): void {
    const blob = this.createDownloadBlob(csvContent);
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  }
}
