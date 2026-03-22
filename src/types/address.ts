export interface Province {
  id: number
  name_th: string
  name_en: string
  geography_id: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface District {
  id: number
  name_th: string
  name_en: string
  province_id: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface SubDistrict {
  id: number
  zip_code: number | string | null
  name_th: string
  name_en: string
  district_id: number
  lat: number | null
  long: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PersonAddress {
  id: string
  person_id: string
  house_no: string | null
  house_registry_no: string | null
  moo: string | null
  soi: string | null
  road: string | null
  building: string | null
  province: string | null
  province_code: string | null
  district: string | null
  district_code: string | null
  subdistrict: string | null
  subdistrict_code: string | null
  postal_code: string | null
  is_house_registered: boolean
  is_current: boolean
  is_retired_residence: boolean
  created_at: string
  updated_at: string | null
}

export interface AddressDatasetRow {
  id: string
  person_addresses: PersonAddress[]
}

export interface AddressDatasetResponse {
  data: AddressDatasetRow[]
  page: number
  per_page: number
  total_pages: number
  total_rows: number
}
