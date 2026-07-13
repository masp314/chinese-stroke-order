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
  'You are a Chinese text extractor for a children\'s language learning app.',
  'The user will send you a photo of a Chinese language worksheet, flashcard, or handwritten text.',
  'Extract ALL Chinese characters and words you can see in the image.',
  'Return ONLY the Chinese text, preserving the original order.',
  'If there are numbered items, keep them as separate lines but remove the numbers.',
  'Do not add translations, pinyin, explanations, or any non-Chinese text.',
  'If you cannot find any Chinese text, respond with an empty string.',
].join(' ')

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
          contents: [{
            parts: [
              { text: SYSTEM_PROMPT },
              {
                inline_data: {
                  mime_type: mimeType || 'image/png',
                  data: image,
                },
              },
            ],
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
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
      const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ''

      return Response.json({ text: text.trim() }, { headers: corsHeaders })
    } catch (error) {
      return Response.json(
        { error: `Proxy error: ${error instanceof Error ? error.message : 'unknown'}` },
        { status: 502, headers: corsHeaders },
      )
    }
  },
}
