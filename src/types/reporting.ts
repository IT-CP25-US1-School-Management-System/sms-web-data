export interface ExportJobRequest {
  dataset_id: string
  view: string
  format: string
  version: string
}

export interface ExportJobResponse {
  job_id: string
}

export interface FileUrl {
  status: string
  created_at?: string | null
  completed_at?: string | null
  started_at?: string | null
  destination_uri?: string | null
  error_message?: string | null
}

export interface GetExportJobResponse {
  data: FileUrl
}

export type ImportJobState = 'pending' | 'in_progress' | 'succeeded' | 'failed'
export type ImportTemplateFormat = 'xlsx' | 'csv'
export type ImportFileFormat = 'xlsx' | 'xls' | 'csv'

export interface ImportTemplateRequest {
  dataset_id: string
  version: string
  format: ImportTemplateFormat
}

export interface ImportTemplateResponse {
  url?: string
  template_url?: string
  download_url?: string
}

export interface ImportJobAcceptedResponse {
  job_id: string
}

export interface ImportJobStatus {
  status: ImportJobState
  created_at?: string
  completed_at?: string
  error_message?: string
}

export interface ImportJobStatusApiResponse {
  data: ImportJobStatus
}

export interface ImportJobResult {
  status: ImportJobState
  created_at?: string
  completed_at?: string
  error_message?: string
}

export interface ReportTemplateColumn {
  table_name: string
  column_name: string
}

export interface ReportTemplatePosition extends ReportTemplateColumn {
  alias: string
  x: number
  y: number
}

export interface UploadReportTemplateParams {
  name: string
  dataset_id: string
  version: string
  columns: ReportTemplateColumn[]
  positions: ReportTemplatePosition[]
}

export interface UploadReportTemplateResponse {
  id: string
}

export type ReportTemplateExportJobStatus = 'pending' | 'succeeded' | 'failed'

export interface ReportingTemplateRecord {
  id: string
  name: string
  template_id: string
  created_at: string
}

export interface ReportingTemplateCreateDTO {
  id: string
  name: string
  template_id: string
  created_at: string
}

export interface ExportTemplateResponse {
  job_id: string
}

export interface ExportTemplateJobData {
  status: ReportTemplateExportJobStatus
  url?: string
  original_filename?: string
  file_size?: number
  content_type?: string
  created_at?: string
  completed_at?: string
  error_message?: string
}

export interface ExportTemplateJobResponse {
  data: ExportTemplateJobData
}
