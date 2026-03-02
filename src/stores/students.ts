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
import type { Student, StudentCreateDTO, StudentUpdateDTO } from '@/types/student'

/**
 * Get list of students with pagination and filters
 */
export async function getStudents(
  params?: DatasetQueryParams,
): Promise<DatasetListResponse<Student>> {
  return getDatasetRows<Student>(DATASET_ID, DATASET_VERSION, {
    ...params,
    view_name: 'Student',
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
