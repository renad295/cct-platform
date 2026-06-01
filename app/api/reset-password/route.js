import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(req) {
  const { email } = await req.json()

  // تحقق إن الإيميل موجود
  const { data, error } = await supabaseAdmin.auth.admin.listUsers()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const userExists = data.users.find(u => u.email === email)
  
  if (!userExists) {
    return NextResponse.json({ error: "This email is not registered" }, { status: 404 })
  }

  
  // أرسل رابط الريست
  const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: "https://cct-platform.vercel.app/reset-password"
  })

  if (resetError) return NextResponse.json({ error: resetError.message }, { status: 400 })

  return NextResponse.json({ success: true })
}