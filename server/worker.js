// Cloudflare Worker — AI text extraction proxy for Hanzi Steps
//
// Deploy: npx wrangler deploy server/worker.js --name hanzi-ai-proxy
// Set secret: npx wrangler secret put GEMINI_API_KEY
//
// Environment variable:
//   GEMINI_API_KEY — your Google Gemini API key
//   ALLOWED_ORIGINS — comma-separated allowed origins (optional, defaults to *)

const GEMINI_MODEL = 'gemini-3.5-flash'

const SYSTEM_PROMPT = [
  'Extract Chinese characters from this image.',
  'RULES:',
  '- Output ONLY Chinese characters and Chinese punctuation.',
  '- One word or phrase per line.',
  '- Do NOT output any English, pinyin, numbers, explanations, comments, or descriptions.',
  '- Do NOT describe what you see. Do NOT say "partially visible" or anything similar.',
  '- If a character is unclear, make your best guess.',
  '- If there are no Chinese characters at all, output nothing.',
].join('\n')

export default {
  async fetch(request, env) {
    const allowedOrigins = env.ALLOWED_ORIGINS || '*'
    const origin = request.headers.get('Origin') || ''

    const corsHeaders = {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }

    if (allowedOrigins === '*') {
      corsHeaders['Access-Control-Allow-Origin'] = '*'
    } else {
      const allowed = allowedOrigins.split(',').map((s) => s.trim())
      if (allowed.includes(origin)) {
        corsHeaders['Access-Control-Allow-Origin'] = origin
      }
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders })
    }

    if (!env.GEMINI_API_KEY) {
      return Response.json({ error: 'Server not configured: missing API key' }, { status: 500, headers: corsHeaders })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders })
    }

    const { image, mimeType } = body
    if (!image || typeof image !== 'string') {
      return Response.json({ error: 'Missing "image" field (base64)' }, { status: 400, headers: corsHeaders })
    }

    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [{
            parts: [
              { text: 'Extract Chinese characters from this image.' },
              {
                inline_data: {
                  mime_type: mimeType || 'image/png',
                  data: image,
                },
              },
            ],
          }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 1024,
            thinkingConfig: { thinkingBudget: 1024 },
          },
        }),
      })

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text().catch(() => '')
        return Response.json(
          { error: `Gemini API error (${geminiResponse.status}): ${errorText}` },
          { status: geminiResponse.status === 429 ? 429 : 502, headers: corsHeaders },
        )
      }

      const geminiData = await geminiResponse.json()
      const parts = geminiData?.candidates?.[0]?.content?.parts || []
      const text = parts.filter((p) => !p.thought).map((p) => p.text).join('\n')

      return Response.json({ text: text.trim() }, { headers: corsHeaders })
    } catch (error) {
      return Response.json(
        { error: `Proxy error: ${error instanceof Error ? error.message : 'unknown'}` },
        { status: 502, headers: corsHeaders },
      )
    }
  },
}
