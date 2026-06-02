const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Something went wrong")
  return data
}

export const api = {
  resetPassword: (email) =>
    request("/api/reset-password", { method: "POST", body: JSON.stringify({ email }) }),

  checkEmail: (email) =>
    request(`/api/reset-password?email=${encodeURIComponent(email)}`),

  sendEmail: (to, subject, message) =>
    request("/api/send-email", { method: "POST", body: JSON.stringify({ to, subject, message }) }),

  invite: (data) =>
    request("/api/invite", { method: "POST", body: JSON.stringify(data) }),
}