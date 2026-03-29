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
