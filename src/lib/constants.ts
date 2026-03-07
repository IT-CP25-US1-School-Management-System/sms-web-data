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
  PERSONAL_DETAILS: 'personal-details',
  ADDRESS: 'address',
  FAMILY: 'family',
  POSITION_HISTORY: 'position-history',
  ACADEMIC_RANK_HISTORY: 'academic-rank-history',
  ROYAL_DECORATIONS: 'royal-decorations',
  EMPLOYMENT: 'employment',
  CONTRACT_POSITION: 'contract-position',
  TRAINING: 'training',
  ACHIEVEMENTS_INNOVATIONS: 'achievements-innovations',
  SUBMIT_DOCUMENTS: 'submit-documents',
  TRACK_DOCUMENTS: 'track-documents',
  EDUCATION: 'education',
  PROFESSIONAL_LICENSE: 'professional-license',
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
