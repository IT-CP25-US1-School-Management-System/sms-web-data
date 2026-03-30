import {
  DATASET_ID,
  DATASET_VERSION,
  getDatasetRows,
  getDatasetRowByKey,
  createDatasetRow,
  updateDatasetRow,
  deleteDatasetRow,
} from '@/stores/dataset'
import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import type { DatasetListResponse, DatasetRowResponse, DatasetQueryParams } from '@/types/dataset'
import type {
  PersonData,
  FamilyMember,
  TeacherCreateDTO,
  TeacherUpdateDTO,
  PersonAddressCreateDTO,
  FamilyMemberCreateDTO,
  EducationRecordCreateDTO,
  ProfessionalLicenseCreateDTO,
} from '@/types/teacher'
import type { PersonAddress } from '@/types/address'
import type { DailyAttendanceCreateDTO, DailyAttendanceRecord } from '@/types/attendance'

// TODO: Replace with the correct dataset IDs once configured in the DMS backend
const ADDRESS_DATASET_ID = 'data_manage'
const ADDRESS_DATASET_VERSION = 'v2.0.1'
const FAMILY_DATASET_ID = 'data_manage'
const FAMILY_DATASET_VERSION = 'v4.0.0'
const EDUCATION_DATASET_ID = DATASET_ID
const EDUCATION_DATASET_VERSION = 'v4.0.0'
const LICENSE_DATASET_ID = DATASET_ID
const LICENSE_DATASET_VERSION = 'v5.0.0'
const ATTENDANCE_DATASET_ID = 'data_get_view'
const ATTENDANCE_DATASET_VERSION = 'v2.6.0'

/**
 * Get list of teachers with pagination and filters
 */
export async function getTeachers(
  params?: DatasetQueryParams,
): Promise<DatasetListResponse<PersonData>> {
  return getDatasetRows<PersonData>(DATASET_ID, DATASET_VERSION, {
    ...params,
    view: 'personal_detail',
  })
}

/**
 * Get daily attendance / leave records with pagination and filters
 */
export async function getDailyAttendance(
  params?: DatasetQueryParams,
): Promise<DatasetListResponse<DailyAttendanceRecord>> {
  return getDatasetRows<DailyAttendanceRecord>(ATTENDANCE_DATASET_ID, ATTENDANCE_DATASET_VERSION, {
    ...params,
    view: 'daily_attendance',
  })
}

/**
 * Create a daily attendance row
 */
export async function createDailyAttendance(
  data: DailyAttendanceCreateDTO,
): Promise<DatasetRowResponse<DailyAttendanceRecord>> {
  return createDatasetRow<DailyAttendanceRecord>(
    ATTENDANCE_DATASET_ID,
    ATTENDANCE_DATASET_VERSION,
    data,
    'daily_attendance',
  )
}

/**
 * Get a single teacher by ID
 */
export async function getTeacherById(teacherId: string): Promise<DatasetRowResponse<PersonData>> {
  return getDatasetRowByKey<PersonData>(DATASET_ID, DATASET_VERSION, teacherId, 'personal_detail')
}

/**
 * Get address data for a single teacher by ID
 */
export async function getAddressById(
  teacherId: string,
): Promise<DatasetRowResponse<{ person_addresses?: PersonAddress[] }>> {
  return getDatasetRowByKey<{ person_addresses?: PersonAddress[] }>(
    DATASET_ID,
    DATASET_VERSION,
    teacherId,
    'personal_address',
  )
}

/**
 * Get family data for a single teacher by ID
 */
export async function getFamilyById(
  teacherId: string,
): Promise<DatasetRowResponse<{ family_members?: FamilyMember[] }>> {
  return getDatasetRowByKey<{ family_members?: FamilyMember[] }>(
    DATASET_ID,
    DATASET_VERSION,
    teacherId,
    'personal_family',
  )
}

/**
 * Create a new teacher
 */
export async function createTeacher(
  data: TeacherCreateDTO,
): Promise<DatasetRowResponse<PersonData>> {
  return createDatasetRow<PersonData>(DATASET_ID, DATASET_VERSION, data)
}

/**
 * Update a teacher by ID
 */
export async function updateTeacher(
  teacherId: string,
  data: TeacherUpdateDTO,
): Promise<DatasetRowResponse<PersonData>> {
  return updateDatasetRow<PersonData>(DATASET_ID, DATASET_VERSION, teacherId, data)
}

/**
 * Delete a teacher by ID (soft delete)
 */
export async function deleteTeacher(teacherId: string): Promise<void> {
  return deleteDatasetRow(DATASET_ID, DATASET_VERSION, teacherId)
}

/**
 * Create a person address linked to a teacher
 */
export async function createPersonAddress(
  data: PersonAddressCreateDTO,
): Promise<DatasetRowResponse<any>> {
  return createDatasetRow(ADDRESS_DATASET_ID, ADDRESS_DATASET_VERSION, data)
}

/**
 * Update a person address by address row ID
 */
export async function updatePersonAddress(
  addressId: string,
  data: Partial<PersonAddressCreateDTO>,
): Promise<DatasetRowResponse<any>> {
  return updateDatasetRow(ADDRESS_DATASET_ID, ADDRESS_DATASET_VERSION, addressId, data)
}

/**
 * Create a family member linked to a teacher
 */
export async function createFamilyMember(
  data: FamilyMemberCreateDTO,
): Promise<DatasetRowResponse<any>> {
  return createDatasetRow(FAMILY_DATASET_ID, FAMILY_DATASET_VERSION, data)
}

/**
 * Update a family member by row ID
 */
export async function updateFamilyMember(
  familyMemberId: string,
  data: Partial<FamilyMember>,
): Promise<DatasetRowResponse<FamilyMember>> {
  return updateDatasetRow<FamilyMember>(
    FAMILY_DATASET_ID,
    FAMILY_DATASET_VERSION,
    familyMemberId,
    data,
  )
}

/**
 * Create an education record linked to a teacher
 */
export async function createEducationRecord(
  data: EducationRecordCreateDTO,
): Promise<DatasetRowResponse<any>> {
  return createDatasetRow(EDUCATION_DATASET_ID, EDUCATION_DATASET_VERSION, data)
}

/**
 * Create a professional license linked to a teacher
 */
export async function createProfessionalLicense(
  data: ProfessionalLicenseCreateDTO,
): Promise<DatasetRowResponse<any>> {
  return createDatasetRow(LICENSE_DATASET_ID, LICENSE_DATASET_VERSION, data)
}

/**
 * Add Teacher Wizard Store
 * Stores the person_id and teacher data during the Add/Edit Teacher flow.
 * Set after PersonalDetail creates or loads the teacher row.
 * Used by Address / Family / Education / ProfessionalLicense pages.
 */
export const useTeacherStore = defineStore('teacher', () => {
  const personId = ref<string | null>(null)
  const currentTeacher = ref<Partial<PersonData> | null>(null)

  function setPersonId(id: string) {
    personId.value = id
  }

  function setCurrentTeacher(teacher: Partial<PersonData>) {
    personId.value = teacher.id || null
    currentTeacher.value = teacher
  }

  function clearPersonId() {
    personId.value = null
  }

  function clearCurrentTeacher() {
    personId.value = null
    currentTeacher.value = null
  }

  return {
    personId: readonly(personId),
    currentTeacher: readonly(currentTeacher),
    setPersonId,
    setCurrentTeacher,
    clearPersonId,
    clearCurrentTeacher,
  }
})
