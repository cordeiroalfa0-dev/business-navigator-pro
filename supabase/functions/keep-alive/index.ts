import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const FALLBACK_MESSAGES = [
  "Every day is a new opportunity.",
  "Small steps lead to big achievements.",
  "Persistence builds success.",
  "Learning never stops.",
  "Innovation begins with curiosity.",
  "San Remo ERP — sistema ativo.",
  "Keep building, keep growing.",
]

async function fetchMessage(): Promise<string> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(
      "https://api.quotable.io/random?maxLength=100",
      { signal: controller.signal }
    )

    clearTimeout(timeout)

    if (response.ok) {
      const data = await response.json()
      return `${data.content} — ${data.author}`
    }
  } catch {
    console.log("External API unavailable, using fallback.")
  }

  return FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)]
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

  const supabase = createClient(supabaseUrl, serviceKey)
  const message  = await fetchMessage()

  const { error } = await supabase
    .from("system_heartbeats")
    .insert({
      message,
      source: "cron",
      metadata: {
        timestamp:   new Date().toISOString(),
        project_ref: supabaseUrl.split("//")[1].split(".")[0],
      },
    })

  if (error) {
    console.error("Heartbeat error:", error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  console.log("Heartbeat OK:", message)

  return new Response(
    JSON.stringify({ success: true, message, timestamp: new Date().toISOString() }),
    { headers: { "Content-Type": "application/json" } }
  )
})
