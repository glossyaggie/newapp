/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: { user } } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    )

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile with waiver data
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!profile.waiver_signed_at || !profile.waiver_signature_data) {
      return new Response(
        JSON.stringify({ error: 'Waiver not signed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Here you would integrate with your email service (SendGrid, Resend, etc.)
    // For now, we'll just log the waiver data
    console.log('Waiver signed by:', profile.fullname)
    console.log('Email:', user.email)
    console.log('Phone:', profile.phone)
    console.log('Signed at:', profile.waiver_signed_at)
    console.log('Signature data length:', profile.waiver_signature_data?.length)

    // TODO: Generate PDF with waiver text and signature
    // TODO: Send email with PDF attachment to admin

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Waiver processed successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing waiver:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})