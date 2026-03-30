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
  EducationRecord,
  ProfessionalLicense,
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
const EDUCATION_DATASET_ID = 'data_manage'
const EDUCATION_DATASET_VERSION = 'v5.0.0'
const LICENSE_DATASET_ID = 'data_manage'
const LICENSE_DATASET_VERSION = 'v6.1.0'
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
 * Get education data for a single teacher by ID
 */
export async function getEducationById(
  teacherId: string,
): Promise<DatasetRowResponse<{ education_records?: EducationRecord[] }>> {
  return getDatasetRowByKey<{ education_records?: EducationRecord[] }>(
    DATASET_ID,
    DATASET_VERSION,
    teacherId,
    'personal_education',
  )
}

/**
 * Get professional licenses for a single teacher by ID
 */
export async function getProfessionalLicensesByTeacherId(
  teacherId: string,
): Promise<DatasetRowResponse<{ professional_licenses?: ProfessionalLicense[] }>> {
  const response = await getDatasetRows<
    ProfessionalLicense | { professional_licenses?: ProfessionalLicense[] }
  >(
    LICENSE_DATASET_ID,
    LICENSE_DATASET_VERSION,
    {
      view: 'professional_licenses',
      page: 1,
      per_page: 100,
      where: [
        [
          {
            table_name: 'professional_licenses',
            field: 'person_id',
            operator: '=',
            value: teacherId,
          },
        ],
      ],
    },
  )

  const rawData = response.data || []
  const firstRow = rawData[0]

  if (
    firstRow &&
    typeof firstRow === 'object' &&
    'professional_licenses' in firstRow &&
    Array.isArray(firstRow.professional_licenses)
  ) {
    return {
      data: {
        professional_licenses: firstRow.professional_licenses,
      },
    }
  }

  return {
    data: {
      professional_licenses: rawData as ProfessionalLicense[],
    },
  }
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
): Promise<DatasetRowResponse<EducationRecord>> {
  return createDatasetRow<EducationRecord>(EDUCATION_DATASET_ID, EDUCATION_DATASET_VERSION, data)
}

/**
 * Update an education record by row ID
 */
export async function updateEducationRecord(
  educationRecordId: string,
  data: Partial<EducationRecordCreateDTO> & Partial<EducationRecord>,
): Promise<DatasetRowResponse<EducationRecord>> {
  return updateDatasetRow<EducationRecord>(
    EDUCATION_DATASET_ID,
    EDUCATION_DATASET_VERSION,
    educationRecordId,
    data,
  )
}

/**
 * Create a professional license linked to a teacher
 */
export async function createProfessionalLicense(
  data: ProfessionalLicenseCreateDTO,
): Promise<DatasetRowResponse<ProfessionalLicense>> {
  return createDatasetRow<ProfessionalLicense>(LICENSE_DATASET_ID, LICENSE_DATASET_VERSION, data)
}

/**
 * Update a professional license by row ID
 */
export async function updateProfessionalLicense(
  licenseId: string,
  data: Partial<ProfessionalLicenseCreateDTO> & Partial<ProfessionalLicense>,
): Promise<DatasetRowResponse<ProfessionalLicense>> {
  return updateDatasetRow<ProfessionalLicense>(
    LICENSE_DATASET_ID,
    'v6.1.0',
    licenseId,
    data,
  )
}

/**
 * Delete a professional license by row ID
 */
export async function deleteProfessionalLicense(licenseId: string): Promise<void> {
  return deleteDatasetRow(LICENSE_DATASET_ID, LICENSE_DATASET_VERSION, licenseId)
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
