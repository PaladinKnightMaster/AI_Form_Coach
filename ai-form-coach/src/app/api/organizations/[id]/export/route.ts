import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { CSVExporter } from '@/lib/organizations/csvExporter';
import type { CSVExportRequest } from '@/lib/organizations/types';
import { logEvent } from '@/lib/observability/events';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resolvedParams = await params;
    const body: CSVExportRequest = await request.json();

    // Validate request
    if (!body.metrics || body.metrics.length === 0) {
      return NextResponse.json({ error: 'At least one metric must be specified' }, { status: 400 });
    }

    if (!['detailed', 'summary'].includes(body.format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    if (!['7d', '30d', '90d', '1y', 'custom'].includes(body.timeRange)) {
      return NextResponse.json({ error: 'Invalid time range' }, { status: 400 });
    }

    if (body.timeRange === 'custom' && (!body.startDate || !body.endDate)) {
      return NextResponse.json({ error: 'Start date and end date are required for custom time range' }, { status: 400 });
    }

    // Get dashboard data for export
    const orgService = new (await import('@/lib/organizations/service')).OrganizationService(supabase);
    const dashboard = await orgService.getOrganizationDashboard(
      resolvedParams.id,
      user.id,
      {
        timeRange: body.timeRange as '7d' | '30d' | '90d' | '1y' | 'custom',
        startDate: body.startDate,
        endDate: body.endDate,
        includePHI: body.includePHI,
        exerciseFilter: undefined,
        userFilter: undefined
      }
    );

    // Generate CSV content
    const csvContent = CSVExporter.generateCSV(
      dashboard.metrics,
      dashboard.filters,
      body.format
    );

    // Generate filename
    const filename = CSVExporter.generateFilename(
      resolvedParams.id,
      body.timeRange,
      body.format,
      body.includePHI
    );

    // Create export record (for tracking purposes)
    await orgService.requestCSVExport(
      resolvedParams.id,
      user.id,
      body
    );

    // Log export request event
    logEvent('organization_export_requested', {
      organizationId: resolvedParams.id,
      userId: user.id,
      format: body.format,
      includePHI: body.includePHI,
      timeRange: body.timeRange
    });

    // Return CSV content directly for download
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Organization export API error:', error);
    return NextResponse.json(
      { error: 'Failed to create export' },
      { status: 500 }
    );
  }
}
