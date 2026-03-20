import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'all', 'templates', 'user'

    let query = supabase
      .from('programs')
      .select(`
        *,
        program_weeks (
          *,
          program_days (
            *,
            day_blocks (*)
          )
        )
      `);

    if (type === 'templates') {
      query = query.eq('is_template', true);
    } else if (type === 'user') {
      query = query.eq('created_by', user.id);
    }

    const { data: programs, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching programs:', error);
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
    }

    return NextResponse.json({ programs: programs || [] });

  } catch (error) {
    console.error('Programs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      duration_weeks,
      difficulty_level,
      equipment_required,
      target_goals,
      program_structure
    } = body;

    // Validate required fields
    if (!name || !duration_weeks || !difficulty_level) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create program
    const { data: program, error: programError } = await supabase
      .from('programs')
      .insert({
        name,
        description,
        duration_weeks,
        difficulty_level,
        equipment_required: equipment_required || [],
        target_goals: target_goals || [],
        created_by: user.id,
        is_template: false
      })
      .select('id')
      .single();

    if (programError) {
      console.error('Error creating program:', programError);
      return NextResponse.json({ error: 'Failed to create program' }, { status: 500 });
    }

    // Create program structure if provided
    if (program_structure && program_structure.weeks) {
      for (const [weekIndex, week] of program_structure.weeks.entries()) {
        const { data: programWeek, error: weekError } = await supabase
          .from('program_weeks')
          .insert({
            program_id: program.id,
            week_number: weekIndex + 1,
            focus: week.focus,
            notes: week.notes
          })
          .select('id')
          .single();

        if (weekError) {
          console.error('Error creating program week:', weekError);
          continue;
        }

        // Create days for this week
        if (week.days) {
          for (const [dayIndex, day] of week.days.entries()) {
            const { data: programDay, error: dayError } = await supabase
              .from('program_days')
              .insert({
                program_week_id: programWeek.id,
                day_number: dayIndex + 1,
                day_name: day.day_name,
                is_rest_day: day.is_rest_day || false
              })
              .select('id')
              .single();

            if (dayError) {
              console.error('Error creating program day:', dayError);
              continue;
            }

            // Create blocks for this day
            if (day.blocks) {
              for (const [blockIndex, block] of day.blocks.entries()) {
                await supabase
                  .from('day_blocks')
                  .insert({
                    program_day_id: programDay.id,
                    block_order: blockIndex + 1,
                    block_type: block.block_type,
                    exercise_type: block.exercise_type,
                    template_id: block.template_id,
                    sets: block.sets,
                    reps: block.reps,
                    duration_seconds: block.duration_seconds,
                    rest_seconds: block.rest_seconds,
                    intensity: block.intensity,
                    notes: block.notes
                  });
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      program: { id: program.id }
    });

  } catch (error) {
    console.error('Programs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}