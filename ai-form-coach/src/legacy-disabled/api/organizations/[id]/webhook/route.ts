import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

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
    const body = await request.json();
    const { action, webhookUrl, webhookSecret } = body;

    // Check if user is admin of this organization
    const { data: access, error: accessError } = await supabase
      .from('organization_users')
      .select('role')
      .eq('organization_id', resolvedParams.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (accessError || !access || access.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied - admin role required' }, { status: 403 });
    }

    switch (action) {
      case 'test':
        const webhookService = new (await import('@/lib/organizations/webhookService')).WebhookService(supabase);
        const testResult = await webhookService.testWebhook(resolvedParams.id);
        return NextResponse.json(testResult);

      case 'update':
        if (!webhookUrl) {
          return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 });
        }

        // Update organization webhook settings
        const { error: orgError } = await supabase
          .from('organizations')
          .update({
            settings: {
              webhookUrl,
              webhookSecret: webhookSecret || null,
              webhookEnabled: true
            }
          })
          .eq('id', resolvedParams.id);

        if (orgError) {
          console.error('Error updating webhook settings:', orgError);
          return NextResponse.json({ error: 'Failed to update webhook settings' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Webhook settings updated' });

      case 'disable':
        const { error: disableError } = await supabase
          .from('organizations')
          .update({
            settings: {
              webhookEnabled: false
            }
          })
          .eq('id', resolvedParams.id);

        if (disableError) {
          console.error('Error disabling webhook:', disableError);
          return NextResponse.json({ error: 'Failed to disable webhook' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Webhook disabled' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Webhook management API error:', error);
    return NextResponse.json(
      { error: 'Failed to manage webhook' },
      { status: 500 }
    );
  }
}

export async function GET(
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
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    // Check if user has access to this organization
    const { data: access, error: accessError } = await supabase
      .from('organization_users')
      .select('role')
      .eq('organization_id', resolvedParams.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (accessError || !access) {
      return NextResponse.json({ error: 'Access denied to organization' }, { status: 403 });
    }

    // Get webhook logs
    const webhookService = new (await import('@/lib/organizations/webhookService')).WebhookService(supabase);
    const logs = await webhookService.getWebhookLogs(resolvedParams.id, limit, offset);
    
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Webhook logs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook logs' },
      { status: 500 }
    );
  }
}
