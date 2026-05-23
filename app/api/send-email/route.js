import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req) {
  const { to, subject, message } = await req.json()

  const { error } = await resend.emails.send({
    from: "CCT Platform <no-reply@smart.sa>",
    to,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <img src="https://smart.sa/wp-content/themes/smart/images/logo.svg" height="30" style="margin-bottom: 20px;" />
        <div style="background: #f9fafb; border-radius: 12px; padding: 20px;">
          <p style="color: #111; font-size: 14px; margin: 0;">${message}</p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">CCT — Cold Calls Track Platform</p>
      </div>
    `,
  })

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ success: true })
}