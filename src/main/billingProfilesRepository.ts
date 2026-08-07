import { randomUUID } from 'crypto'
import { getData, persist } from './store'
import type { BillingProfile, BillingProfileInput } from '../shared/types'

export function listBillingProfiles(): BillingProfile[] {
  const data = getData()
  return [...data.billingProfiles].sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }))
}

export function getBillingProfile(id: string): BillingProfile | null {
  const data = getData()
  return data.billingProfiles.find((p) => p.id === id) ?? null
}

export function getDefaultBillingProfile(): BillingProfile | null {
  const data = getData()
  return data.billingProfiles.find((p) => p.parDefaut) ?? data.billingProfiles[0] ?? null
}

export function createBillingProfile(input: BillingProfileInput): BillingProfile {
  const data = getData()
  const now = new Date().toISOString()

  // Un seul profil par défaut à la fois.
  if (input.parDefaut) {
    data.billingProfiles.forEach((p) => (p.parDefaut = false))
  }
  // Le tout premier profil créé devient automatiquement le profil par défaut.
  const isFirst = data.billingProfiles.length === 0

  const profile: BillingProfile = {
    id: randomUUID(),
    nom: input.nom,
    statutJuridique: input.statutJuridique,
    raisonSociale: input.raisonSociale,
    siret: input.siret,
    tvaIntracom: input.tvaIntracom,
    regimeTva: input.regimeTva,
    adresse: input.adresse,
    codePostal: input.codePostal,
    ville: input.ville,
    pays: input.pays || 'France',
    telephone: input.telephone,
    email: input.email,
    iban: input.iban,
    bic: input.bic,
    logo: input.logo ?? null,
    prefixeFacture: input.prefixeFacture || 'FA-',
    prochainNumeroFacture: input.prochainNumeroFacture || 1,
    prefixeDevis: input.prefixeDevis || 'DE-',
    prochainNumeroDevis: input.prochainNumeroDevis || 1,
    conditionsPaiementParDefaut: input.conditionsPaiementParDefaut,
    mentionsLegales: input.mentionsLegales,
    parDefaut: input.parDefaut || isFirst,
    createdAt: now,
    updatedAt: now
  }

  data.billingProfiles.push(profile)
  persist()

  return profile
}

export function updateBillingProfile(id: string, input: BillingProfileInput): BillingProfile | null {
  const data = getData()
  const index = data.billingProfiles.findIndex((p) => p.id === id)
  if (index === -1) return null

  if (input.parDefaut) {
    data.billingProfiles.forEach((p) => (p.parDefaut = false))
  }

  const existing = data.billingProfiles[index]
  const updated: BillingProfile = {
    ...existing,
    nom: input.nom,
    statutJuridique: input.statutJuridique,
    raisonSociale: input.raisonSociale,
    siret: input.siret,
    tvaIntracom: input.tvaIntracom,
    regimeTva: input.regimeTva,
    adresse: input.adresse,
    codePostal: input.codePostal,
    ville: input.ville,
    pays: input.pays || 'France',
    telephone: input.telephone,
    email: input.email,
    iban: input.iban,
    bic: input.bic,
    logo: input.logo ?? null,
    prefixeFacture: input.prefixeFacture || existing.prefixeFacture,
    prochainNumeroFacture: input.prochainNumeroFacture ?? existing.prochainNumeroFacture,
    prefixeDevis: input.prefixeDevis || existing.prefixeDevis,
    prochainNumeroDevis: input.prochainNumeroDevis ?? existing.prochainNumeroDevis,
    conditionsPaiementParDefaut: input.conditionsPaiementParDefaut,
    mentionsLegales: input.mentionsLegales,
    parDefaut: input.parDefaut || existing.parDefaut,
    updatedAt: new Date().toISOString()
  }

  data.billingProfiles[index] = updated

  // Si celui-ci devient le défaut, s'assurer qu'aucun autre ne l'est.
  if (updated.parDefaut) {
    data.billingProfiles.forEach((p) => {
      if (p.id !== id) p.parDefaut = false
    })
  }

  persist()

  return updated
}

export function deleteBillingProfile(id: string): void {
  const data = getData()
  data.billingProfiles = data.billingProfiles.filter((p) => p.id !== id)
  // Si le profil supprimé était le défaut, on en réassigne un autre.
  if (data.billingProfiles.length > 0 && !data.billingProfiles.some((p) => p.parDefaut)) {
    data.billingProfiles[0].parDefaut = true
  }
  persist()
}

/**
 * Réserve le prochain numéro pour un type de document donné et incrémente le
 * compteur du profil. Le numéro est formaté avec le préfixe du profil.
 * Fait exprès de ne réserver qu'au moment de la création réelle du document
 * (pas à l'ouverture du formulaire) pour éviter les trous de numérotation si
 * l'utilisateur annule la création.
 */
export function reserveNextNumero(profileId: string, type: 'devis' | 'facture'): string {
  const data = getData()
  const profile = data.billingProfiles.find((p) => p.id === profileId)
  if (!profile) throw new Error('Profil de facturation introuvable')

  if (type === 'facture') {
    const numero = `${profile.prefixeFacture}${String(profile.prochainNumeroFacture).padStart(3, '0')}`
    profile.prochainNumeroFacture += 1
    persist()
    return numero
  } else {
    const numero = `${profile.prefixeDevis}${String(profile.prochainNumeroDevis).padStart(3, '0')}`
    profile.prochainNumeroDevis += 1
    persist()
    return numero
  }
}
