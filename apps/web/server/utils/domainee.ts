// Domainee custom-domain / SSL provisioning.
// NOTE: the api.domainee.io contract is assumed from the phase spec and has not
// been verified against a live account — revisit when credentials are available.

interface DomaineeRegisterResponse {
  id: string
  domain: string
  status: 'pending' | 'active' | 'error'
}

const API_BASE = 'https://api.domainee.io/v1'

export async function registerDomain(domain: string): Promise<DomaineeRegisterResponse> {
  return await $fetch<DomaineeRegisterResponse>(`${API_BASE}/domains`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DOMAINEE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: { domain },
  })
}

export async function removeDomain(domain: string): Promise<void> {
  await $fetch(`${API_BASE}/domains/${domain}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${process.env.DOMAINEE_API_KEY}` },
  })
}
