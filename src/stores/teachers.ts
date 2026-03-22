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
import type { PersonData, TeacherCreateDTO, TeacherUpdateDTO } from '@/types/teacher'

/**
 * Get list of teachers with pagination and filters
 */
export async function getTeachers(
  params?: DatasetQueryParams,
): Promise<DatasetListResponse<PersonData>> {
  return getDatasetRows<PersonData>({
    ...params,
    view: 'Teacher',
  })
}

/**
 * Get a single teacher by ID
 */
export async function getTeacherById(teacherId: string): Promise<DatasetRowResponse<PersonData>> {
  return getDatasetRowByKey<PersonData>(DATASET_ID, DATASET_VERSION, teacherId, 'Teacher')
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
