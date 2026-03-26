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
  PA_DOCUMENT:'การส่งเอกสาร PA',
  EVALUATION_PA: 'การประเมิน PA',
  TRACK_DOCUMENTS: 'ติดตามคำร้อง',
  EDUCATION: 'ข้อมูลการศึกษา',
  PROFESSIONAL_LICENSE: 'ใบประกอบวิชาชีพ',
  MANAGE_TEACHERS: 'ManageTeachers',
  ADD_TEACHER: 'AddTeacher',
  ADD_TEACHER_PERSONAL: 'AddTeacherPersonal',
  ADD_TEACHER_ADDRESS: 'AddTeacherAddress',
  ADD_TEACHER_FAMILY: 'AddTeacherFamily',
  ADD_TEACHER_EDUCATION: 'AddTeacherEducation',
  ADD_TEACHER_PROFESSIONAL_LICENSE: 'AddTeacherProfessionalLicense',
  ADD_TEACHER_POSITION_HISTORY: 'AddTeacherPositionHistory',
  ADD_TEACHER_ROYAL_DECORATIONS: 'AddTeacherRoyalDecorations',
  ADD_TEACHER_ACADEMIC_RANK: 'AddTeacherAcademicRank',
  ADD_TEACHER_EMPLOYMENT: 'AddTeacherEmployment',
  ADD_TEACHER_CONTRACT_POSITION: 'AddTeacherContractPosition',
  ADD_TEACHER_TRAINING: 'AddTeacherTraining',
  ADD_TEACHER_INNOVATIONS: 'AddTeacherInnovations',
  MANAGE_STUDENTS: 'ManageStudents',
  IMPORT_DATA: 'ImportData',
  REQUEST_LIST: 'RequestList',
  REQUEST_EDIT: 'RequestEdit',
} as const

export const DATASET_SENSITIVITY = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
  RESTRICTED: 'restricted',
} as const

export type DatasetSensitivity = (typeof DATASET_SENSITIVITY)[keyof typeof DATASET_SENSITIVITY]

export const PREFIX_OPTIONS = {
  1: 'นาย',
  2: 'นาง',
  3: 'นางสาว',
} as const

export type PrefixType = keyof typeof PREFIX_OPTIONS
