// Document Request Types
export interface DocumentRequest {
  id: string
  person_id: string
  document_type: string
  title: string
  description?: string
  start_date?: string
  end_date?: string
  total_days?: number
  period_kind?: string
  bank_name?: string
  quantity: number | string
  status?: 'กำลังดำเนินการ' | 'อนุมัติ' | 'ไม่อนุมัติ' | null
  created_at: string
  updated_at?: string | null
  // Joined data from person_data table
  person_data?: PersonData[]
  // Joined data from logs and links
  approval_logs?: ApprovalLog[]
  document_links?: DocumentLink[]
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
  prefix_id?: number
  role_id?: string
  is_government?: boolean
  [key: string]: any
}

export interface ApprovalLog {
  id: string
  request_id: string
  approver_id: string
  action: 'อนุมัติ' | 'ไม่อนุมัติ' | 'ส่งกลับแก้ไข'
  comment?: string
  created_at: string
}

export interface DocumentLink {
  document_key: string
  entity_table: string
  entity_id: string
  purpose?: string
  created_by?: string
  created_at: string
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
