/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

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
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestBody = await req.json()
    const { userId, userProfile, signatureData } = requestBody

    if (!userId || !signatureData) {
      return new Response(
        JSON.stringify({ error: 'Missing required data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile with waiver data
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate PDF with waiver content and signature
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([612, 792]) // Standard letter size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    const { width, height } = page.getSize()
    const margin = 50
    let yPosition = height - margin

    // Title
    page.drawText('LIABILITY WAIVER - SIGNED COPY', {
      x: margin,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    yPosition -= 40

    // User Information
    page.drawText('PARTICIPANT INFORMATION:', {
      x: margin,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    yPosition -= 25

    const userInfo = [
      `Name: ${profile.fullname || 'N/A'}`,
      `Email: ${profile.email || 'N/A'}`,
      `Phone: ${profile.phone || 'N/A'}`,
      `Date Signed: ${new Date(profile.waiver_signed_at).toLocaleDateString()}`,
      `Time Signed: ${new Date(profile.waiver_signed_at).toLocaleTimeString()}`
    ]

    userInfo.forEach(info => {
      page.drawText(info, {
        x: margin + 20,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      })
      yPosition -= 20
    })

    yPosition -= 20

    // Waiver Content
    page.drawText('WAIVER AGREEMENT:', {
      x: margin,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    yPosition -= 25

    const waiverText = [
      'By signing this waiver, I acknowledge that I have read and understood',
      'the full liability waiver document. I voluntarily assume all risks',
      'associated with participating in hot yoga classes and activities.',
      '',
      'I release and hold harmless the yoga studio, its owners, instructors,',
      'and staff from any and all claims, damages, or injuries that may',
      'result from my participation in yoga classes or use of facilities.',
      '',
      'I confirm that I am physically fit to participate and have disclosed',
      'any medical conditions that may affect my ability to safely participate.',
    ]

    waiverText.forEach(line => {
      if (line.trim()) {
        page.drawText(line, {
          x: margin + 20,
          y: yPosition,
          size: 11,
          font: font,
          color: rgb(0, 0, 0),
        })
      }
      yPosition -= 18
    })

    yPosition -= 30

    // Signature Section
    page.drawText('DIGITAL SIGNATURE:', {
      x: margin,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    yPosition -= 25

    // Draw signature box
    page.drawRectangle({
      x: margin + 20,
      y: yPosition - 60,
      width: 300,
      height: 60,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    })

    page.drawText('Signature captured digitally on mobile device', {
      x: margin + 30,
      y: yPosition - 30,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    })

    page.drawText(`Signed by: ${profile.fullname || 'N/A'}`, {
      x: margin + 30,
      y: yPosition - 45,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    })

    yPosition -= 80

    // Footer
    page.drawText('This document was digitally signed and is legally binding.', {
      x: margin,
      y: 50,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    })

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save()
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes))

    // Send email using Resend (free tier: 3000 emails/month)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not configured, skipping email')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Waiver processed (email not configured)' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Hot Yoga Studio <noreply@yourdomain.com>', // You'll need to configure this
        to: ['christopherascott@hotmail.com'],
        subject: `New Waiver Signed - ${profile.fullname}`,
        html: `
          <h2>New Waiver Signed</h2>
          <p><strong>Participant:</strong> ${profile.fullname}</p>
          <p><strong>Email:</strong> ${profile.email}</p>
          <p><strong>Phone:</strong> ${profile.phone}</p>
          <p><strong>Signed At:</strong> ${new Date(profile.waiver_signed_at).toLocaleString()}</p>
          <p>Please find the signed waiver attached as a PDF.</p>
        `,
        attachments: [{
          filename: `waiver-${profile.fullname?.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBase64,
          type: 'application/pdf',
        }]
      })
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Failed to send email:', errorText)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Waiver processed but email failed to send',
          emailError: errorText
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailResult = await emailResponse.json()
    console.log('Email sent successfully:', emailResult)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Waiver processed and email sent successfully',
        emailId: emailResult.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing waiver:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})