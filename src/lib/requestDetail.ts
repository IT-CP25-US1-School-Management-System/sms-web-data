import { formatThaiBuddhistDate, formatThaiBuddhistDateTime } from '@/lib/helpers'
import type { ApprovalLog, DocumentRequest, RequestCommitteePA } from '@/types/document_request'

export type RequestDetailField = { label: string; value: string | number }
export type RequestDetailSection = { title: string; fields: RequestDetailField[] }

export function firstRequestRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] || null : value || null
}

export function requestRelationArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

export function requestDisplay(value: unknown): string | number {
  return value === null || value === undefined || value === '' ? '-' : String(value)
}

export function isRequestType(request: DocumentRequest | null | undefined, fragment: string) {
  return request?.document_type?.includes(fragment) ?? false
}

function booleanLabel(value: boolean | null | undefined) {
  if (value === true) return 'ใช่'
  if (value === false) return 'ไม่ใช่'
  return '-'
}

function quantityLabel(value: number | null | undefined) {
  return value && value > 0 ? `${value} ฉบับ` : 'ไม่ได้ขอ'
}

function bankLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    krungthai: 'ธนาคารกรุงไทย',
    bangkok: 'ธนาคารกรุงเทพ',
    kasikorn: 'ธนาคารกสิกรไทย',
    scb: 'ธนาคารไทยพาณิชย์',
    gsb: 'ธนาคารออมสิน',
  }
  return value ? labels[value] || value : '-'
}

function subjectGroupLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    thai: 'ภาษาไทย',
    math: 'คณิตศาสตร์',
    science: 'วิทยาศาสตร์และเทคโนโลยี',
    social: 'สังคมศึกษา ศาสนาและวัฒนธรรม',
    art: 'ศิลปะ',
    health: 'สุขศึกษาและพลศึกษา',
    career: 'การงานอาชีพ',
    foreign: 'ภาษาต่างประเทศ',
  }
  return value ? labels[value] || value : '-'
}

export function requestOverviewFields(request: DocumentRequest): RequestDetailField[] {
  const fields: RequestDetailField[] = [
    { label: 'ประเภทเอกสาร', value: requestDisplay(request.document_type) },
    { label: 'สถานะคำร้อง', value: requestDisplay(request.status || 'กำลังดำเนินการ') },
    { label: 'วันที่ส่งคำร้อง', value: formatThaiBuddhistDateTime(request.created_at) || '-' },
  ]
  if (request.title) fields.splice(1, 0, { label: 'หัวข้อคำร้อง', value: request.title })
  if (request.description) fields.splice(-1, 0, { label: 'รายละเอียด', value: request.description })
  if (request.quantity !== null && request.quantity !== undefined)
    fields.splice(-1, 0, { label: 'จำนวน', value: request.quantity })
  if (request.start_date)
    fields.splice(-1, 0, {
      label: 'วันที่เริ่มต้น',
      value: formatThaiBuddhistDate(request.start_date) || '-',
    })
  if (request.end_date)
    fields.splice(-1, 0, {
      label: 'วันสิ้นสุด',
      value: formatThaiBuddhistDate(request.end_date) || '-',
    })
  return fields
}

function paSection(pa: RequestCommitteePA): RequestDetailSection {
  return {
    title: 'รายละเอียดการประเมิน PA',
    fields: [
      { label: 'กลุ่มสาระ', value: subjectGroupLabel(pa.subject_group) },
      { label: 'ปฏิบัติการสอนชั้น/ระดับ', value: requestDisplay(pa.teaching_level_1) },
      { label: 'รายวิชา', value: requestDisplay(pa.subject_name) },
      { label: 'เงินเดือนปัจจุบัน', value: requestDisplay(pa.salary) },
      { label: 'การสอนตามตารางสอน', value: requestDisplay(pa.teaching_hours_per_week) },
      {
        label: 'งานส่งเสริมและสนับสนุนการจัดการเรียนรู้',
        value: requestDisplay(pa.support_hours_per_week),
      },
      { label: 'งานพัฒนาคุณภาพการศึกษา', value: requestDisplay(pa.dev_quality_hours_per_week) },
      { label: 'งานตอบสนองนโยบายและจุดเน้น', value: requestDisplay(pa.policy_hours_per_week) },
      { label: 'กรรมการคนที่ 1', value: requestDisplay(pa.committee_name_1) },
      { label: 'กรรมการคนที่ 2', value: requestDisplay(pa.committee_name_2) },
      { label: 'กรรมการคนที่ 3', value: requestDisplay(pa.committee_name_3) },
    ],
  }
}

export function requestDetailSection(request: DocumentRequest): RequestDetailSection | null {
  if (isRequestType(request, 'คำร้องขอเอกสาร')) {
    const detail =
      firstRequestRelation(request.request_general_documents) ||
      firstRequestRelation(request.request_general)
    if (!detail?.request_id) return null
    return {
      title: 'รายละเอียดคำร้องขอเอกสาร',
      fields: [
        { label: 'ใบรับรองเงินเดือน', value: quantityLabel(detail.salary_cert_qty) },
        { label: 'ใบรับรองการปฏิบัติงาน', value: quantityLabel(detail.work_cert_qty) },
        { label: 'ธนาคารรับสิทธิ', value: bankLabel(detail.rights_auth_bank) },
        { label: 'เอกสารหนังสือผ่านสิทธิ์', value: quantityLabel(detail.rights_auth_qty) },
        { label: 'ข้อมูลเงินเดือน', value: requestDisplay(detail.salary_info) },
        { label: 'เงินวิทยฐานะ', value: requestDisplay(detail.academic_allowance) },
        { label: 'เงินค่าตอบแทน', value: requestDisplay(detail.compensation_allowance) },
      ],
    }
  }
  if (isRequestType(request, 'เปลี่ยนแปลง')) {
    const detail =
      firstRequestRelation(request.request_history_changes) ||
      firstRequestRelation(request.request_history)
    if (!detail?.request_id) return null
    return {
      title: 'รายละเอียดแบบรายงานเปลี่ยนแปลง',
      fields: [
        { label: 'เพิ่มวุฒิการศึกษา', value: booleanLabel(detail.is_qualification_added) },
        { label: 'จดทะเบียนสมรส', value: booleanLabel(detail.is_marriage_registered) },
        { label: 'จดทะเบียนหย่า', value: booleanLabel(detail.is_divorce_registered) },
        { label: 'ธนาคารรับสิทธิ', value: bankLabel(detail.rights_auth_bank) },
        { label: 'เอกสารหนังสือผ่านสิทธิ์', value: quantityLabel(detail.rights_auth_qty) },
      ],
    }
  }
  if (isRequestType(request, 'เพิ่มวุ')) {
    const detail =
      firstRequestRelation(request.request_education_records_changes) ||
      firstRequestRelation(request.request_education_records)
    if (!detail?.request_id) return null
    return {
      title: 'รายละเอียดคำร้องขอเพิ่มวุฒิการศึกษา',
      fields: [
        { label: 'ระดับการศึกษา', value: requestDisplay(detail.education_level) },
        { label: 'วุฒิการศึกษา', value: requestDisplay(detail.qualification) },
        { label: 'ชื่อวุฒิการศึกษา', value: requestDisplay(detail.qualification_name) },
        { label: 'สาขาเอก', value: requestDisplay(detail.major_group) },
        { label: 'สาขาโท', value: requestDisplay(detail.minor_group) },
        { label: 'สถาบัน', value: requestDisplay(detail.institution) },
        { label: 'ประเทศ', value: requestDisplay(detail.country) },
        { label: 'วันที่เริ่มศึกษา', value: formatThaiBuddhistDate(detail.start_date) || '-' },
        {
          label: 'วันที่สำเร็จการศึกษา',
          value: formatThaiBuddhistDate(detail.graduation_date) || '-',
        },
        { label: 'เกียรตินิยม', value: requestDisplay(detail.honor_type) },
        { label: 'ใช้บรรจุครั้งแรก', value: booleanLabel(detail.is_used_for_first_appointment) },
        { label: 'เป็นวุฒิสูงสุด', value: booleanLabel(detail.is_highest_degree) },
        {
          label: 'ตรงตามมาตรฐานตำแหน่ง',
          value: booleanLabel(detail.is_meets_position_standard),
        },
        { label: 'ก.ค.ศ. รับรอง', value: booleanLabel(detail.is_recognized_by_kksa) },
        { label: 'ก.พ. รับรอง', value: booleanLabel(detail.is_recognized_by_ocsc) },
      ],
    }
  }
  if (isRequestType(request, 'การประเมินPA')) {
    const detail =
      firstRequestRelation(request.request_committee_pa) ||
      firstRequestRelation(request.req_committee_pa)
    return detail?.request_id ? paSection(detail) : null
  }
  return null
}

export function requestDetailMessage(request: DocumentRequest) {
  if (isRequestType(request, 'บัตรประจำตัว') || isRequestType(request, 'ต่างประเทศ'))
    return 'รายละเอียดของคำร้องประเภทนี้อยู่ในไฟล์แนบด้านล่าง'
  if (isRequestType(request, 'การส่งเอกสารPA')) return 'รายละเอียดการส่งเอกสารอยู่ในไฟล์แนบด้านล่าง'
  return 'ไม่พบข้อมูลรายละเอียดที่ผูกกับคำร้องนี้'
}

export function requestAttachmentTitle(request: DocumentRequest) {
  if (isRequestType(request, 'บัตรประจำตัว')) return 'เอกสารคำขอบัตรประจำตัว'
  if (isRequestType(request, 'ต่างประเทศ')) return 'เอกสารคำร้องขออนุญาตไปต่างประเทศ'
  if (isRequestType(request, 'เปลี่ยนแปลง')) return 'เอกสารประกอบแบบรายงานเปลี่ยนแปลง'
  if (isRequestType(request, 'เพิ่มวุ')) return 'เอกสารประกอบคำร้องขอเพิ่มวุฒิการศึกษา'
  if (isRequestType(request, 'การประเมินPA') || isRequestType(request, 'การส่งเอกสารPA'))
    return 'เอกสารประกอบการประเมิน PA'
  return 'ไฟล์แนบคำร้อง'
}

export function sortedApprovalLogs(request: DocumentRequest): ApprovalLog[] {
  return requestRelationArray(request.approval_logs).sort((a, b) =>
    (b.created_at || '').localeCompare(a.created_at || ''),
  )
}
