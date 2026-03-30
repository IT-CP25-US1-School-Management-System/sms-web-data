// Document Request Types
export interface DocumentRequest {
  id: string
  person_id: string
  title?: string
  document_type: string | null
  description?: string
  start_date?: string | null
  end_date?: string | null
  quantity?: number | null
  status?: 'กำลังดำเนินการ' | 'อนุมัติ' | 'ไม่อนุมัติ' | null
  created_at: string
  updated_at?: string | null

  // Joined data from person_data table
  person_data?: PersonData[]
  // Joined data from logs and links
  approval_logs?: ApprovalLog[]
  document_links?: DocumentLink[]
  request_general?: RequestGeneral[]
  request_general_documents?: RequestGeneral[]
  request_history?: RequestHistory[]
  request_history_changes?: RequestHistory[]
  request_education_records?: RequestEducationRecords[]
  request_education_records_changes?: RequestEducationRecords[]
}

export interface PersonData {
  id: string
  first_name_th: string
  middle_name_th?: string
  last_name_th: string
  first_name_en: string
  middle_name_en?: string
  last_name_en: string
  gender?: string
  personal_email?: string
  phone?: string
  prefix_id?: string | number
  role_id?: string
  is_government?: boolean
  [key: string]: any
}

export interface ApprovalLog {
  id: string
  request_id: string
  approver_id: string
  action: 'อนุมัติ' | 'ไม่อนุมัติ' | 'กำลังดำเนินการ'
  comment?: string
  created_at: string
}

export interface DocumentLink {
  document_key: string
  entity_table: string
  entity_id: string
  purpose?: string
  person_id?: string
  created_at: string
}

export interface RequestEducationRecords {
  id: string
  request_id: string
  education_level: string
  qualification: string
  qualification_name: string
  major_group: string
  minor_group?: string | null
  institution: string
  country: string
  start_date: string
  graduation_date: string
  honor_type?: string | null
  is_used_for_first_appointment?: boolean | null
  is_highest_degree?: boolean | null
  is_meets_position_standard?: boolean | null
  is_recognized_by_kksa?: boolean | null
  is_recognized_by_ocsc?: boolean | null
}

export interface RequestGeneral {
  id: string
  request_id: string
  salary_cert_qty?: number | null
  work_cert_qty?: number | null
  rights_auth_bank?: string | null
  rights_auth_qty?: number | null
  salary_info?: string | null
  academic_allowance?: string | null
  compensation_allowance?: string | null
}

export interface RequestHistory {
  id: string
  request_id: string
  is_qualification_added?: boolean | null
  is_marriage_registered?: boolean | null
  is_divorce_registered?: boolean | null
  rights_auth_bank?: string | null
  rights_auth_qty?: number | null
}

// API Response Types
export interface DocumentRequestListResponse {
  data: DocumentRequest[]
  page: number
  per_page: number
  total: number
}

export interface DocumentRequestResponse {
  data: DocumentRequest
}

export interface ApprovalLogListResponse {
  data: ApprovalLog[]
  page: number
  per_page: number
  total: number
}
