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
    const isTemplate = searchParams.get('is_template') === 'true';

    // Get programs (templates or user-created)
    const { data: programs, error } = await supabase
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
      `)
      .eq('is_template', isTemplate)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching programs:', error);
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
    }

    return NextResponse.json({
      programs: programs || []
    });

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
      is_template = false,
      weeks
    } = body;

    // Create program
    const { data: program, error: programError } = await supabase
      .from('programs')
      .insert({
        name,
        description,
        duration_weeks,
        difficulty_level,
        equipment_required,
        target_goals,
        is_template,
        created_by: user.id
      })
      .select()
      .single();

    if (programError) {
      console.error('Error creating program:', programError);
      return NextResponse.json({ error: 'Failed to create program' }, { status: 500 });
    }

    // Create program weeks and days if provided
    if (weeks && weeks.length > 0) {
      for (const week of weeks) {
        const { data: programWeek, error: weekError } = await supabase
          .from('program_weeks')
          .insert({
            program_id: program.id,
            week_number: week.week_number,
            focus: week.focus,
            notes: week.notes
          })
          .select()
          .single();

        if (weekError) {
          console.error('Error creating program week:', weekError);
          continue;
        }

        // Create program days
        if (week.days && week.days.length > 0) {
          for (const day of week.days) {
            const { data: programDay, error: dayError } = await supabase
              .from('program_days')
              .insert({
                program_week_id: programWeek.id,
                day_number: day.day_number,
                day_name: day.day_name,
                is_rest_day: day.is_rest_day || false
              })
              .select()
              .single();

            if (dayError) {
              console.error('Error creating program day:', dayError);
              continue;
            }

            // Create day blocks
            if (day.blocks && day.blocks.length > 0) {
              for (const block of day.blocks) {
                const { error: blockError } = await supabase
                  .from('day_blocks')
                  .insert({
                    program_day_id: programDay.id,
                    block_order: block.block_order,
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

                if (blockError) {
                  console.error('Error creating day block:', blockError);
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      program
    });

  } catch (error) {
    console.error('Programs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
