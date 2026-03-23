import {
  DATASET_ID,
  DATASET_VERSION,
  getDatasetRows,
  getDatasetRowByKey,
  createDatasetRow,
  updateDatasetRow,
  deleteDatasetRow,
} from '@/stores/dataset'
import type { DatasetListResponse, DatasetRowResponse, DatasetQueryParams } from '@/types/dataset'
import type { Student, StudentCreateDTO, StudentUpdateDTO, AddressCreateDTO, ParentCreateDTO, Address, Parent } from '@/types/student'

// TODO: Replace with correct dataset IDs once configured in DMS backend
const ADDRESS_DATASET_ID = DATASET_ID
const ADDRESS_DATASET_VERSION = DATASET_VERSION
const PARENT_DATASET_ID = DATASET_ID
const PARENT_DATASET_VERSION = DATASET_VERSION

/**
 * Get list of students with pagination and filters
 */
export async function getStudents(
  params?: DatasetQueryParams,
): Promise<DatasetListResponse<Student>> {
  return getDatasetRows<Student>(DATASET_ID, DATASET_VERSION, {
    ...params,
    view: 'Student',
  })
}

/**
 * Get a single student by ID
 */
export async function getStudentById(studentId: string): Promise<DatasetRowResponse<Student>> {
  return getDatasetRowByKey<Student>(DATASET_ID, DATASET_VERSION, studentId, 'Student')
}

/**
 * Create a new student
 */
export async function createStudent(
  data: StudentCreateDTO,
): Promise<DatasetRowResponse<Student>> {
  return createDatasetRow<Student>(DATASET_ID, DATASET_VERSION, data)
}

/**
 * Update a student by ID
 */
export async function updateStudent(
  studentId: string,
  data: StudentUpdateDTO,
): Promise<DatasetRowResponse<Student>> {
  return updateDatasetRow<Student>(DATASET_ID, DATASET_VERSION, studentId, data)
}

/**
 * Delete a student by ID (soft delete)
 */
export async function deleteStudent(studentId: string): Promise<void> {
  return deleteDatasetRow(DATASET_ID, DATASET_VERSION, studentId)
}

/**
 * Create a student address
 */
export async function createStudentAddress(
  data: AddressCreateDTO,
): Promise<DatasetRowResponse<Address>> {
  return createDatasetRow<Address>(ADDRESS_DATASET_ID, ADDRESS_DATASET_VERSION, data)
}

/**
 * Create a student parent
 */
export async function createStudentParent(
  data: ParentCreateDTO,
): Promise<DatasetRowResponse<Parent>> {
  return createDatasetRow<Parent>(PARENT_DATASET_ID, PARENT_DATASET_VERSION, data)
}
