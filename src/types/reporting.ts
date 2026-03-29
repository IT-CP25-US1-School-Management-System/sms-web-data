export interface ExportJobRequest {
  dataset_id: string
  view: string
  format: string
  version: string
}

export interface ExportJobResponse {
  job_id: string
}

export interface GetExportJobResponse {
  status: string
  created_at?: string | null
  completed_at?: string | null
  started_at?: string | null
  destination_uri?: string | null
  error_message?: string | null
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
