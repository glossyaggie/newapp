// Setup type definitions for built-in Supabase Runtime APIs
import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface CSVRow {
  title: string
  instructor: string
  date: string
  day: string
  start_time: string
  end_time: string
  capacity: string
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    const row: any = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    return row as CSVRow
  }).filter(row => row.title && row.instructor) // Filter out empty rows
}

function parseTime(timeStr: string): string {
  // Convert "6:00 AM" to "06:00:00"
  const [time, period] = timeStr.split(' ')
  let [hours, minutes] = time.split(':')
  
  let hour24 = parseInt(hours)
  if (period?.toUpperCase() === 'PM' && hour24 !== 12) {
    hour24 += 12
  } else if (period?.toUpperCase() === 'AM' && hour24 === 12) {
    hour24 = 0
  }
  
  return `${hour24.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}:00`
}

function parseDate(dateStr: string): string {
  // Convert "2025/08/25" to "2025-08-25"
  return dateStr.replace(/\//g, '-')
}

function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60)) // minutes
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    const { csvData, replaceExisting = false } = await req.json()
    
    if (!csvData) {
      throw new Error('CSV data is required')
    }

    console.log('📊 Processing CSV schedule import...')
    
    // Parse CSV data
    const rows = parseCSV(csvData)
    console.log(`📋 Parsed ${rows.length} rows from CSV`)
    
    if (rows.length === 0) {
      throw new Error('No valid rows found in CSV')
    }

    // If replaceExisting is true, delete existing classes for the date range
    if (replaceExisting && rows.length > 0) {
      const dates = [...new Set(rows.map(row => parseDate(row.date)))]
      console.log(`🗑️ Replacing existing classes for dates: ${dates.join(', ')}`)
      
      const { error: deleteError } = await supabase
        .from('class_schedule')
        .delete()
        .in('date', dates)
      
      if (deleteError) {
        console.error('Error deleting existing classes:', deleteError)
        throw new Error(`Failed to delete existing classes: ${deleteError.message}`)
      }
    }
    
    // Transform CSV rows to database format
    const classesToInsert = rows.map(row => {
      const startTime = parseTime(row.start_time)
      const endTime = parseTime(row.end_time)
      const duration = calculateDuration(startTime, endTime)
      
      return {
        title: row.title,
        instructor: row.instructor,
        date: parseDate(row.date),
        start_time: startTime,
        end_time: endTime,
        capacity: parseInt(row.capacity) || 24,
        duration_min: duration,
        created_by: user.id
      }
    })
    
    console.log(`💾 Inserting ${classesToInsert.length} classes...`)
    
    // Insert classes in batches to avoid timeout
    const batchSize = 50
    let insertedCount = 0
    
    for (let i = 0; i < classesToInsert.length; i += batchSize) {
      const batch = classesToInsert.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('class_schedule')
        .insert(batch)
        .select('id')
      
      if (error) {
        console.error('Error inserting batch:', error)
        throw new Error(`Failed to insert classes: ${error.message}`)
      }
      
      insertedCount += data?.length || 0
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}, total: ${insertedCount}`)
    }
    
    console.log(`🎉 Schedule import completed! Inserted ${insertedCount} classes`)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully imported ${insertedCount} classes`,
        insertedCount,
        replacedExisting: replaceExisting
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Schedule import error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})