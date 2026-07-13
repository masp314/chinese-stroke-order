// Cloudflare Worker — AI text extraction proxy for Hanzi Steps
//
// Deploy: npx wrangler deploy server/worker.js --name hanzi-ai-proxy
// Set secret: npx wrangler secret put GEMINI_API_KEY
//
// Environment variable:
//   GEMINI_API_KEY — your Google Gemini API key
//   ALLOWED_ORIGINS — comma-separated allowed origins (optional, defaults to *)

const GEMINI_MODEL = 'gemini-3.5-flash'

const IMAGE_PROMPT = [
  'Extract Chinese characters from this image.',
  'RULES:',
  '- Output ONLY Chinese characters and Chinese punctuation.',
  '- One word or phrase per line.',
  '- Do NOT output any English, pinyin, numbers, explanations, comments, or descriptions.',
  '- Do NOT describe what you see. Do NOT say "partially visible" or anything similar.',
  '- If a character is unclear, make your best guess.',
  '- If there are no Chinese characters at all, output nothing.',
].join('\n')

const TRANSLATE_PROMPT = [
  'You are a Chinese-Japanese dictionary assistant.',
  'Given a Chinese word and its English definitions, provide:',
  '1. A concise Japanese translation (日本語訳)',
  '2. The part of speech in Japanese (品詞: 名詞、動詞、形容詞、副詞、etc.)',
  'Respond in JSON format: {"ja": "日本語訳", "pos": "品詞"}',
  'Keep the translation short and natural. No extra explanation.',
].join('\n')

function buildCorsHeaders(origin, allowedOrigins) {
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
  return corsHeaders
}

async function callGemini(apiKey, systemPrompt, userContent, options = {}) {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: userContent }],
      generationConfig: {
        temperature: options.temperature ?? 0,
        maxOutputTokens: options.maxOutputTokens ?? 1024,
        ...(options.thinkingBudget != null ? { thinkingConfig: { thinkingBudget: options.thinkingBudget } } : {}),
        ...(options.responseMimeType ? { responseMimeType: options.responseMimeType } : {}),
      },
    }),
  })
  return response
}

async function handleImageExtract(body, apiKey, corsHeaders) {
  const { image, mimeType } = body
  if (!image || typeof image !== 'string') {
    return Response.json({ error: 'Missing "image" field (base64)' }, { status: 400, headers: corsHeaders })
  }

  const response = await callGemini(apiKey, IMAGE_PROMPT, [
    { text: 'Extract Chinese characters from this image.' },
    { inline_data: { mime_type: mimeType || 'image/png', data: image } },
  ], { thinkingBudget: 1024 })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    return Response.json(
      { error: `Gemini API error (${response.status}): ${errorText}` },
      { status: response.status === 429 ? 429 : 502, headers: corsHeaders },
    )
  }

  const data = await response.json()
  const parts = data?.candidates?.[0]?.content?.parts || []
  const text = parts.filter((p) => !p.thought).map((p) => p.text).join('\n')
  return Response.json({ text: text.trim() }, { headers: corsHeaders })
}

async function handleTranslate(body, apiKey, corsHeaders) {
  const { word, definitions } = body.translate
  if (!word || !definitions?.length) {
    return Response.json({ error: 'Missing translate.word or translate.definitions' }, { status: 400, headers: corsHeaders })
  }

  const userText = `Chinese word: ${word}\nEnglish definitions: ${definitions.join('; ')}`
  const response = await callGemini(apiKey, TRANSLATE_PROMPT, [
    { text: userText },
  ], { maxOutputTokens: 256, thinkingBudget: 0 })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    return Response.json(
      { error: `Gemini API error (${response.status}): ${errorText}` },
      { status: response.status === 429 ? 429 : 502, headers: corsHeaders },
    )
  }

  const data = await response.json()
  const parts = data?.candidates?.[0]?.content?.parts || []
  const rawText = parts.filter((p) => !p.thought).map((p) => p.text).join('')

  try {
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return Response.json({ ja: parsed.ja || '', pos: parsed.pos || '' }, { headers: corsHeaders })
  } catch {
    return Response.json({ ja: '', pos: '' }, { headers: corsHeaders })
  }
}

export default {
  async fetch(request, env) {
    const allowedOrigins = env.ALLOWED_ORIGINS || '*'
    const origin = request.headers.get('Origin') || ''
    const corsHeaders = buildCorsHeaders(origin, allowedOrigins)

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

    try {
      if (body.translate) {
        return await handleTranslate(body, env.GEMINI_API_KEY, corsHeaders)
      }
      return await handleImageExtract(body, env.GEMINI_API_KEY, corsHeaders)
    } catch (error) {
      return Response.json(
        { error: `Proxy error: ${error instanceof Error ? error.message : 'unknown'}` },
        { status: 502, headers: corsHeaders },
      )
    }
  },
}
