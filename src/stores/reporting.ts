import { dataApiInstance } from '@/stores/api'
import type { ExportJobRequest, ExportJobResponse, GetExportJobResponse } from '@/types/reporting'

export async function getUrlFile(job_id: string): Promise<GetExportJobResponse> {
  const response = await dataApiInstance.get<GetExportJobResponse>(
    `/v1/reporting/export/job/${job_id}`,
  )
  return response.data
}

export async function exportData(data: ExportJobRequest): Promise<ExportJobResponse> {
  const response = await dataApiInstance.post<ExportJobResponse>(
    `/v1/reporting/export/job`,
    data,
  )
  return response.data
}

export const getExportJobByKey = getUrlFile
export const exportJob = exportData
