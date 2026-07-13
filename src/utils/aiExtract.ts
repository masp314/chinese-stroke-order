export interface AiExtractionResult {
  text: string
}

export async function extractWithAi(
  file: File,
  proxyUrl: string,
  onProgress: (message: string) => void,
): Promise<AiExtractionResult> {
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
