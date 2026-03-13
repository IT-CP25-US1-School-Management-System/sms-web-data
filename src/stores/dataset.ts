import { dataApiInstance } from '@/stores/api'
import type {
  DatasetListResponse,
  DatasetRowResponse,
  DatasetQueryParams,
} from '@/types/dataset'

export const DATASET_ID = 'capstone'
export const DATASET_VERSION = 'v1.1.0'

/**
 * Generic function to list rows from a dataset version
 */
export async function getDatasetRows<T = Record<string, any>>(
  datasetId: string,
  version: string,
  params?: DatasetQueryParams,
): Promise<DatasetListResponse<T>> {
  const queryParams: Record<string, any> = {
    page: params?.page || 1,
    per_page: params?.per_page || 15,
  }

  if (params?.view_name) queryParams.view_name = params.view_name
  if (params?.filter) queryParams.filter = JSON.stringify(params.filter)
  if (params?.filter_logic) queryParams.filter_logic = params.filter_logic
  if (params?.sort_by) queryParams.sort_by = params.sort_by
  if (params?.sort_order) queryParams.sort_order = params.sort_order

  const response = await dataApiInstance.get<DatasetListResponse<T>>(
    `/v1/datasets/${datasetId}/versions/${version}/data`,
    { params: queryParams },
  )
  return response.data
}

/**
 * Generic function to get a single row by key
 */
export async function getDatasetRowByKey<T = Record<string, any>>(
  datasetId: string,
  version: string,
  key: string,
  viewName?: string,
): Promise<DatasetRowResponse<T>> {
  const params = viewName ? { view_name: viewName } : {}
  const response = await dataApiInstance.get<DatasetRowResponse<T>>(
    `/v1/datasets/${datasetId}/versions/${version}/data/key/${key}`,
    { params },
  )
  return response.data
}

/**
 * Generic function to create a new row
 */
export async function createDatasetRow<T = Record<string, any>>(
  datasetId: string,
  version: string,
  data: Partial<T>,
): Promise<DatasetRowResponse<T>> {
  const response = await dataApiInstance.post<DatasetRowResponse<T>>(
    `/v1/datasets/${datasetId}/versions/${version}/data`,
    data,
  )
  return response.data
}

/**
 * Generic function to update a row by key
 */
export async function updateDatasetRow<T = Record<string, any>>(
  datasetId: string,
  version: string,
  key: string,
  data: Partial<T>,
): Promise<DatasetRowResponse<T>> {
  const response = await dataApiInstance.put<DatasetRowResponse<T>>(
    `/v1/datasets/${datasetId}/versions/${version}/data/key/${key}`,
    data,
  )
  return response.data
}

/**
 * Generic function to delete a row by key (soft delete)
 */
export async function deleteDatasetRow(
  datasetId: string,
  version: string,
  key: string,
): Promise<void> {
  await dataApiInstance.delete(`v1/datasets/${datasetId}/versions/${version}/data/key/${key}`)
}
