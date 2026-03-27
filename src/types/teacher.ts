/**
 * Teacher/Person data types matching database schema
 */

export type Gender = 'ชาย' | 'หญิง' | 'อื่นๆ'
export type BloodType = 'A' | 'B' | 'AB' | 'O'

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
  prefix_id: number | string
  role_id: string
  is_government: boolean | string // ข้าราชการ หรือ ครูอัตราจ้าง (API returns as string "true"/"false")
  
  first_name_th: string
  middle_name_th?: string
  last_name_th: string
  
  first_name_en?: string
  middle_name_en?: string
  last_name_en?: string
  
  national_id?: string // เลขบัตรประชาชน
  passport_id?: string // เลขpassport
  department_id?: number

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
  line_id?: string // ไลน์ไอดี
  marital_status?: string // สถานะภาพ เช่น สมรส โสด หย่า ร้าง และ หม้าย
  spouse_name?: string // ชื่อคู่สมรส
  
  // Relations (loaded from API when needed)
  governments?: Government[] // มีเมื่อเป็นข้าราชการ
  employment_contract?: EmploymentContract[] // มีเมื่อเป็นครูอัตราจ้าง
  prefixes?: {
    prefixes_name_th: string
    prefixes_name_en: string
  }
  created_at: string
  updated_at?: string
}

export interface FamilyMember {
  id: string
  person_id: string
  relation_type: string
  prefix_id: number
  first_name_th: string
  middle_name_th?: string
  last_name_th: string
  former_last_name_th?: string
  national_id?: string
  gender?: Gender
  is_alive: boolean
  birth_date?: string
  phone?: string
  email?: string
  marital_status?: string
  is_emergency_contact?: boolean
  house_no?: string
  moo?: string
  building?: string
  soi?: string
  road?: string
  subdistrict_code?: string
  subdistrict?: string
  district_code?: string
  district?: string
  province_code?: string
  province?: string
  postal_code?: string
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
  id?: string
  prefix_id: number | string
  role_id: string
  is_government: boolean | string
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
  physical_status?: string
  marital_status?: string
  spouse_name?: string
  appointment_type_id?: number
  created_at?: string
  updated_at?: string
}

export interface TeacherUpdateDTO extends Partial<TeacherCreateDTO> {}

export interface PersonAddressCreateDTO {
  id?: string
  person_id: string
  house_registry_no?: string
  house_no?: string
  moo?: string
  building?: string
  soi?: string
  road?: string
  subdistrict_code?: string
  subdistrict?: string
  district_code?: string
  district?: string
  province_code?: string
  province?: string
  postal_code?: string
  is_house_registered?: boolean
  is_current?: boolean
  is_retired_residence?: boolean
  created_at?: string
  updated_at?: string
}

export interface FamilyMemberCreateDTO {
  person_id: string
  relation_type: string
  prefix_id?: number
  first_name_th: string
  middle_name_th?: string
  last_name_th: string
  former_last_name_th?: string
  national_id?: string
  gender?: string
  is_alive?: boolean
  birth_date?: string
  phone?: string
  email?: string
  marital_status?: string
  is_emergency_contact?: boolean
  house_no?: string
  moo?: string
  building?: string
  soi?: string
  road?: string
  subdistrict?: string
  district?: string
  province?: string
  postal_code?: string
}

export interface EducationRecordCreateDTO {
  person_id: string
  education_level: string
  qualification: string
  major_group?: string
  minor_group?: string
  institution: string
  country: string
  start_date?: string
  graduation_date?: string
  honor_type?: string
  is_used_for_first_appointment?: boolean
  is_highest_degree?: boolean
  is_meets_position_standard?: boolean
  is_recognized_by_kksa?: boolean
  is_recognized_by_ocsc?: boolean
}

export interface ProfessionalLicenseCreateDTO {
  person_id: string
  license_type: string
  license_no: string
  issue_date: string
  expiry_date: string
}
