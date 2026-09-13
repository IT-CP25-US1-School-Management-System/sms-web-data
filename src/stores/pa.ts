import { DOCUMENT_EDIT, MANAGE_DATASETS } from '@/lib/constants'
import {
  buildPAQuery,
  checkPAFilterResults,
  classifyPAFile,
  collectPAPages,
  PA_DOCUMENT_TYPE,
  paRequestPerson,
  paSubjectGroup,
  paSubmissionYear,
} from '@/lib/pa'
import { getDatasetRows } from '@/stores/dataset'
import { getDocumentRequestById, getDocumentRequests } from '@/stores/document_request'
import { getFileDocumentRows } from '@/stores/document'
import { getEducationById, getTeacherById } from '@/stores/teachers'
import type { FileDocument } from '@/types/document'
import type { DatasetListResponse } from '@/types/dataset'
import type { Government, ProfessionalLicense } from '@/types/teacher'
import type {
  PAAcademicRank,
  PAAssessment,
  PADetail,
  PAListItem,
  PAListQuery,
  PAPersonInfo,
  PARequest,
} from '@/types/pa'

// Use the existing PA view. Deployments must grant manage admins read access to
// this view, or include request_committee_pa in the document_requests projection.
export const PA_DETAIL_SOURCE = {
  datasetId: DOCUMENT_EDIT.DATASET_ID,
  version: DOCUMENT_EDIT.DATASET_VERSION_COMMITTEE_PA,
  view: DOCUMENT_EDIT.VIEW_COMMITTEE_PA,
}

function joinedAssessment(request: PARequest) {
  return request.request_committee_pa?.[0] || request.req_committee_pa?.[0] || null
}

async function loadAssessments() {
  return collectPAPages((page) =>
    getDatasetRows<PAAssessment>(PA_DETAIL_SOURCE.datasetId, PA_DETAIL_SOURCE.version, {
      view: PA_DETAIL_SOURCE.view,
      page,
      per_page: 100,
    }),
  )
}

function listItem(request: PARequest, assessment: PAAssessment | null): PAListItem {
  const person = paRequestPerson(request)
  return {
    request,
    assessment,
    year: paSubmissionYear(request.created_at),
    subjectGroup: paSubjectGroup(request, assessment),
    fullName:
      [person?.first_name_th, person?.middle_name_th, person?.last_name_th]
        .filter(Boolean)
        .join(' ') || 'ไม่ระบุชื่อ',
  }
}

export async function getPAList(query: PAListQuery): Promise<DatasetListResponse<PAListItem>> {
  // One server request per table page; detail/file joins are loaded only on demand.
  const response = await getDocumentRequests(buildPAQuery(query))
  const requests = response.data as PARequest[]
  checkPAFilterResults(requests, query)
  const hasBrokenCount = requests.length > 0 && response.total_rows === 0
  const totalRows = hasBrokenCount
    ? (query.page - 1) * query.per_page + requests.length
    : response.total_rows
  const totalPages = hasBrokenCount
    ? requests.length < query.per_page
      ? query.page
      : query.page + 1
    : response.total_pages
  return {
    ...response,
    total_rows: totalRows,
    total_pages: totalPages,
    data: requests.map((request) => listItem(request, joinedAssessment(request))),
  }
}

async function personRows<T>(personId: string, version: string, view: string): Promise<T[]> {
  return collectPAPages((page) =>
    getDatasetRows<T>(MANAGE_DATASETS.DATASET_ID, version, {
      view,
      page,
      per_page: 100,
      where: [[{ table_name: view, field: 'person_id', operator: '=', value: personId }]],
    }),
  )
}

export async function getPAPersonInfo(personId: string): Promise<PAPersonInfo> {
  const [person, education, licenses, governments, ranks] = await Promise.all([
    getTeacherById(personId),
    getEducationById(personId),
    personRows<ProfessionalLicense>(
      personId,
      MANAGE_DATASETS.DATASET_VERSION_LICENSE,
      'professional_licenses',
    ),
    personRows<Government>(
      personId,
      MANAGE_DATASETS.DATASET_VERSION_POSITION_HISTORY,
      MANAGE_DATASETS.VIEW_POSITION_HISTORY,
    ),
    personRows<PAAcademicRank>(
      personId,
      MANAGE_DATASETS.DATASET_VERSION_ACADEMIC_RANK,
      'academic_rank',
    ),
  ])
  return {
    person: person.data,
    education: education.data.education_records || [],
    licenses,
    governments,
    ranks,
  }
}

export async function getPARequest(id: string): Promise<PARequest> {
  const response = await getDocumentRequestById(id)
  if (!response.data || response.data.document_type !== PA_DOCUMENT_TYPE)
    throw new Error('ไม่พบคำร้องการประเมิน PA')
  return response.data
}

export async function getPAFiles(request: PARequest) {
  const links = [
    ...new Map((request.document_links || []).map((link) => [link.document_key, link])).values(),
  ]
  return Promise.all(
    links.map(async (link) => {
      const response = await getFileDocumentRows<FileDocument>(link.document_key)
      if (!response.data) throw new Error('ไม่สามารถอ่านข้อมูลไฟล์แนบได้')
      return {
        link,
        resource: response.data,
        category: classifyPAFile(response.data.original_filename, link.purpose),
      }
    }),
  )
}

export async function getPADetail(
  id: string,
  item?: PAListItem,
  personInfo?: PAPersonInfo,
): Promise<PADetail> {
  const request = await getPARequest(id)
  let assessment = joinedAssessment(request) || item?.assessment || null
  if (!assessment)
    assessment = (await loadAssessments()).find((row) => row.request_id === id) || null
  const [info, files] = await Promise.all([
    personInfo || getPAPersonInfo(request.person_id),
    getPAFiles(request),
  ])
  return {
    ...listItem(request, assessment),
    personInfo: info,
    files,
    fullName: [
      info.person.prefixes?.prefixes_name_th,
      info.person.first_name_th,
      info.person.middle_name_th,
      info.person.last_name_th,
    ]
      .filter(Boolean)
      .join(' '),
  }
}
