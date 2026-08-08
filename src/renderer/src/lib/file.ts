// Conversion d'un fichier quelconque (scan de facture fournisseur : PDF ou
// image) en data URL pour stockage direct dans msam-data.json, sur le même
// principe que lib/image.ts pour le logo. Pas de redimensionnement possible
// ici (un PDF n'est pas une image), donc on se contente d'une limite de
// taille pour éviter de faire gonfler le fichier de données outre mesure.

const MAX_SIZE_BYTES = 8 * 1024 * 1024 // 8 Mo

export async function fileToDataUrl(file: File): Promise<string> {
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('Fichier trop volumineux (8 Mo maximum).')
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
