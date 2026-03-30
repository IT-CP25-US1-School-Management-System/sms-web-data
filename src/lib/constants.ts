import { env } from './env'

export const API_BASE_URL = env.API_BASE_URL

export const ROUTE_NAMES = {
  LOGIN: 'Login',
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
  PA_DOCUMENT: 'การส่งเอกสาร PA',
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

export const DATASET_GET = {
  DATASET_ID: 'data_get_view',
  DATASET_VERSION: 'v1.0.6',
  DATASET_VERSION_LICENSE: 'v2.0.0',
  DATASET_VERSION_ACADEMIC_RANK: 'v2.1.2',
  DATASET_VERSION_CONTRACT_POSITION: 'v2.2.1',
  DATASET_VERSION_ROYAL_DECORATIONS: 'v2.3.1',
  DATASET_VERSION_INNOVATIONS: 'v2.4.2',
  DATASET_VERSION_TRAINING: 'v2.5.0',
} as const

export const DATASET_EDIT = {
  DATASET_ID: 'data_update_view',
  DATASET_VERSION_PERSONAL_DETAIL: 'v1.0.0',
  DATASET_VERSION_LICENSE: 'v1.3.2',
  DATASET_VERSION_FAMILY: 'v1.2.0',
  DATASET_VERSION_ADDRESS: 'v1.1.0',
  DATASET_VERSION_POSITION_HISTORY: 'v1.4.0',
  DATASET_VERSION_ACADEMIC_RANK: 'v1.5.1',
  DATASET_VERSION_CONTRACT_POSITION: 'v1.6.1',
  DATASET_VERSION_ROYAL_DECORATIONS: 'v1.7.0',
  DATASET_VERSION_INNOVATIONS: 'v1.8.1',
  DATASET_VERSION_TRAINING: 'v1.9.0',
  DATASET_VERSION_DEPARTMENT: 'v1.4.1',
} as const

export const DATASET_DELETE = {
  DATASET_ID: 'data_delete_view',
  DATASET_VERSION_LICENSE: 'v1.3.1',
  DATASET_VERSION_ACADEMIC_RANK: 'v1.4.0',
  DATASET_VERSION_CONTRACT_POSITION: 'v1.5.0',
  DATASET_VERSION_ROYAL_DECORATIONS: 'v1.6.0',
  DATASET_VERSION_INNOVATIONS: 'v1.7.1',
  DATASET_VERSION_TRAINING: 'v1.8.0',
} as const

export const REPORTING = {
  DATASET_ID: 'reporting',
  EXPORT_VERSION: 'v1.0.0',
} as const

export const DOCUMENT_EDIT = {
  DATASET_ID: 'document_create',
  DATASET_VERSION_DOCUMENT_LINK: 'v1.1.0',
  DATASET_VERSION_DOCUMENT_REQUEST: 'v1.0.0',
} as const

export const DOCUMENT_DELETE = {
  DATASET_ID: 'document_delete',
  DATASET_VERSION: 'v1.0.2',
} as const

export const MANAGE_DATASETS = {
  DATASET_ID: 'data_manage',
  DATASET_VERSION_ADDRESS: 'v2.0.1',
  DATASET_VERSION_FAMILY: 'v4.0.0',
  DATASET_VERSION_EDUCATION: 'v5.0.0',
  DATASET_VERSION_LICENSE: 'v6.1.0',
  DATASET_VERSION_ACADEMIC_RANK: 'v7.3.0',
  DATASET_VERSION_CONTRACT_POSITION: 'v8.2.0',
  DATASET_VERSION_POSITION_HISTORY: 'v9.0.0',
  DATASET_VERSION_DOCUMENT_LINK: 'v0.0.0',
  DATASET_VERSION_DOCUMENT_REQUEST: 'v3.0.2',
  VIEW_POSITION_HISTORY: 'governments',
  VIEW_CONTRACT_POSITION: 'history_position',
} as const

export const MANAGE_DROPDOWN_DATASETS = {
  DATASET_ID: 'data_get_dropdown',
  DATASET_VERSION_PREFIXES: 'v1.0.0',
  DATASET_VERSION_ROLES: 'v2.0.0',
  DATASET_VERSION_DEPARTMENTS: 'v3.0.0',
  DATASET_VERSION_APPOINTMENT_TYPES: 'v4.0.0',
  VIEW_APPOINTMENT_TYPES: 'appointment_types',
} as const

export const MANAGE_STUDENT_DATASETS = {
  DATASET_ID: 'data_student',
  DATASET_VERSION_STUDENT: 'v1.0.0',
  DATASET_VERSION_ADDRESS: 'v2.0.0',
  DATASET_VERSION_PARENT: 'v3.0.0',
} as const

export const MANAGE_APPROVAL_LOGS_DATASET = {
  DATASET_ID: 'capstone',
  DATASET_VERSION: 'v2.0.3',
} as const

export const MANAGE_ATTENDANCE_DATASET = {
  DATASET_ID: 'data_get_view',
  DATASET_VERSION: 'v2.6.0',
} as const

export const MANAGE_REPORTING_DATASETS = {
  DATASET_ID: 'data_get_view',
  DATASET_VERSION_REPORTING_TEMPLATE: 'v2.7.4',
  DATASET_VERSION_ATTENDANCE_REPORT_TEMPLATE: 'v2.7.5',
} as const

export const FILE_KEY_TEMPLATES = {
  DOCUMENT_TYPE_2: '3a68b6bf-4631-4835-a77f-eff8da31a796',
  DOCUMENT_TYPE_3: '074053f7-0e7a-4870-9091-84f0cd945aed',
  DOCUMENT_TYPE_4_1: 'cc01791c-658e-44ed-aa4a-ccb7be9418fe',
  DOCUMENT_TYPE_4_2: '99261424-7b09-48e9-820d-ffcb6115729c',
} as const

export type DatasetSensitivity = (typeof DATASET_SENSITIVITY)[keyof typeof DATASET_SENSITIVITY]
