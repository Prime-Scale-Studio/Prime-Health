import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local manually
config({ path: resolve(process.cwd(), '.env.local') })

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function testEmail() {
  console.info('🧪 Testing Resend Email...')
  console.info('API Key exists:', !!process.env.RESEND_API_KEY)
  console.info('From:', process.env.NEXT_PUBLIC_EMAIL_FROM || 'onboarding@resend.dev')
  console.info('To:', process.env.RESEND_DEV_EMAIL)
  console.info('---')

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is missing in .env.local')
    return
  }

  if (!process.env.RESEND_DEV_EMAIL) {
    console.error('❌ RESEND_DEV_EMAIL is missing in .env.local')
    return
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [process.env.RESEND_DEV_EMAIL],
      subject: 'Prime Health - Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #0071E3;">✅ Email is Working!</h1>
          <p>If you're reading this, your Resend configuration is correct.</p>
          <p>From: onboarding@resend.dev</p>
          <p>API Key: ${process.env.RESEND_API_KEY?.slice(0, 10)}...</p>
        </div>
      `,
    })

    if (error) {
      console.error('❌ Resend Error:', JSON.stringify(error, null, 2))
      return
    }

    console.info('✅ Email sent successfully!')
    console.info('Email ID:', data?.id)
    console.info('\nCheck your inbox:', process.env.RESEND_DEV_EMAIL)
  } catch (err: any) {
    console.error('❌ Exception:', err.message)
    console.error('Full error:', err)
  }
}

testEmail()
