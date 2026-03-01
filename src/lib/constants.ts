import { env } from './env'

export const API_BASE_URL = env.API_BASE_URL

export const ROUTE_NAMES = {
  LOGIN: 'Login',
  SETTINGS: 'Settings',
  HOME: 'Home',
  PROFILE: 'Profile',
  PERSONAL: 'Personal',
  PERSONAL_INFO: 'personal-information',
  ADDRESS_INFO: 'address-information',
  FAMILY_INFO: 'family-information',
  EDUCATION_INFO: 'education-information',
  PROFESSIONAL_LICENSE_INFO: 'professional-license-information',
} as const

export const DATASET_SENSITIVITY = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
  RESTRICTED: 'restricted',
} as const

export type DatasetSensitivity = (typeof DATASET_SENSITIVITY)[keyof typeof DATASET_SENSITIVITY]
