import {
  getDatasetRows,
  getDatasetRowByKey,
  createDatasetRow,
  updateDatasetRow,
  deleteDatasetRow,
} from '@/stores/dataset'
import { MANAGE_APPROVAL_LOGS_DATASET, MANAGE_DATASETS } from '@/lib/constants'
import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import { generateUUID } from '@/lib/helpers'
import type { DatasetListResponse, DatasetRowResponse, DatasetQueryParams } from '@/types/dataset'
import type { DocumentRequest, ApprovalLog } from '@/types/document_request'

const DOCUMENT_REQUESTS_DATASET_ID = MANAGE_DATASETS.DATASET_ID
const DOCUMENT_REQUESTS_DATASET_VERSION = MANAGE_DATASETS.DATASET_VERSION_DOCUMENT_REQUEST
const APPROVAL_LOGS_DATASET_ID = MANAGE_APPROVAL_LOGS_DATASET.DATASET_ID
const APPROVAL_LOGS_VERSION = MANAGE_APPROVAL_LOGS_DATASET.DATASET_VERSION
/**
 * Get approval logs (view: approval_logs, version: 2.0.3)
 */
export async function getApprovalLogs(params?: DatasetQueryParams) {
  return getDatasetRows<ApprovalLog>(APPROVAL_LOGS_DATASET_ID, APPROVAL_LOGS_VERSION, {
    ...params,
    view: 'approval_logs',
  })
}

/**
 * Create approval log (version: 2.0.3)
 */
export async function createApprovalLog(data: Omit<ApprovalLog, 'id' | 'created_at'>) {
  const now = new Date().toISOString()
  return createDatasetRow<ApprovalLog>(APPROVAL_LOGS_DATASET_ID, APPROVAL_LOGS_VERSION, {
    ...data,
    id: generateUUID(),
    created_at: now,
  })
}

/**
 * Get list of document requests with pagination and filters
 */
export async function getDocumentRequests(
  params?: DatasetQueryParams,
): Promise<DatasetListResponse<DocumentRequest>> {
  return getDatasetRows<DocumentRequest>(
    DOCUMENT_REQUESTS_DATASET_ID,
    DOCUMENT_REQUESTS_DATASET_VERSION,
    {
      ...params,
      view: 'document_requests',
    },
  )
}

/**
 * Get a single document request by ID
 */
export async function getDocumentRequestById(
  requestId: string,
): Promise<DatasetRowResponse<DocumentRequest>> {
  return getDatasetRowByKey<DocumentRequest>(
    DOCUMENT_REQUESTS_DATASET_ID,
    DOCUMENT_REQUESTS_DATASET_VERSION,
    requestId,
    'document_requests',
  )
}

/**
 * Create a new document request
 */
export async function createDocumentRequest(
  data: Omit<DocumentRequest, 'id' | 'created_at' | 'updated_at'>,
): Promise<DatasetRowResponse<DocumentRequest>> {
  const now = new Date().toISOString()
  return createDatasetRow<DocumentRequest>(
    DOCUMENT_REQUESTS_DATASET_ID,
    DOCUMENT_REQUESTS_DATASET_VERSION,
    {
      id: generateUUID(),
      created_at: now,
      ...data,
    },
  )
}

/**
 * Update a document request by ID
 */
export async function updateDocumentRequest(
  requestId: string,
  data: Partial<DocumentRequest>,
): Promise<DatasetRowResponse<DocumentRequest>> {
  const now = new Date().toISOString()
  return updateDatasetRow<DocumentRequest>(
    DOCUMENT_REQUESTS_DATASET_ID,
    DOCUMENT_REQUESTS_DATASET_VERSION,
    requestId,
    {
      ...data,
      updated_at: now,
    },
  )
}

/**
 * Delete a document request by ID (soft delete)
 */
export async function deleteDocumentRequest(requestId: string): Promise<void> {
  return deleteDatasetRow(
    DOCUMENT_REQUESTS_DATASET_ID,
    DOCUMENT_REQUESTS_DATASET_VERSION,
    requestId,
  )
}

/**
 * Document Requests Store
 * Manages document request state during the document flow.
 */
export const useDocumentsStore = defineStore('documents', () => {
  const requestId = ref<string | null>(null)
  const currentRequest = ref<Partial<DocumentRequest> | null>(null)

  function setRequestId(id: string) {
    requestId.value = id
  }

  function setCurrentRequest(request: Partial<DocumentRequest>) {
    requestId.value = request.id || null
    currentRequest.value = request
  }

  function clearRequestId() {
    requestId.value = null
  }

  function clearCurrentRequest() {
    requestId.value = null
    currentRequest.value = null
  }

  return {
    requestId: readonly(requestId),
    currentRequest: readonly(currentRequest),
    setRequestId,
    setCurrentRequest,
    clearRequestId,
    clearCurrentRequest,
  }
})
