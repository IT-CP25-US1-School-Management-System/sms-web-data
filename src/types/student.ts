/**
 * Student data types matching database schema
 */

export type Gender = 'male' | 'female' | 'other'
export type BloodType = 'A' | 'B' | 'AB' | 'O'

export interface Address {
  id: string
  student_id: string
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
  occupation?: string
  phone_number?: string
  relation: string
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  student_id: string
  grade_level: string
  class_section: string
  academic_track?: string
  student_type?: string
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
  religion?: string
  ethnicity?: string
  nationality?: string
  phone_number?: string
  marital_status?: string
  address_id: string
  created_at: string
  updated_at: string
  addresses?: Address[] | Address
  address?: Address[] | Address
  parents?: Parent[]
  parent?: Parent[]
}

export interface StudentCreateDTO {
  id: string
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
  created_at: string
  updated_at?: string
}

export interface StudentUpdateDTO extends Partial<StudentCreateDTO> {
  id?: string
  updated_at?: string
}

export interface AddressCreateDTO {
  id?: string
  student_id: string
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
  created_at?: string
  updated_at?: string
}

export interface AddressUpdateDTO extends Partial<AddressCreateDTO> {
  id?: string
  updated_at?: string
}

export interface ParentCreateDTO {
  id?: string
  student_id: string
  prefixe_id: string
  first_name_th: string
  last_name_th: string
  first_name_en?: string
  last_name_en?: string
  occupation?: string
  phone_number?: string
  relation: string
  created_at?: string
  updated_at?: string
}

export interface ParentUpdateDTO extends Partial<ParentCreateDTO> {
  id?: string
  updated_at?: string
}
