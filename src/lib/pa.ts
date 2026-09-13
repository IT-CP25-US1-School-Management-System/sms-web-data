import { formatThaiBuddhistDate } from '@/lib/helpers'
import { z } from 'zod'
import { getSubjectGroupName, subjectGroups } from '@/lib/subjectGroups'
import type {
  PAAssessment,
  PADetail,
  PAField,
  PAFileCategory,
  PAListQuery,
  PARequest,
} from '@/types/pa'
import type { DatasetListResponse, DatasetQueryParams } from '@/types/dataset'

export async function collectPAPages<T>(
  fetchPage: (page: number) => Promise<DatasetListResponse<T>>,
): Promise<T[]> {
  const rows: T[] = []
  let page = 1
  while (true) {
    const response = await fetchPage(page)
    const batch = response.data.flat() as T[]
    if (!Number.isInteger(response.total_pages) || !Number.isInteger(response.total_rows)) {
      throw new Error('ข้อมูลจำนวนหน้าจากระบบไม่ถูกต้อง')
    }
    rows.push(...batch)
    if (rows.length >= response.total_rows && page >= response.total_pages) break
    if (page >= response.total_pages || !batch.length)
      throw new Error('โหลดข้อมูลไม่ครบทุกหน้า กรุณาลองใหม่')
    page += 1
  }
  return rows
}

export const PA_DOCUMENT_TYPE = 'การประเมินPA'
export const PA_FILE_GROUPS: { id: PAFileCategory; label: string }[] = [
  { id: 'pa1', label: 'ข้อตกลง PA (PA1)' },
  { id: 'pa2-1', label: 'PA2 (กรรมการคนที่ 1 ผู้อำนวยการ)' },
  { id: 'pa2-2', label: 'PA2 (กรรมการคนที่ 2)' },
  { id: 'pa2-3', label: 'PA2 (กรรมการคนที่ 3)' },
  { id: 'pa3', label: 'PA3' },
  { id: 'other', label: 'ไฟล์ที่ยังไม่ระบุประเภท' },
]

export function paSubmissionYear(createdAt: string): string {
  const date = new Date(createdAt)
  if (!createdAt || Number.isNaN(date.getTime())) return 'ไม่ระบุปี'
  return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  })
    .format(date)
    .replace(/[^0-9]/g, '')
}

export function paYearOptions(now = new Date()): number[] {
  const currentYear = Number(paSubmissionYear(now.toISOString()))
  return Array.from({ length: 11 }, (_, index) => currentYear - index)
}

export function paLoadError(error: unknown): string {
  if (error instanceof PAFilterMismatchError) return error.message
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message
  if (typeof message === 'string' && message.startsWith('filter is not allowed:')) {
    return 'ชุดข้อมูลยังไม่อนุญาตตัวกรองที่เลือก กรุณาให้ผู้ดูแลเพิ่มเงื่อนไขใน where_allow ของ view document_requests'
  }
  return 'ไม่สามารถโหลดรายการประเมิน PA ได้ กรุณาลองใหม่'
}

export class PAFilterMismatchError extends Error {}

export function paRequestPerson(request: PARequest) {
  return Array.isArray(request.person_data) ? request.person_data[0] : request.person_data
}

export function checkPAFilterResults(requests: PARequest[], query: PAListQuery): void {
  for (const request of requests) {
    if (query.year !== undefined && paSubmissionYear(request.created_at) !== String(query.year)) {
      throw new PAFilterMismatchError(
        'ระบบส่งข้อมูลนอกปีที่เลือก กรุณาตรวจสอบตัวกรอง created_at ในชุดข้อมูล',
      )
    }
    if (query.departmentId !== undefined) {
      const departmentId = paRequestPerson(request)?.department_id
      if (
        departmentId !== null &&
        departmentId !== undefined &&
        Number(departmentId) !== query.departmentId
      ) {
        throw new PAFilterMismatchError(
          'ระบบคืน department_id ไม่ตรงกับกลุ่มสาระที่เลือก กรุณาตรวจสอบตัวกรองของชุดข้อมูล',
        )
      }
    }
    if (query.status !== undefined && (request.status || 'กำลังดำเนินการ') !== query.status) {
      throw new PAFilterMismatchError(
        'ระบบคืนสถานะไม่ตรงกับตัวกรองที่เลือก กรุณาตรวจสอบตัวกรอง status ในชุดข้อมูล',
      )
    }
  }
}

const paQuerySchema = z.object({
  page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  year: z.number().int().min(544).max(9998).optional(),
  departmentId: z
    .number()
    .int()
    .refine((id) => subjectGroups.some((group) => group.id === id))
    .optional(),
  status: z.enum(['กำลังดำเนินการ', 'อนุมัติ', 'ไม่อนุมัติ']).optional(),
  search: z.string().trim().optional(),
})

export function buildPAQuery(input: PAListQuery): DatasetQueryParams {
  const query = paQuerySchema.parse(input)
  const where: { table_name: string; field: string; operator: string; value: string | number }[][] =
    [
      [
        {
          table_name: 'document_requests',
          field: 'document_type',
          operator: '=',
          value: PA_DOCUMENT_TYPE,
        },
      ],
    ]
  if (query.departmentId !== undefined) {
    where.push([
      {
        table_name: 'person_data',
        field: 'department_id',
        operator: '=',
        value: query.departmentId,
      },
    ])
  }
  if (query.status !== undefined) {
    where.push([
      {
        table_name: 'document_requests',
        field: 'status',
        operator: '=',
        value: query.status,
      },
    ])
  }
  if (query.year !== undefined) {
    const year = query.year - 543
    // The deployed view rejects >=. One millisecond before the boundary lets >
    // include records created exactly at midnight on January 1.
    where.push([
      {
        table_name: 'document_requests',
        field: 'created_at',
        operator: '>',
        value: `${String(year - 1).padStart(4, '0')}-12-31T23:59:59.999+07:00`,
      },
    ])
    where.push([
      {
        table_name: 'document_requests',
        field: 'created_at',
        operator: '<',
        value: `${String(year + 1).padStart(4, '0')}-01-01T00:00:00+07:00`,
      },
    ])
  }
  if (query.search) {
    where.push(
      ['first_name_th', 'last_name_th'].map((field) => ({
        table_name: 'person_data',
        field,
        operator: 'LIKE',
        value: `%${query.search}%`,
      })),
    )
  }
  return {
    page: query.page,
    per_page: query.per_page,
    where,
    where_logical_operator: 'AND',
    sort_by: 'created_at',
    sort_order: 'desc',
  }
}

export function paSubjectGroup(request: PARequest, assessment?: PAAssessment | null): string {
  const departmentId =
    paRequestPerson(request)?.department_id ?? request.department_id ?? assessment?.department_id
  if (departmentId !== null && departmentId !== undefined && departmentId !== '') {
    return getSubjectGroupName(departmentId) || 'ไม่ระบุกลุ่มสาระการเรียนรู้'
  }
  return assessment?.subject_group?.trim() || 'ไม่ระบุกลุ่มสาระการเรียนรู้'
}

// Legacy uploads have the same purpose. Only recognize explicit category markers;
// upload order is not evidence of a file's category.
export function classifyPAFile(filename: string, purpose = ''): PAFileCategory {
  if (PA_FILE_GROUPS.some((group) => group.id === purpose)) return purpose as PAFileCategory
  const name = filename
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[ _]+/g, '-')
  if (/(?:^|-)pa1$/.test(name)) return 'pa1'
  if (/(?:^|-)pa3$/.test(name)) return 'pa3'
  const committee = name.match(/(?:^|-)pa2-กรรมการ-?([123])$/)
  if (committee) return `pa2-${committee[1]}` as PAFileCategory
  return 'other'
}

function display(value: string | number | null | undefined): string | number {
  return value === null || value === undefined || value === '' ? '-' : value
}

function latest<T>(items: T[], date: (item: T) => string | null | undefined): T | undefined {
  return [...items].sort((a, b) => (date(b) || '').localeCompare(date(a) || ''))[0]
}

export function paFields(detail: PADetail): PAField[] {
  const { person, education, licenses, governments, ranks } = detail.personInfo
  const assessment = detail.assessment
  const highest = education.filter((item) => String(item.is_highest_degree) === 'true')
  const degree = latest(highest, (item) => item.graduation_date)
  const government = latest(governments, (item) => item.updated_at || item.created_at)
  const rank = latest(
    ranks.filter(
      (item) =>
        !item.awarded_date ||
        item.awarded_date.slice(0, 10) <= new Date().toISOString().slice(0, 10),
    ),
    (item) => item.awarded_date,
  )
  const license = latest(licenses, (item) => item.expiry_date)
  const hours = assessment?.teaching_hours_per_week
  const rows: [string, string | number | null | undefined][] = [
    ['อีเมล', person.personal_email],
    ['ชื่อ - สกุล', detail.fullName],
    ['วันเดือนปีเกิด (พ.ศ.)', formatThaiBuddhistDate(person.birth_date)],
    ['กลุ่มสาระการเรียนรู้', detail.subjectGroup],
    ['ระดับการศึกษาสูงสุด', degree?.education_level],
    ['คุณวุฒิการศึกษา', degree?.qualification_name || degree?.qualification],
    ['วิชาเอกหรือสาขา', degree?.major_group],
    ['ชื่อสถานศึกษา', degree?.institution],
    ['วันที่สำเร็จการศึกษา', formatThaiBuddhistDate(degree?.graduation_date)],
    ['วันบรรจุ', formatThaiBuddhistDate(government?.government_entry_date)],
    ['วิทยฐานะปัจจุบัน', rank?.ranking_type],
    ['วันที่ได้รับแต่งตั้งวิทยฐานะปัจจุบัน', formatThaiBuddhistDate(rank?.awarded_date)],
    [
      'เงินเดือนปัจจุบัน',
      government?.salary ??
        latest(person.employment_contract || [], (item) => item.period_start)?.salary,
    ],
    ['เลขที่ใบอนุญาตประกอบวิชาชีพครู/ผู้บริหารสถานศึกษา', license?.license_no],
    ['วันหมดอายุใบอนุญาตประกอบวิชาชีพ', formatThaiBuddhistDate(license?.expiry_date)],
    [
      'ปฏิบัติการสอนชั้น/ระดับ',
      [assessment?.teaching_level_1, assessment?.teaching_level_2].filter(Boolean).join(' / '),
    ],
    ['รายวิชา', assessment?.subject_name],
    [
      'การสอนตามตารางสอน (ชั่วโมง/สัปดาห์)',
      hours !== null &&
      hours !== undefined &&
      String(hours) !== '' &&
      Number.isFinite(Number(hours))
        ? Math.floor(Number(hours))
        : undefined,
    ],
    [
      'งานส่งเสริมและสนับสนุนการจัดการเรียนรู้ (ชั่วโมง/สัปดาห์)',
      assessment?.support_hours_per_week,
    ],
    [
      'งานพัฒนาคุณภาพการศึกษาของสถานศึกษา (ชั่วโมง/สัปดาห์)',
      assessment?.dev_quality_hours_per_week,
    ],
    ['งานตอบสนองนโยบายและจุดเน้น (ชั่วโมง/สัปดาห์)', assessment?.policy_hours_per_week],
    ['รายชื่อคณะกรรมการประเมิน คนที่ 1', assessment?.committee_name_1],
    ['รายชื่อกรรมการผู้ประเมิน คนที่ 2', assessment?.committee_name_2],
    ['รายชื่อกรรมการผู้ประเมิน คนที่ 3', assessment?.committee_name_3],
  ]
  return rows.map(([label, value]) => ({ label, value: display(value) }))
}
