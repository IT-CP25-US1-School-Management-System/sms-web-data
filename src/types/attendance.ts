import type { PersonData } from '@/types/teacher'

export type AttendanceStatus =
  | 'present'
  | 'business_trip'
  | 'sick_leave'
  | 'personal_leave'
  | 'late'
  | 'official_help'
  | 'other'

export interface DailyAttendanceRecord {
  id: string
  person_id: string
  date: string
  status: AttendanceStatus
  check_in_time?: string | null
  remark?: string | null
  created_at: string
  updated_at?: string | null
  person_data?: Pick<PersonData, 'prefix_id' | 'first_name_th' | 'last_name_th'> | null
}

export interface DailyAttendanceCreateDTO {
  id: string
  person_id: string
  date: string
  status: AttendanceStatus
  check_in_time: string | null
  remark: string | null
  created_at: string
  updated_at: string | null
}
