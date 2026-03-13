import { env } from './env'

export const API_BASE_URL = env.API_BASE_URL

export const ROUTE_NAMES = {
  LOGIN: 'Login',
  SETTINGS: 'Settings',
  HOME: 'Home',
  PROFILE: 'Profile',
  PERSONAL: 'Personal',
  WORK_HISTORY: 'WorkHistory',
  ACHIEVEMENTS: 'Achievements',
  DOCUMENTS: 'Documents',
  PERSONAL_DETAILS: 'ข้อมูลส่วนบุคคล',
  ADDRESS: 'ข้อมูลที่อยู่',
  FAMILY: 'ข้อมูลครอบครัว',
  POSITION_HISTORY: 'ข้อมูลการดำรงตำแหน่ง',
  ACADEMIC_RANK_HISTORY: 'ประวัติวิทยฐานะ',
  ROYAL_DECORATIONS: 'เครื่องราชอิสริยาภรณ์',
  EMPLOYMENT: 'ข้อมูลการจ้างงาน',
  CONTRACT_POSITION: 'ประวัติการดำรงตำแหน่ง',
  TRAINING: 'ข้อมูลการอบรม / ข้อมูลผลงาน',
  ACHIEVEMENTS_INNOVATIONS: 'ข้อมูลผลงาน / นวัตกรรม',
  SUBMIT_DOCUMENTS: 'ยื่นคำร้อง',
  TRACK_DOCUMENTS: 'ติดตามคำร้อง',
  EDUCATION: 'ข้อมูลการศึกษา',
  PROFESSIONAL_LICENSE: 'ใบประกอบวิชาชีพ',
  MANAGE_TEACHERS: 'ManageTeachers',
  MANAGE_STUDENTS: 'ManageStudents',
  IMPORT_DATA: 'ImportData',
  REQUESTS: 'Requests',
} as const

export const DATASET_SENSITIVITY = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
  RESTRICTED: 'restricted',
} as const

export type DatasetSensitivity = (typeof DATASET_SENSITIVITY)[keyof typeof DATASET_SENSITIVITY]
