/**
 * Student data types matching database schema
 */

export type Gender = 'ชาย' | 'หญิง' | 'อื่นๆ'
export type BloodType = 'A' | 'B' | 'AB' | 'O'

export interface Student {
  id: string
  student_id: string // เลขประจำตัวนักเรียน
  grade_level: string // ชั้น เช่น "ม.1"
  class_section: string // ห้อง เช่น "1"
  academic_track?: string // สายการเรียน
  student_type?: string // ประเภทนักเรียน
  
  prefixe_id: string
  first_name_th: string
  last_name_th: string
  first_name_en?: string
  last_name_en?: string
  
  date_of_birth?: string
  age_years: number
  birth_province?: string
  weight_kg?: number
  height_cm?: number
  blood_type?: BloodType
  gender?: Gender
  religion?: string // ศาสนา
  ethnicity?: string // เชื้อชาติ
  nationality?: string // สัญชาติ
  phone_number?: string
  marital_status?: string // สถานภาพสมรส
  
  address_id: string
  created_at: string
  updated_at: string
}

export interface Address {
  id: string
  student_id: string
  house_registry_no?: string // รหัสทะเบียนบ้าน
  house_no?: string // บ้านเลขที่
  moo?: string // หมู่ที่
  building?: string // หมู่บ้าน/อาคาร
  soi?: string // ตรอก/ซอย
  road?: string // ถนน
  subdistrict_code?: string
  subdistrict?: string // ตำบล/แขวง
  district_code?: string
  district?: string // อำเภอ/เขต
  province_code?: string
  province?: string // จังหวัด
  postal_code?: string // รหัสไปรษณีย์
  
  is_house_registered?: boolean // ที่อยู่ตามทะเบียนบ้าน
  is_current?: boolean // ที่อยู่ปัจจุบัน
  created_at: string
  updated_at: string
}

export interface Parent {
  id: string
  student_id: string
  prefixe_id: string
  first_name_th: string
  last_name_th: string
  first_name_en?: string
  last_name_en?: string
  occupation?: string // อาชีพ
  phone_number?: string
  relation: string // ความสัมพันธ์ พ่อ แม่ ผู้ปกครอง
  created_at: string
  updated_at: string
}

// For creating/updating students
export interface StudentCreateDTO {
  student_id: string
  grade_level: string
  class_section: string
  prefixe_id: string
  first_name_th: string
  last_name_th: string
  first_name_en?: string
  last_name_en?: string
  age_years: number
  address_id: string
  academic_track?: string
  student_type?: string
  date_of_birth?: string
  birth_province?: string
  weight_kg?: number
  height_cm?: number
  blood_type?: BloodType
  gender?: Gender
  religion?: string
  ethnicity?: string
  nationality?: string
  phone_number?: string
  marital_status?: string
}

export interface StudentUpdateDTO extends Partial<StudentCreateDTO> {}
