import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { csv_data, user_email } = await req.json()

    // Check if user is authorized
    const allowedEmails = Deno.env.get('SCHEDULE_IMPORT_ALLOWED_EMAILS')?.split(',') || []
    if (!allowedEmails.includes(user_email)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get user ID from email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(user_email)
    if (userError || !userData.user) {
      throw new Error('User not found')
    }

    const userId = userData.user.id

    // Parse CSV data
    const lines = csv_data.trim().split('\n')
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase())
    
    const requiredHeaders = ['title', 'instructor', 'date', 'start_time', 'end_time', 'capacity']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`)
    }

    const classes = []
    const errors = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v: string) => v.trim())
      
      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`)
        continue
      }

      const classData: any = {}
      headers.forEach((header, index) => {
        classData[header] = values[index]
      })

      // Validate and transform data
      try {
        const classRecord = {
          title: classData.title,
          instructor: classData.instructor,
          date: classData.date, // Should be YYYY-MM-DD format
          start_time: classData.start_time, // Should be HH:MM format
          end_time: classData.end_time, // Should be HH:MM format
          capacity: parseInt(classData.capacity) || 20,
          duration_min: classData.duration_min ? parseInt(classData.duration_min) : 60,
          heat_c: classData.heat_c ? parseInt(classData.heat_c) : null,
          level: classData.level || null,
          notes: classData.notes || null,
          created_by: userId
        }

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(classRecord.date)) {
          throw new Error('Invalid date format (use YYYY-MM-DD)')
        }

        // Validate time format
        if (!/^\d{2}:\d{2}$/.test(classRecord.start_time) || !/^\d{2}:\d{2}$/.test(classRecord.end_time)) {
          throw new Error('Invalid time format (use HH:MM)')
        }

        classes.push(classRecord)
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`)
      }
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation errors', details: errors }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Upsert classes (idempotent by date + title + start_time)
    const results = {
      inserted: 0,
      updated: 0,
      errors: []
    }

    for (const classRecord of classes) {
      try {
        // Check if class already exists
        const { data: existing } = await supabase
          .from('class_schedule')
          .select('id')
          .eq('date', classRecord.date)
          .eq('title', classRecord.title)
          .eq('start_time', classRecord.start_time)
          .single()

        if (existing) {
          // Update existing class
          const { error } = await supabase
            .from('class_schedule')
            .update(classRecord)
            .eq('id', existing.id)

          if (error) throw error
          results.updated++
        } else {
          // Insert new class
          const { error } = await supabase
            .from('class_schedule')
            .insert(classRecord)

          if (error) throw error
          results.inserted++
        }
      } catch (error) {
        results.errors.push(`${classRecord.title} on ${classRecord.date}: ${error.message}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results: {
          total_processed: classes.length,
          inserted: results.inserted,
          updated: results.updated,
          errors: results.errors
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Schedule import error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})