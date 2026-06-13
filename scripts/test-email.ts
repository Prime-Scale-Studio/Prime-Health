import { config } from 'dotenv'
import { resolve } from 'path'
import nodemailer from 'nodemailer'

// Load .env.local manually
config({ path: resolve(process.cwd(), '.env.local') })

async function testEmail() {
  console.info('🧪 Testing Gmail SMTP...')
  console.info('Provider:', process.env.EMAIL_PROVIDER)
  console.info('From:', process.env.EMAIL_FROM)
  console.info('To:', process.env.RESEND_DEV_EMAIL || process.env.EMAIL_FROM)
  console.info('---')

  if (process.env.EMAIL_PROVIDER !== 'gmail') {
    console.error('❌ EMAIL_PROVIDER is not gmail')
    return
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: process.env.RESEND_DEV_EMAIL || process.env.EMAIL_FROM,
      subject: 'Prime Health - Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #0071E3;">✅ Email is Working!</h1>
          <p>If you're reading this, your Gmail SMTP configuration is correct.</p>
        </div>
      `,
    })

    console.info('✅ Email sent successfully!')
    console.info('Message ID:', info.messageId)
  } catch (err: any) {
    console.error('❌ Exception:', err.message)
    console.error('Full error:', err)
  }
}

testEmail()
