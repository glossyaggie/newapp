/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'
import { encode as b64encode, decode as b64decode } from "https://deno.land/std@0.224.0/encoding/base64.ts"

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
    console.log('Fetching profile for userId:', userId)
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    console.log('Profile fetch result:', { profile, profileError })

    if (profileError || !profile) {
      console.error('Profile not found:', profileError)
      return new Response(
        JSON.stringify({ error: 'Profile not found', details: profileError }),
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

    // If you captured a data URL signature, embed it in the box
    if (typeof signatureData === "string" && signatureData.startsWith("data:image/")) {
      try {
        const base64 = signatureData.replace(/^data:image\/(png|jpeg);base64,/, "");
        const sigBytes = b64decode(base64);
        const isPng = signatureData.includes("image/png");
        const sigImage = isPng ? await pdfDoc.embedPng(sigBytes) : await pdfDoc.embedJpg(sigBytes);
        const sigBox = { x: margin + 20, y: yPosition - 60, width: 300, height: 60 };
        const scale = Math.min(sigBox.width / sigImage.width, sigBox.height / sigImage.height);
        page.drawImage(sigImage, {
          x: sigBox.x + 2, y: sigBox.y + 2,
          width: sigImage.width * scale - 4, height: sigImage.height * scale - 4
        });
      } catch (error) {
        console.log('Could not embed signature image:', error);
      }
    }

    // Generate PDF bytes and encode safely
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = b64encode(pdfBytes);

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(JSON.stringify({ ok: false, error: "Missing RESEND_API_KEY" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const toList = ["christopherascott@hotmail.com", "formking11@gmail.com"];

    const emailPayload = {
      from: "onboarding@resend.dev",
      to: toList,
      subject: `New Waiver Signed - ${profile.fullname ?? "Customer"}`,
      html: `
        <h2>New Waiver Signed</h2>
        <p><strong>Participant:</strong> ${profile.fullname ?? "N/A"}</p>
        <p><strong>Email:</strong> ${profile.email ?? "N/A"}</p>
        <p><strong>Phone:</strong> ${profile.phone ?? "N/A"}</p>
        <p><strong>Signed At:</strong> ${new Date(profile.waiver_signed_at).toLocaleString()}</p>
        <p>Signed waiver PDF attached.</p>
      `,
      attachments: [{
        filename: `waiver-${(profile.fullname ?? "customer").replace(/\s+/g,"-")}.pdf`,
        content: pdfBase64,
        type: "application/pdf"
      }]
    };

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(emailPayload)
    });

    const resText = await emailRes.text();
    if (!emailRes.ok) {
      // Surface the exact error so we can see it
      return new Response(JSON.stringify({ ok: false, stage: "resend", status: emailRes.status, body: resText }), {
        status: 502, headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    let emailJson: any = {};
    try { emailJson = JSON.parse(resText); } catch {}
    return new Response(JSON.stringify({ ok: true, message: "Email sent", emailId: emailJson.id ?? null }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    console.error('Error processing waiver:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})