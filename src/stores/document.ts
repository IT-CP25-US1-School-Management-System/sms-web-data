import { documentApiInstance } from '@/stores/api'
import type { CreateFileDocumentParams, FileDocument, FileDocumentResponse } from '@/types/document'

//ใช้สำหรับดึงข้อมูลเอกสารที่ถูกสร้างขึ้นมาแล้วจาก document service  หน้าที่ใช้เช่น ใบประกอบวิชาชีพ
export async function getFileDocumentRows<T = Record<string, any>>(
  key: string,
): Promise<FileDocumentResponse<T>> {
  const response = await documentApiInstance.get<FileDocumentResponse<T>>(
    `/v1/documents/resource/${key}`,
  )
  return response.data
}

export async function createFileDocument<T = FileDocument>(
  file: File | Blob,
  params: CreateFileDocumentParams,
): Promise<FileDocumentResponse<T>> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append(
    'params',
    JSON.stringify({
      path: params.path,
      folder: params.folder,
      uploaded_by: params.uploaded_by,
      description: params.description || '-',
    }),
  )

  const response = await documentApiInstance.post<FileDocumentResponse<T>>(
    `/v1/documents/resource`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )
  return response.data
}

export async function deleteFileDocument<T = FileDocument>(
  key: string,
): Promise<FileDocumentResponse<T>> {
  const response = await documentApiInstance.delete<FileDocumentResponse<T>>(
    `/v1/documents/resource/${key}`,
  )
  return response.data
}
