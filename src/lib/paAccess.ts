import { paRequestPerson } from '@/lib/pa'
import { subjectGroups, type SubjectGroup } from '@/lib/subjectGroups'
import type { PAAssessment, PARequest } from '@/types/pa'

const PA_ROLE_DEPARTMENT: Record<string, number> = {
  'pa-art': 8,
  'pa-com': 9,
  'pa-career': 6,
  'pa-social': 4,
  'pa-health-pe': 7,
  'pa-guidance': 10,
  'pa-sci': 3,
  'pa-foreign': 5,
  'pa-thai': 1,
}

export const PA_WEB_ROLES = ['pa', ...Object.keys(PA_ROLE_DEPARTMENT)] as const

export function hasPAWebRole(roles: readonly string[] | null | undefined): boolean {
  return Boolean(
    roles?.some((role) => PA_WEB_ROLES.includes(role as (typeof PA_WEB_ROLES)[number])),
  )
}

export function paAllowedDepartmentIds(roles: readonly string[] | null | undefined): number[] {
  if (!roles?.length) return []
  if (roles.includes('pa')) return subjectGroups.map((group) => group.id)
  return [
    ...new Set(
      roles.map((role) => PA_ROLE_DEPARTMENT[role]).filter((id): id is number => id !== undefined),
    ),
  ]
}

export function paAllowedSubjectGroups(
  roles: readonly string[] | null | undefined,
): SubjectGroup[] {
  const allowed = new Set(paAllowedDepartmentIds(roles))
  return subjectGroups.filter((group) => allowed.has(group.id))
}

export function paRequestDepartmentId(
  request: PARequest,
  assessment?: PAAssessment | null,
): number | null {
  const requestAssessment =
    assessment ??
    (Array.isArray(request.request_committee_pa)
      ? request.request_committee_pa[0]
      : request.request_committee_pa) ??
    (Array.isArray(request.req_committee_pa)
      ? request.req_committee_pa[0]
      : request.req_committee_pa)
  const raw =
    paRequestPerson(request)?.department_id ??
    request.department_id ??
    requestAssessment?.department_id ??
    requestAssessment?.subject_group
  if (raw === null || raw === undefined || raw === '') return null
  const id = Number(raw)
  return Number.isInteger(id) && subjectGroups.some((group) => group.id === id) ? id : null
}

export class PAAccessError extends Error {}

export function assertPADepartmentAccess(
  request: PARequest,
  allowedDepartmentIds: readonly number[],
  assessment?: PAAssessment | null,
): void {
  const departmentId = paRequestDepartmentId(request, assessment)
  if (departmentId === null || !allowedDepartmentIds.includes(departmentId)) {
    throw new PAAccessError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลการประเมิน PA ของกลุ่มสาระนี้')
  }
}
