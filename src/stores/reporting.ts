import { dataApiInstance } from '@/stores/api'
import type {
  ExportJobRequest,
  ExportJobResponse,
  GetExportJobResponse,
  ImportJobAcceptedResponse,
  ImportFileFormat,
  ImportJobResult,
  ImportJobStatus,
  ImportJobStatusApiResponse,
  ImportTemplateRequest,
  ImportTemplateResponse,
} from '@/types/reporting'

export async function getUrlFile(job_id: string): Promise<GetExportJobResponse> {
  const response = await dataApiInstance.get<GetExportJobResponse>(
    `/v1/reporting/export/job/${job_id}`,
  )
  return response.data
}

export async function exportData(data: ExportJobRequest): Promise<ExportJobResponse> {
  const response = await dataApiInstance.post<ExportJobResponse>(`/v1/reporting/export/job`, data)
  return response.data
}

export async function createReportImportTemplate(
  data: ImportTemplateRequest,
): Promise<ImportTemplateResponse> {
  const response = await dataApiInstance.post<ImportTemplateResponse>(
    '/v1/reporting/import/template',
    data,
  )

  return response.data
}

export async function createReportImportJob(
  file: File,
  datasetId: string,
  version: string,
  format: ImportFileFormat,
): Promise<ImportJobAcceptedResponse> {
  const formData = new FormData()
  formData.append('file', file, file.name)
  formData.append('dataset_id', datasetId)
  formData.append('version', version)
  formData.append('format', format)

  const response = await dataApiInstance.post<ImportJobAcceptedResponse>(
    '/v1/reporting/import/job',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  return response.data
}

export async function getReportImportJobStatus(jobId: string): Promise<ImportJobStatus> {
  const response = await dataApiInstance.get<ImportJobStatus | ImportJobStatusApiResponse>(
    `/v1/reporting/import/job/${jobId}`,
  )

  if (typeof response.data === 'object' && response.data !== null && 'data' in response.data) {
    return response.data.data
  }

  return response.data
}

export async function getReportImportJobResult(jobId: string): Promise<ImportJobResult> {
  const response = await dataApiInstance.get<ImportJobResult>(
    `/v1/reporting/import/job/${jobId}/result`,
  )

  return response.data
}

export const getExportJobByKey = getUrlFile
export const exportJob = exportData
