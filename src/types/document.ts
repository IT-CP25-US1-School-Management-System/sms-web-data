export interface FileDocument {
  resource_id: string
  original_filename: string
  storage_filename: string
  content_type: string
  size: number
  created_at: string
  metadata: FileDocumentMetadata
  folder: FileDocumentFolder
  url: string
}

export interface FileDocumentMetadata {
  id: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | string
  uploaded_by: string
  description: string
  tags: string[]
  created_at: string
}

export interface FileDocumentFolder {
  id: string
  folder: string
  path: FileDocumentPath
}

export interface FileDocumentPath {
  id: string
  name: string
  bucket_name: string
}

export interface CreateFileDocumentParams {
  path: string
  folder: string
  uploaded_by: string
  description: string
}

export interface FileDocumentResponse<T= Record<string, any>> {
  data: T
}
