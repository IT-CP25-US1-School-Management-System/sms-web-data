/**
 * Teacher/Person data types matching database schema
 */

export type Gender = 'ชาย' | 'หญิง' | 'อื่นๆ'
export type BloodType = 'A' | 'B' | 'AB' | 'O'

export interface Prefix {
  id: number
  name_th: string // คำนำหน้า เช่น นาย, นาง, นางสาว
  name_en: string // คำนำหน้า ENG เช่น MR, Miss, Mrs
}

export interface Role {
  id: string
  name: string // ครู/ครูผู้บริหาร, ครูผู้ช่วย, แม่บ้าน
  description?: string
}

export interface AppointmentType {
  id: number
  name: string // ประเภทการบรรจุ
  created_at: string
  updated_at?: string
}

export interface PersonData {
  id: string
  prefix_id: number
  role_id: string
  is_government: boolean // ข้าราชการ หรือ ครูอัตราจ้าง
  
  first_name_th: string
  middle_name_th?: string
  last_name_th: string
  
  first_name_en?: string
  middle_name_en?: string
  last_name_en?: string
  
  national_id?: string // เลขบัตรประชาชน
  passport_id?: string // เลขpassport
  
  gender?: Gender
  religion?: string // ศาสนา
  nationality?: string // สัญชาติ
  ethnicity?: string // เชื้อชาติ
  blood_type?: BloodType
  physical_status?: string // สถานภาพทางร่างกาย
  phone?: string
  personal_email?: string // อีเมลส่วนตัว
  birth_date?: string
  appointment_type_id?: number // ประเภทการบรรจุ
  
  marital_status?: string // สถานะภาพ เช่น สมรส โสด หย่า ร้าง และ หม้าย
  spouse_name?: string // ชื่อคู่สมรส
  
  // Relations (loaded from API when needed)
  governments?: Government[] // มีเมื่อเป็นข้าราชการ
  employment_contract?: EmploymentContract[] // มีเมื่อเป็นครูอัตราจ้าง
  
  created_at: string
  updated_at?: string
}

export interface Government {
  id: string
  person_id: string
  work_status: string // ทำงาน/ย้าย/เกษียณอายุราชการ/ช่วยราชการ/ลาออก/เสียชีวิต
  executive_group?: string // กลุ่มงาน เช่น งานบุคคล
  department_id?: number // กลุ่มสาระ
  
  salary?: number // เงินเดือน
  retirement_date?: string // วันเกษียณ
  government_entry_date?: string // วันเดือนปีเข้ารับราชการ
  direct_pay_no?: string // เลขที่จ่ายตรง
  position_number?: string // เลขที่ตำแหน่ง
  
  created_at: string
  updated_at?: string
}

export interface EmploymentContract {
  id: string
  person_id: string
  contract_action: string // ทำสัญญาครั้งแรก, ต่อสัญญา
  hiring_nature: string // จ้างใหม่, ต่อเนื่อง
  department_id?: number
  
  salary: number // เงินค่าจ้าง/เดือน
  social_security: string // มาตรา 33, 39, 40, อื่นๆ
  period_start: string
  period_end: string
  first_contract_start?: string
  
  order_no?: string
  contract_sequence?: number
  budget_type: string // เงินงบประมาณ, เงินรายได้สถานศึกษา
  school_revenue_type?: string // ลูกจ้างชั่วคราว, เหมาบริการ
  work_status: string // ทำงาน/ลาออก/ย้าย
  
  created_at: string
  updated_at?: string
}

// For API operations
export interface TeacherCreateDTO {
  prefix_id: number
  role_id: string
  is_government: boolean
  first_name_th: string
  last_name_th: string
  middle_name_th?: string
  first_name_en?: string
  middle_name_en?: string
  last_name_en?: string
  gender?: Gender
  phone?: string
  personal_email?: string
  birth_date?: string
  national_id?: string
  religion?: string
  nationality?: string
  ethnicity?: string
  blood_type?: BloodType
  marital_status?: string
  appointment_type_id?: number
}

export interface TeacherUpdateDTO extends Partial<TeacherCreateDTO> {}

// Simplified view for listing
export interface TeacherListItem {
  id: string
  first_name_th: string
  last_name_th: string
  is_government: boolean
  work_status?: string
}
