import { dataApiInstance } from '@/stores/api'
import { createDatasetRow, getDatasetRows } from '@/stores/dataset'
import { generateUUID } from '@/lib/helpers'
import type { DatasetListResponse, DatasetRowResponse, DatasetQueryParams } from '@/types/dataset'
import type {
  ExportJobRequest,
  ExportJobResponse,
  ExportTemplateJobResponse,
  ExportTemplateResponse,
  GetExportJobResponse,
  ImportJobAcceptedResponse,
  ImportFileFormat,
  ImportJobResult,
  ImportJobStatus,
  ImportJobStatusApiResponse,
  ImportTemplateRequest,
  ImportTemplateResponse,
  ReportingTemplateCreateDTO,
  ReportingTemplateRecord,
  UploadReportTemplateParams,
  UploadReportTemplateResponse,
} from '@/types/reporting'

const REPORT_TEMPLATE_DATASET_ID = 'data_get_view'
const REPORT_TEMPLATE_DATASET_VERSION = 'v2.7.4'
const REPORTING_TEMPLATE_VIEW = 'reporting_template'

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

export async function uploadReportTemplate(
  file: File,
  params: UploadReportTemplateParams,
): Promise<UploadReportTemplateResponse> {
  const formData = new FormData()
  formData.append('file', file, file.name)
  formData.append('params', JSON.stringify(params))

  const response = await dataApiInstance.post<UploadReportTemplateResponse>(
    '/v1/reporting/templates/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  return response.data
}

export async function createReportingTemplate(
  data: ReportingTemplateCreateDTO,
): Promise<DatasetRowResponse<ReportingTemplateRecord>> {
  return createDatasetRow<ReportingTemplateRecord>(
    REPORT_TEMPLATE_DATASET_ID,
    REPORT_TEMPLATE_DATASET_VERSION,
    data,
    REPORTING_TEMPLATE_VIEW,
  )
}

export async function createReportingTemplateFromUpload(
  name: string,
  templateId: string,
): Promise<DatasetRowResponse<ReportingTemplateRecord>> {
  return createReportingTemplate({
    id: generateUUID(),
    name,
    template_id: templateId,
    created_at: new Date().toISOString(),
  })
}

export async function getReportingTemplates(
  params?: DatasetQueryParams,
): Promise<DatasetListResponse<ReportingTemplateRecord>> {
  return getDatasetRows<ReportingTemplateRecord>(
    REPORT_TEMPLATE_DATASET_ID,
    REPORT_TEMPLATE_DATASET_VERSION,
    {
      ...params,
      view: REPORTING_TEMPLATE_VIEW,
    },
  )
}

export async function exportReportingTemplate(
  templateId: string,
  key: string,
): Promise<ExportTemplateResponse> {
  const response = await dataApiInstance.post<ExportTemplateResponse>(
    `/v1/reporting/templates/${templateId}/export/key/${key}`,
  )

  return response.data
}

export async function getReportingTemplateExportJob(
  jobId: string,
): Promise<ExportTemplateJobResponse> {
  const response = await dataApiInstance.get<ExportTemplateJobResponse>(
    `/v1/reporting/templates/export/job/${jobId}`,
  )

  return response.data
}

export const getExportJobByKey = getUrlFile
export const exportJob = exportData
