import {
  createDatasetRow,
  deleteDatasetRow,
  getDatasetRowByKey,
  getDatasetRows,
  updateDatasetRow,
} from '@/stores/dataset'
import { MANAGE_STUDENT_DATASETS } from '@/lib/constants'
import type { DatasetListResponse, DatasetQueryParams, DatasetRowResponse } from '@/types/dataset'
import type {
  Address,
  AddressCreateDTO,
  AddressUpdateDTO,
  Parent,
  ParentCreateDTO,
  ParentUpdateDTO,
  Student,
  StudentCreateDTO,
  StudentUpdateDTO,
} from '@/types/student'

const STUDENT_DATASET_ID = MANAGE_STUDENT_DATASETS.DATASET_ID
const STUDENT_DATASET_VERSION = MANAGE_STUDENT_DATASETS.DATASET_VERSION_STUDENT
const ADDRESS_DATASET_ID = MANAGE_STUDENT_DATASETS.DATASET_ID
const ADDRESS_DATASET_VERSION = MANAGE_STUDENT_DATASETS.DATASET_VERSION_ADDRESS
const PARENT_DATASET_ID = MANAGE_STUDENT_DATASETS.DATASET_ID
const PARENT_DATASET_VERSION = MANAGE_STUDENT_DATASETS.DATASET_VERSION_PARENT

export async function getStudents(
  params?: DatasetQueryParams,
): Promise<DatasetListResponse<Student>> {
  return getDatasetRows<Student>(STUDENT_DATASET_ID, STUDENT_DATASET_VERSION, {
    ...params,
    view: 'Students',
  })
}

export async function getStudentById(studentId: string): Promise<DatasetRowResponse<Student>> {
  return getDatasetRowByKey<Student>(
    STUDENT_DATASET_ID,
    STUDENT_DATASET_VERSION,
    studentId,
    'Students',
  )
}

export async function createStudent(data: StudentCreateDTO): Promise<DatasetRowResponse<Student>> {
  return createDatasetRow<Student>(STUDENT_DATASET_ID, STUDENT_DATASET_VERSION, data)
}

export async function updateStudent(
  studentId: string,
  data: StudentUpdateDTO,
): Promise<DatasetRowResponse<Student>> {
  return updateDatasetRow<Student>(STUDENT_DATASET_ID, STUDENT_DATASET_VERSION, studentId, data)
}

export async function deleteStudent(studentId: string): Promise<void> {
  return deleteDatasetRow(STUDENT_DATASET_ID, STUDENT_DATASET_VERSION, studentId)
}

export async function getStudentAddressById(addressId: string): Promise<DatasetRowResponse<Address>> {
  return getDatasetRowByKey<Address>(
    ADDRESS_DATASET_ID,
    ADDRESS_DATASET_VERSION,
    addressId,
  )
}

export async function createStudentAddress(
  data: AddressCreateDTO,
): Promise<DatasetRowResponse<Address>> {
  return createDatasetRow<Address>(ADDRESS_DATASET_ID, ADDRESS_DATASET_VERSION, data)
}

export async function updateStudentAddress(
  addressId: string,
  data: AddressUpdateDTO,
): Promise<DatasetRowResponse<Address>> {
  return updateDatasetRow<Address>(ADDRESS_DATASET_ID, ADDRESS_DATASET_VERSION, addressId, data)
}

export async function getStudentParentsByStudentId(
  studentId: string,
): Promise<DatasetListResponse<Parent>> {
  return getDatasetRows<Parent>(PARENT_DATASET_ID, PARENT_DATASET_VERSION, {
    page: 1,
    per_page: 50,
    where: [
      [
        {
          table_name: 'parents',
          field: 'student_id',
          operator: '=',
          value: studentId,
        },
      ],
    ],
  })
}

export async function createStudentParent(
  data: ParentCreateDTO,
): Promise<DatasetRowResponse<Parent>> {
  return createDatasetRow<Parent>(PARENT_DATASET_ID, PARENT_DATASET_VERSION, data)
}

export async function updateStudentParent(
  parentId: string,
  data: ParentUpdateDTO,
): Promise<DatasetRowResponse<Parent>> {
  return updateDatasetRow<Parent>(PARENT_DATASET_ID, PARENT_DATASET_VERSION, parentId, data)
}

export async function deleteStudentParent(parentId: string): Promise<void> {
  return deleteDatasetRow(PARENT_DATASET_ID, PARENT_DATASET_VERSION, parentId)
}
