export interface SubDistricts {
  id: number
  zip_code: string
  name_th: string
  name_en: string
  district_id: number
  lat: number
  long: number
  created_at: string
  updated_at: string
  deleted_at: string
}
export interface Districts {
  id: number
  name_th: string
  name_en: string
  province_id: number
  created_at: string
  updated_at: string
  deleted_at: string
  sub_districts:SubDistricts[]
}
export interface Province {
  id: number
  name_th: string
  name_en: string
  geography_id: number
  created_at: string
  updated_at: string
  deleted_at: string
  districts:Districts[]
}
export interface AddressRowResponse<T = Record<string, any>> {
  data: T
}


