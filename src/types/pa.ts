import type {
  DocumentLink,
  DocumentRequest,
  PersonData as RequestPersonData,
  RequestCommitteePA,
} from '@/types/document_request'
import type { EducationRecord, Government, PersonData, ProfessionalLicense } from '@/types/teacher'
import type { FileDocument } from '@/types/document'

export type PAFileCategory = 'pa1' | 'pa2-1' | 'pa2-2' | 'pa2-3' | 'pa3' | 'other'
export type PAStatus = Exclude<DocumentRequest['status'], null | undefined>

export interface PAAssessment extends Omit<RequestCommitteePA, 'subject_group'> {
  department_id?: number | string | null
  subject_group?: string | null
}

export interface PARequest extends Omit<DocumentRequest, 'person_data'> {
  department_id?: number | string | null
  person_data?: RequestPersonData | RequestPersonData[] | null
  req_committee_pa?: PAAssessment | PAAssessment[] | null
  request_committee_pa?: PAAssessment | PAAssessment[] | null
}

export interface PAData extends PARequest {
  academic_rank?: PAAcademicRank | PAAcademicRank[] | null
  education_records?: EducationRecord | EducationRecord[] | null
  governments?: Government | Government[] | null
  professional_licenses?: ProfessionalLicense | ProfessionalLicense[] | null
}

export interface PAListFilters {
  year?: number
  departmentId?: number
  departmentIds?: number[]
  status?: PAStatus
  search?: string
}

export interface PAListQuery extends PAListFilters {
  page: number
  per_page: number
}

export interface PAListItem {
  request: PARequest
  assessment: PAAssessment | null
  year: string
  subjectGroup: string
  fullName: string
}

export interface PAAcademicRank {
  id: string
  person_id: string
  ranking_type?: string
  awarded_date?: string | null
}

export interface PAPersonInfo {
  person: PersonData
  education: EducationRecord[]
  licenses: ProfessionalLicense[]
  governments: Government[]
  ranks: PAAcademicRank[]
}

export interface PAFile {
  link: DocumentLink
  resource: FileDocument
  category: PAFileCategory
}

export interface PADetail extends PAListItem {
  personInfo: PAPersonInfo
  files: PAFile[]
}

export interface PAField {
  label: string
  value: string | number
}
