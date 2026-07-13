export interface AiExtractionResult {
  text: string
}

const USAGE_KEY = 'hanzi-steps.ai-usage.v1'
const DAILY_LIMIT = 3

interface UsageRecord {
  date: string
  count: number
}

function getUsage(): UsageRecord {
  try {
    const raw = localStorage.getItem(USAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as UsageRecord
      if (parsed.date === new Date().toDateString()) return parsed
    }
  } catch { /* ignore */ }
  return { date: new Date().toDateString(), count: 0 }
}

function incrementUsage() {
  const usage = getUsage()
  usage.count += 1
  try { localStorage.setItem(USAGE_KEY, JSON.stringify(usage)) } catch { /* ignore */ }
}

export function getAiUsageRemaining(): number {
  return Math.max(0, DAILY_LIMIT - getUsage().count)
}

export async function extractWithAi(
  file: File,
  proxyUrl: string,
  onProgress: (message: string) => void,
  unlimited = false,
): Promise<AiExtractionResult> {
  if (!unlimited) {
    const remaining = getAiUsageRemaining()
    if (remaining <= 0) {
      throw new Error(`Daily AI extraction limit reached (${DAILY_LIMIT}/day). Try again tomorrow or use Local OCR.`)
    }
  }

  onProgress('Preparing image for AI extraction…')
  const base64 = await fileToBase64(file)

  onProgress('Sending to AI…')
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64,
      mimeType: file.type || 'image/png',
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(
      response.status === 429
        ? 'AI extraction rate limit reached. Please try again later or use Local OCR.'
        : `AI extraction failed (${response.status}). ${body}`.trim(),
    )
  }

  const data = (await response.json()) as { text?: string; error?: string }
  if (data.error) throw new Error(data.error)
  if (!data.text) throw new Error('AI returned no text.')

  if (!unlimited) incrementUsage()
  return { text: data.text }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const commaIndex = result.indexOf(',')
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result)
    }
    reader.onerror = () => reject(new Error('Failed to read the file.'))
    reader.readAsDataURL(file)
  })
}
