// Redimensionne une image uploadée (logo de société) côté renderer avant de
// l'envoyer au main process pour stockage : tout est gardé en JSON local
// (msam-data.json), donc mieux vaut éviter d'y stocker un original de
// plusieurs Mo. Les SVG sont vectoriels, on les garde tels quels.

export async function fileToResizedDataUrl(file: File, maxDim = 320): Promise<string> {
  if (file.type === 'image/svg+xml') {
    const text = await file.text()
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(text)))}`
  }

  const original = await readFileAsDataUrl(file)
  const img = await loadImage(original)

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return original

  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/png')
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image illisible'))
    img.src = src
  })
}
