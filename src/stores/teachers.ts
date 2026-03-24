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
  TeacherCreateDTO,
  TeacherUpdateDTO,
  PersonAddressCreateDTO,
  FamilyMemberCreateDTO,
  EducationRecordCreateDTO,
  ProfessionalLicenseCreateDTO,
} from '@/types/teacher'

// TODO: Replace with the correct dataset IDs once configured in the DMS backend
const ADDRESS_DATASET_ID = DATASET_ID
const ADDRESS_DATASET_VERSION = DATASET_VERSION
const FAMILY_DATASET_ID = DATASET_ID
const FAMILY_DATASET_VERSION = DATASET_VERSION
const EDUCATION_DATASET_ID = DATASET_ID
const EDUCATION_DATASET_VERSION = DATASET_VERSION
const LICENSE_DATASET_ID = DATASET_ID
const LICENSE_DATASET_VERSION = DATASET_VERSION

/**
 * Get list of teachers with pagination and filters
 */
export async function getTeachers(
  params?: DatasetQueryParams,
): Promise<DatasetListResponse<PersonData>> {
  return getDatasetRows<PersonData>(DATASET_ID, DATASET_VERSION, {
    ...params,
    view: 'person_details',
  })
}

/**
 * Get a single teacher by ID
 */
export async function getTeacherById(teacherId: string): Promise<DatasetRowResponse<PersonData>> {
  return getDatasetRowByKey<PersonData>(DATASET_ID, DATASET_VERSION, teacherId, 'person_details')
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
 * Create a family member linked to a teacher
 */
export async function createFamilyMember(
  data: FamilyMemberCreateDTO,
): Promise<DatasetRowResponse<any>> {
  return createDatasetRow(FAMILY_DATASET_ID, FAMILY_DATASET_VERSION, data)
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
