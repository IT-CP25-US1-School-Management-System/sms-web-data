import { getPrefixName } from '@/lib/helpers'
import type { DocumentRequest, PersonData } from '@/types/document_request'

export function documentRequestPerson(
  request: Pick<DocumentRequest, 'person_data'> | null | undefined,
): PersonData | undefined {
  const person = request?.person_data
  if (!person) return undefined
  return Array.isArray(person) ? person[0] : person
}

export function documentRequestFullName(
  request: Pick<DocumentRequest, 'person_data'> | null | undefined,
): string {
  const person = documentRequestPerson(request)
  if (!person) return '-'
  const givenName = `${getPrefixName(person.prefix_id)}${person.first_name_th || ''}`.trim()
  return [givenName, person.middle_name_th, person.last_name_th].filter(Boolean).join(' ') || '-'
}
