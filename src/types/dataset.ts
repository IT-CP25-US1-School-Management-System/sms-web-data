/**
 * DMS API Response Types
 * Based on Data Management Service (DMS) API v1 OpenAPI spec
 */

// ============================================================
// Dataset Types
// ============================================================

export interface Dataset {
  id: string
  name: string
  description: string
  domain: string
  tags: string[]
  has_pii: boolean
  owner: string
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted'
}

export interface DatasetDetail extends Dataset {
  schema?: any
  sample_data?: any
  metadata?: Record<string, any>
}

export interface DatasetUpsert {
  name: string
  description: string
  domain?: string
  tags?: string[]
  has_pii?: boolean
  sensitivity?: 'public' | 'internal' | 'confidential' | 'restricted'
}

// ============================================================
// Dataset Search & Response
// ============================================================

export interface DatasetSearchParams {
  search_word?: string
  domain?: string
  tag?: string
  has_pii?: boolean
  owner?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface DatasetSearchResponse {
  data: Dataset[]
  page: number
  per_page: number
  total_pages: number
  total_rows: number
}

// ============================================================
// Dataset Version Types
// ============================================================

export interface DatasetVersion {
  dataset_id: string
  version: string
  source_id: string
  status: 'draft' | 'active' | 'deprecated'
  schema: any
  access_policies: any[]
  policies: any
  created_at: string
  updated_at: string
}

export interface DatasetVersionSearchParams {
  page?: number
  per_page?: number
  source_id?: string
  search_word?: string
  status?: 'draft' | 'active' | 'deprecated'
}

export interface DatasetVersionSearchResponse {
  data: DatasetVersion[]
  page: number
  per_page: number
  total_pages: number
  total_rows: number
}

// ============================================================
// Dataset Data Query & Response (Serving API)
// ============================================================

export interface DatasetQueryParams {
  view?: string
  filter?: any // JSON string or object
  filter_logic?: 'AND' | 'OR'
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface DatasetListResponse<T = Record<string, any>> {
  data: T[]
  page: number
  per_page: number
  total_rows: number
  total_pages: number
}

export interface DatasetRowResponse<T = Record<string, any>> {
  data: T
}

// ============================================================
// Generic API Response
// ============================================================

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}