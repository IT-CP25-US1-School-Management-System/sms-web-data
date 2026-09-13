import { PA_ASSESSMENT_DATASET } from '@/lib/constants'
import {
  buildPAQuery,
  checkPAFilterResults,
  classifyPAFile,
  paRequestPerson,
  paSubjectGroup,
  paSubmissionYear,
} from '@/lib/pa'
import { getDatasetRowByKey } from '@/stores/dataset'
import { getDocumentRequests, getWebDocumentRequests } from '@/stores/document_request'
import { getFileDocumentRows } from '@/stores/document'
import { assertPADepartmentAccess } from '@/lib/paAccess'
import type { FileDocument } from '@/types/document'
import type { DatasetListResponse } from '@/types/dataset'
import type { PAData, PAAssessment, PADetail, PAListItem, PAListQuery, PARequest } from '@/types/pa'

export const PA_DETAIL_SOURCE = {
  datasetId: PA_ASSESSMENT_DATASET.DATASET_ID,
  version: PA_ASSESSMENT_DATASET.DATASET_VERSION,
  view: PA_ASSESSMENT_DATASET.VIEW,
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] || null : value || null
}

function joinedAssessment(request: PARequest | PAData) {
  return (
    firstRelation(request.request_committee_pa) || firstRelation(request.req_committee_pa) || null
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

export async function getWebPAList(query: PAListQuery): Promise<DatasetListResponse<PAListItem>> {
  const response = await getWebDocumentRequests(buildPAQuery(query))
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

export async function getPAData(id: string): Promise<PAData> {
  const response = await getDatasetRowByKey<PAData>(
    PA_DETAIL_SOURCE.datasetId,
    PA_DETAIL_SOURCE.version,
    id,
    PA_DETAIL_SOURCE.view,
  )
  if (!response.data || response.data.id !== id || !paRequestPerson(response.data)) {
    throw new Error('ไม่พบรายละเอียดการประเมิน PA')
  }
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

async function getPADetailFromData(
  request: PAData,
  item?: PAListItem,
  allowedDepartmentIds?: readonly number[],
): Promise<PADetail> {
  const assessment = joinedAssessment(request) || item?.assessment || null
  if (allowedDepartmentIds) assertPADepartmentAccess(request, allowedDepartmentIds, assessment)
  const person = paRequestPerson(request)
  if (!person) throw new Error('ไม่พบข้อมูลบุคคลของการประเมิน PA')
  const info = {
    person: person as PADetail['personInfo']['person'],
    education: Array.isArray(request.education_records)
      ? request.education_records
      : request.education_records
        ? [request.education_records]
        : [],
    licenses: Array.isArray(request.professional_licenses)
      ? request.professional_licenses
      : request.professional_licenses
        ? [request.professional_licenses]
        : [],
    governments: Array.isArray(request.governments)
      ? request.governments
      : request.governments
        ? [request.governments]
        : [],
    ranks: Array.isArray(request.academic_rank)
      ? request.academic_rank
      : request.academic_rank
        ? [request.academic_rank]
        : [],
  }
  const files = await getPAFiles(request)
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

export async function getPADetail(
  id: string,
  item?: PAListItem,
  allowedDepartmentIds?: readonly number[],
): Promise<PADetail> {
  const request = await getPAData(id)
  return getPADetailFromData(request, item, allowedDepartmentIds)
}

export async function getWebPADetail(
  id: string,
  item?: PAListItem,
  allowedDepartmentIds?: readonly number[],
): Promise<PADetail> {
  const request = await getPAData(id)
  return getPADetailFromData(request, item, allowedDepartmentIds)
}
