import { serve } from 'std/server'
import { Resend } from 'resend'

// The RESEND_API_KEY will be set as an environment variable in Supabase dashboard or CLI
const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  try {
    const { to, subject, html, text } = await req.json()

    if (!to || !subject || (!html && !text)) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    const { data, error } = await resend.emails.send({
      from: 'Your Store <noreply@yourdomain.com>', // Use a verified sender domain
      to,
      subject,
      html,
      text,
    })

    if (error) {
      return new Response(JSON.stringify({ error }), { status: 500 })
    }

    return new Response(JSON.stringify({ data }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})