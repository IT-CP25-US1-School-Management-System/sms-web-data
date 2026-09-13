import { dataApiInstance } from '@/stores/api'
import type { DatasetListResponse, DatasetRowResponse, DatasetQueryParams } from '@/types/dataset'

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

  if (params?.view) queryParams.view = params.view
  if (params?.where_logical_operator)
    queryParams.where_logical_operator = params.where_logical_operator
  if (params?.where) queryParams.where = JSON.stringify(params.where)
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
  pagination?: Pick<DatasetQueryParams, 'page' | 'per_page'>,
): Promise<DatasetRowResponse<T>> {
  const params = {
    ...(viewName ? { view: viewName } : {}),
    ...pagination,
  }
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
  viewName?: string,
): Promise<DatasetRowResponse<T>> {
  const params = viewName ? { view: viewName } : undefined
  const response = await dataApiInstance.post<DatasetRowResponse<T>>(
    `/v1/datasets/${datasetId}/versions/${version}/data`,
    data,
    params ? { params } : undefined,
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
  viewName?: string,
): Promise<DatasetRowResponse<T>> {
  const params = viewName ? { view: viewName } : undefined
  const response = await dataApiInstance.put<DatasetRowResponse<T>>(
    `/v1/datasets/${datasetId}/versions/${version}/data/key/${key}`,
    data,
    params ? { params } : undefined,
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
  viewName?: string,
): Promise<void> {
  const params = viewName ? { view: viewName } : undefined
  await dataApiInstance.delete(`v1/datasets/${datasetId}/versions/${version}/data/key/${key}`, {
    params,
  })
}
