import type { PAFileCategory } from '@/types/pa'

export const PA_UPLOAD_FIELDS = [
  {
    key: 'pa2-pa1',
    countField: 'pa2-pa1-count',
    label: 'ข้อตกลง PA (PA1)',
    category: 'pa1',
    filenamePrefix: 'pa1',
    filenameHint: 'กลุ่มสาระ-ชื่อ-สกุล-คศ.ปัจจุบัน-pa1',
  },
  {
    key: 'pa2-eval1',
    countField: 'pa2-eval1-count',
    label: 'PA2 (กรรมการคนที่ 1 ผู้อำนวยการ)',
    category: 'pa2-1',
    filenamePrefix: 'pa2-กรรมการ1',
    filenameHint: 'กลุ่มสาระ-ชื่อ-สกุล-คศ.ปัจจุบัน-pa2-กรรมการ1',
  },
  {
    key: 'pa2-eval2',
    countField: 'pa2-eval2-count',
    label: 'PA2 (กรรมการคนที่ 2)',
    category: 'pa2-2',
    filenamePrefix: 'pa2-กรรมการ2',
    filenameHint: 'กลุ่มสาระ-ชื่อ-สกุล-คศ.ปัจจุบัน-pa2-กรรมการ2',
  },
  {
    key: 'pa2-eval3',
    countField: 'pa2-eval3-count',
    label: 'PA2 (กรรมการคนที่ 3)',
    category: 'pa2-3',
    filenamePrefix: 'pa2-กรรมการ3',
    filenameHint: 'กลุ่มสาระ-ชื่อ-สกุล-คศ.ปัจจุบัน-pa2-กรรมการ3',
  },
  {
    key: 'pa3',
    countField: 'pa3-count',
    label: 'PA3',
    category: 'pa3',
    filenamePrefix: 'pa3',
    filenameHint: 'กลุ่มสาระ-ชื่อ-สกุล-คศ.ปัจจุบัน-pa3',
  },
] as const satisfies readonly {
  key: string
  countField: string
  label: string
  category: PAFileCategory
  filenamePrefix: string
  filenameHint: string
}[]

export type PAUploadKey = (typeof PA_UPLOAD_FIELDS)[number]['key']

export function getPAUploadField(key: string) {
  return PA_UPLOAD_FIELDS.find((field) => field.key === key)
}

export function buildPAUploadFilename(originalFilename: string, key: PAUploadKey): string {
  const field = getPAUploadField(key)
  if (!field) return originalFilename
  const trimmed = originalFilename.trim() || 'เอกสาร.pdf'
  const normalized = trimmed.toLowerCase().replace(/[ _]+/g, '-')
  const withoutExtension = normalized.replace(/\.[^.]+$/, '')
  if (
    normalized.startsWith(`${field.filenamePrefix}-`) ||
    withoutExtension.endsWith(`-${field.filenamePrefix}`) ||
    withoutExtension === field.filenamePrefix
  ) {
    return trimmed
  }
  return `${field.filenamePrefix}-${trimmed}`
}

export function preparePAUploadFile(file: File, key: PAUploadKey): File {
  const filename = buildPAUploadFilename(file.name, key)
  if (filename === file.name) return file
  return new File([file], filename, { type: file.type, lastModified: file.lastModified })
}
