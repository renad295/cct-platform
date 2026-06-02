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

async function checkEmailExists(email) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers()
  if (error) return { error: error.message }
  const exists = data.users.some(u => u.email === email)
  return { exists }
}

export async function POST(req) {
  const { email } = await req.json()

  const { exists, error: checkError } = await checkEmailExists(email)
  if (checkError) return NextResponse.json({ error: checkError }, { status: 400 })

  if (!exists) {
    return NextResponse.json({ error: "This email is not registered" }, { status: 404 })
  }

  const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: "https://cct-platform.vercel.app/reset-password"
  })

  if (resetError) {
    const msg = resetError.message.toLowerCase().includes("rate")
      ? "Too many attempts. Please try again after an hour."
      : resetError.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")

  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

  const { exists, error } = await checkEmailExists(email)
  if (error) return NextResponse.json({ error }, { status: 400 })

  return NextResponse.json({ exists })
}