import {
  getDatasetRows,
  getDatasetRowByKey,
  createDatasetRow,
  updateDatasetRow,
  deleteDatasetRow,
} from '@/stores/dataset'
import type { DatasetListResponse, DatasetRowResponse, DatasetQueryParams } from '@/types/dataset'
import type { Student, StudentCreateDTO, StudentUpdateDTO, AddressCreateDTO, ParentCreateDTO, Address, Parent } from '@/types/student'

const STUDENT_DATASET_ID = 'data_student'
const STUDENT_DATASET_VERSION = 'v1.0.0'
const ADDRESS_DATASET_ID = 'data_student'
const ADDRESS_DATASET_VERSION = 'v2.0.0'
const PARENT_DATASET_ID = 'data_student'
const PARENT_DATASET_VERSION = 'v3.0.0'

/**
 * Get list of students with pagination and filters
 */
export async function getStudents(
  params?: DatasetQueryParams,
): Promise<DatasetListResponse<Student>> {
  return getDatasetRows<Student>(STUDENT_DATASET_ID, STUDENT_DATASET_VERSION, {
    ...params,
    view: 'Students',
  })
}

/**
 * Get a single student by ID
 */
export async function getStudentById(studentId: string): Promise<DatasetRowResponse<Student>> {
  return getDatasetRowByKey<Student>(
    STUDENT_DATASET_ID,
    STUDENT_DATASET_VERSION,
    studentId,
    'Students',
  )
}

/**
 * Create a new student
 */
export async function createStudent(
  data: StudentCreateDTO,
): Promise<DatasetRowResponse<Student>> {
  return createDatasetRow<Student>(STUDENT_DATASET_ID, STUDENT_DATASET_VERSION, data)
}

/**
 * Update a student by ID
 */
export async function updateStudent(
  studentId: string,
  data: StudentUpdateDTO,
): Promise<DatasetRowResponse<Student>> {
  return updateDatasetRow<Student>(
    STUDENT_DATASET_ID,
    STUDENT_DATASET_VERSION,
    studentId,
    data,
  )
}

/**
 * Delete a student by ID (soft delete)
 */
export async function deleteStudent(studentId: string): Promise<void> {
  return deleteDatasetRow(STUDENT_DATASET_ID, STUDENT_DATASET_VERSION, studentId)
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
