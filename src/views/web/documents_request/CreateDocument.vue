<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { FileText, X, CalendarIcon } from 'lucide-vue-next'
import { ref, watch, computed ,onMounted } from 'vue'
import { Form as VeeForm, Field as VeeField, ErrorMessage } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { toast } from 'vue-sonner'
import { generateUUID } from '@/lib/helpers'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { type DateValue, CalendarDate } from '@internationalized/date'
import { useAuthStore } from '@/stores/auth'
import { createDatasetRow } from '@/stores/dataset'
import { createFileDocument } from '@/stores/document'
import type { CreateFileDocumentParams, FileDocument } from '@/types/document'
import type { DocumentRequest ,DocumentLink ,RequestEducationRecords ,RequestGeneral ,RequestHistory } from '@/types/document_request'
import { getFileDocumentRows } from '@/stores/document'
import { FILE_KEY_TEMPLATES } from '@/lib/constants'
import {  DOCUMENT_EDIT } from '@/lib/constants'

/* ──────────────────── ประเภทคำร้อง ──────────────────── */
const requestTypeOptions = [
  { label: 'คำร้องขอเอกสาร', value: '1' },
  { label: 'คำขอบัตรประจำตัว', value: '2' },
  { label: 'คำร้องขออนุญาตไปต่างประเทศ', value: '3' },
  { label: 'แบบรายงานเปลี่ยนแปลงหรือเพิ่มเติมรายการลงในสมุดประวัติ', value: '4' },
  { label: 'คำร้องขอเพิ่มวุติการศึกษา', value: '5' },
]

/* ──────────────────── Common state ──────────────────── */
const title = ref('')
const requestType = ref('')
const formRef = ref<any>(null)
const authStore = useAuthStore()
const uploadedDocumentKeys = ref<string[]>([])
const isSubmitting = ref(false)

/* ──────────────────── Type 1: คำร้องขอเอกสาร ──────────────────── */
const salaryQty = ref('')
const workQty = ref('')
const letterBank = ref('')
const letterQty = ref('')

// salary detail local refs (kept in sync with VeeField)
const salary_info = ref('')
const salary_base = ref('')
const salary_compensation = ref('')


const documentRequest = ref<DocumentRequest>({
  id: '',
  person_id: '',
  document_type: null,
  status: 'กำลังดำเนินการ',
  created_at: '',
  updated_at: '',
})

const documentLink = ref<DocumentLink>({
  document_key: '',
  entity_table: '',
  entity_id: '',
  purpose: '',
  person_id: '',
  created_at: '',
})  

const requestEducationRecords = ref<RequestEducationRecords>({
  id: '',
  request_id: '',
  education_level: '',
  qualification: '',
  qualification_name: '',
  major_group: '',
  minor_group: '',
  institution: '',
  country: '',
  start_date: '',
  graduation_date: '',
  honor_type: '',
  is_used_for_first_appointment: null,
  is_highest_degree: null,
  is_meets_position_standard: null,
  is_recognized_by_kksa: null,
  is_recognized_by_ocsc: null,
})

const requestGeneral = ref<RequestGeneral>({
  id: '',
  request_id: '',
  salary_cert_qty: null,
  work_cert_qty: null,
  rights_auth_bank: '',
  rights_auth_qty: null,
  salary_info: '',
  academic_allowance: null,
  compensation_allowance: null,
})

const requestHistory = ref<RequestHistory>({
  id: '',
  request_id: '',
  is_qualification_added: null,
  is_marriage_registered: null,
  is_divorce_registered: null,
  rights_auth_bank: '',
  rights_auth_qty: null,
})

const bankOptions = [
  { label: 'ธนาคารกรุงไทย', value: 'krungthai' },
  { label: 'ธนาคารกรุงเทพ', value: 'bangkok' },
  { label: 'ธนาคารกสิกรไทย', value: 'kasikorn' },
  { label: 'ธนาคารไทยพาณิชย์', value: 'scb' },
  { label: 'ธนาคารออมสิน', value: 'gsb' },
]

/* ──────────────────── Type 4: แบบรายงานเปลี่ยนแปลง ──────────────────── */
const chkDegree = ref(false)
const chkMarriage = ref(false)
const chkDivorce = ref(false)
const chkLetter4 = ref(false)
const letterBank4 = ref('')
const letterQty4 = ref('')

/* ──────────────────── Type 5: คำร้องขอเพิ่มวุติการศึกษา ──────────────────── */
const educationData = ref<Record<string, any>>({
  education_level: '',
  qualification: '',
  qualification_name: '',
  major_group: '',
  minor_group: '',
  institution: '',
  start_date: '',
  graduation_date: '',
  country: '',
  honor_type: '',
  'qualification-used': '',
})

const urlDownload2 = ref('')
const urlDownload3 = ref('')
const urlDownload4_1 = ref('')
const urlDownload4_2 = ref('')
const downloadFileName2 = ref('')
const downloadFileName3 = ref('')
const downloadFileName4_1 = ref('')
const downloadFileName4_2 = ref('')

/* ──────────────────── Date picker helpers ──────────────────── */
const datePopoverOpen = ref<Record<string, boolean>>({})

function stringToDateValue(str: string | undefined): DateValue | undefined {
  if (!str) return undefined
  const [y, m, d] = str.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new CalendarDate(y, m, d)
}

function dateValueToString(dv: DateValue): string {
  const y = String(dv.year).padStart(4, '0')
  const m = String(dv.month).padStart(2, '0')
  const d = String(dv.day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplayDate(str: string | undefined): string {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

/* ──────────────────── File upload helpers ──────────────────── */
const fileMap = ref<Record<string, File[]>>({})
const fileInputRefs = ref<Record<string, HTMLInputElement | null>>({})
const fileSizeErrors = ref<Record<string, string | undefined>>({})
const MAX_FILE_SIZE = 15 * 1024 * 1024
const FILE_SIZE_ERROR_MESSAGE = `ขนาดไฟล์ต้องไม่เกิน ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))} MB`

const fileCountFieldMap: Record<string, string> = {
  slip: 'slipCount',
  'card-doc': 'cardDocCount',
  'abroad-doc': 'abroadDocCount',
  'report-doc': 'reportDocCount',
  'update-doc': 'updateDocCount',
  'letter-doc': 'letterDocCount',
  'reason-doc': 'reasonDocCount',
  'education-request-doc': 'educationRequestDocCount',
}

function getRequestTypeLabel() {
  return requestTypeOptions.find((option) => option.value === requestType.value)?.label || ''
}

function getCurrentUserName() {
  return authStore.user?.name || authStore.user?.given_name || authStore.user?.email || 'current-user'
}

function getSelectedFiles(): File[] {
  return Object.values(fileMap.value).flatMap((files) => files ?? [])
}

function toNullableNumber(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function normalizeStringInput(value: unknown): string {
  if (value === null || value === undefined) return ''
  return value.toString()
}

function resetCreateDocumentForm() {
  title.value = ''
  requestType.value = ''
  salaryQty.value = ''
  workQty.value = ''
  letterBank.value = ''
  letterQty.value = ''
  salary_info.value = ''
  salary_base.value = ''
  salary_compensation.value = ''
  chkDegree.value = false
  chkMarriage.value = false
  chkDivorce.value = false
  chkLetter4.value = false
  letterBank4.value = ''
  letterQty4.value = ''
  educationData.value = {
    education_level: '',
    qualification: '',
    qualification_name: '',
    major_group: '',
    minor_group: '',
    institution: '',
    start_date: '',
    graduation_date: '',
    country: '',
    honor_type: '',
    'qualification-used': '',
  }
  uploadedDocumentKeys.value = []
  fileMap.value = {}
  fileSizeErrors.value = {}
  datePopoverOpen.value = {}
  resetAllFileCounts()
  syncSlipCountField(0)

  Object.values(fileInputRefs.value).forEach((input) => {
    if (input) input.value = ''
  })

  formRef.value?.resetForm({
    values: {
      requestType: '',
      title: '',
      chkSalary: false,
      salaryQty: '',
      salary_info: '',
      salary_base: '',
      salary_compensation: '',
      chkWork: false,
      workQty: '',
      chkLetter: false,
      letterBank: '',
      letterQty: '',
      slipCount: 0,
      cardDocCount: 0,
      abroadDocCount: 0,
      reportDocCount: 0,
      updateDocCount: 0,
      letterDocCount: 0,
      reasonDocCount: 0,
      educationRequestDocCount: 0,
      chkDegree: false,
      chkMarriage: false,
      chkDivorce: false,
      chkLetter4: false,
      letterBank4: '',
      letterQty4: '',
      education_level: '',
      qualification: '',
      qualification_name: '',
      major_group: '',
      minor_group: '',
      institution: '',
      start_date: '',
      graduation_date: '',
      country: '',
      honor_type: '',
      'qualification-used': '',
    },
  })
}

async function downloadTemplateFile(fileUrl: string, fileName: string) {
  const response = await fetch(fileUrl)
  if (!response.ok) {
    throw new Error('ดาวน์โหลดไฟล์ไม่สำเร็จ')
  }

  const blob = await response.blob()
  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = blobUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(blobUrl)
}

function buildDocumentDetailPayload(values: Record<string, any>) {
  if (!documentRequest.value.id) {
    throw new Error('ไม่พบรหัสคำร้องหลัก')
  }

  switch (requestType.value) {
    case '1':
      requestGeneral.value = {
        ...requestGeneral.value,
        id: requestGeneral.value.id || generateUUID(),
        request_id: documentRequest.value.id,
        salary_cert_qty: values.chkSalary ? toNullableNumber(values.salaryQty) : null,
        work_cert_qty: values.chkWork ? toNullableNumber(values.workQty) : null,
        rights_auth_bank: values.chkLetter ? String(values.letterBank ?? '') : '',
        rights_auth_qty: values.chkLetter ? toNullableNumber(values.letterQty) : null,
        salary_info: String(values.salary_info ?? ''),
        academic_allowance: String(values.salary_base ?? ''),
        compensation_allowance: String(values.salary_compensation ?? ''),
      }
      return requestGeneral.value
    case '4':
      requestHistory.value = {
        ...requestHistory.value,
        id: requestHistory.value.id || generateUUID(),
        request_id: documentRequest.value.id,
        is_qualification_added: Boolean(values.chkDegree),
        is_marriage_registered: Boolean(values.chkMarriage),
        is_divorce_registered: Boolean(values.chkDivorce),
        rights_auth_bank: values.chkLetter4 ? String(values.letterBank4 ?? '') : '',
        rights_auth_qty: values.chkLetter4 ? toNullableNumber(values.letterQty4) : null,
      }
      return requestHistory.value
    case '5':
      requestEducationRecords.value = {
        ...requestEducationRecords.value,
        id: requestEducationRecords.value.id || generateUUID(),
        request_id: documentRequest.value.id,
        education_level: String(values.education_level ?? ''),
        qualification: String(values.qualification ?? ''),
        qualification_name: String(values.qualification_name ?? ''),
        major_group: String(values.major_group ?? ''),
        minor_group: String(values.minor_group ?? ''),
        institution: String(values.institution ?? ''),
        country: String(values.country ?? ''),
        start_date: String(values.start_date ?? ''),
        graduation_date: String(values.graduation_date ?? ''),
        honor_type: String(values.honor_type ?? ''),
        is_used_for_first_appointment: String(values['qualification-used'] ?? '').includes('บรรจุ'),
        is_highest_degree: String(values['qualification-used'] ?? '').includes('สูงสุด'),
        is_meets_position_standard: null,
        is_recognized_by_kksa: null,
        is_recognized_by_ocsc: null,
      }
      return requestEducationRecords.value
    default:
      return null
  }
}

async function createDocumentType() {
  const datasetId =  DOCUMENT_EDIT.DATASET_ID //'document_create'
  const version = DOCUMENT_EDIT.DATASET_VERSION_DOCUMENT_REQUEST //'v1.0.0'

  documentRequest.value.id = generateUUID()
  documentRequest.value.person_id = authStore.user?.id || ''
  documentRequest.value.document_type = (getRequestTypeLabel() as DocumentRequest['document_type']) || null
  documentRequest.value.created_at = new Date().toISOString()
  documentRequest.value.updated_at = new Date().toISOString()

  try {
    await createDatasetRow(datasetId, version, documentRequest.value)
    return documentRequest.value.id
  } catch (error: any) {
    console.error('Create Document Type API Error:', error)
    console.error('Error Response:', error?.response?.data)
    toast.error(`สร้างคำร้องไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
    throw error
  }
}

async function uploadFile() {
  const files = getSelectedFiles()
  const params: CreateFileDocumentParams = {
    path: 'file-req',
    folder: 'file',
    uploaded_by: getCurrentUserName(),
    description: getRequestTypeLabel() || '-',
  }

  try {
    const uploadedKeys: string[] = []

    for (const file of files) {
      const response = await createFileDocument<FileDocument>(file, params)
      if (!response.data?.resource_id) {
        throw new Error('อัปโหลดไฟล์ไม่สำเร็จ')
      }
      uploadedKeys.push(response.data.resource_id)
    }

    uploadedDocumentKeys.value = uploadedKeys
    return uploadedKeys
  } catch (error: any) {
    console.error('Document Upload API Error:', error)
    console.error('Error Response:', error?.response?.data)
    toast.error(`อัปโหลดไฟล์ไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
    throw error
  }
}

async function getFileTemplateType2() {
  
  try {
    const response = await getFileDocumentRows(FILE_KEY_TEMPLATES.DOCUMENT_TYPE_2)
    console.log('getFileTemplateType2:', response.data)
    urlDownload2.value = response.data?.url || ''
    downloadFileName2.value = response.data?.original_filename || 'template-type-2'
  } catch (error: any) {
   
    throw error
  }
}

async function getFileTemplateType3() {
  
  try {
    const response = await getFileDocumentRows(FILE_KEY_TEMPLATES.DOCUMENT_TYPE_3)
    console.log('getFileTemplateType3:', response.data)
    urlDownload3.value = response.data?.url || ''
    downloadFileName3.value = response.data?.original_filename || 'template-type-3'
  } catch (error: any) {
    
    throw error
  }
}
async function getFileTemplateType4_1() {
  
  try {
    const response = await getFileDocumentRows(FILE_KEY_TEMPLATES.DOCUMENT_TYPE_4_1)
    console.log('getFileTemplateType4_1:', response.data)
    urlDownload4_1.value = response.data?.url || ''
    downloadFileName4_1.value = response.data?.original_filename || 'template-type-4-1'
  } catch (error: any) {
    
    throw error
  }
}
async function getFileTemplateType4_2() {
  
  try {
    const response = await getFileDocumentRows(FILE_KEY_TEMPLATES.DOCUMENT_TYPE_4_2)
    console.log('getFileTemplateType4_2:', response.data)
    urlDownload4_2.value = response.data?.url || ''
    downloadFileName4_2.value = response.data?.original_filename || 'template-type-4-2'
  } catch (error: any) {
    throw error
  }
}

async function handleDownloadTemplate(fileUrl: string, fileName: string) {
  if (!fileUrl) {
    toast.error('ไม่พบไฟล์สำหรับดาวน์โหลด', {
      position: 'bottom-right',
    })
    return
  }

  try {
    await downloadTemplateFile(fileUrl, fileName || 'template')
  } catch (error: any) {
    toast.error(`ดาวน์โหลดไฟล์ไม่สำเร็จ: ${error?.message || 'เกิดข้อผิดพลาด'}`, {
      position: 'bottom-right',
    })
  }
}
async function storeFile(documentIds: string[]) {
  const datasetId =  DOCUMENT_EDIT.DATASET_ID //'document_create'
  const version = DOCUMENT_EDIT.DATASET_VERSION_DOCUMENT_LINK //'v1.1.0'

  try {
    for (const documentId of documentIds) {
      documentLink.value = {
        document_key: documentId,
        entity_table: 'document_request',
        entity_id: documentRequest.value.id,
        purpose: getRequestTypeLabel(),
        person_id: documentRequest.value.person_id,
        created_at: new Date().toISOString(),
      }

      await createDatasetRow(datasetId, version, documentLink.value)
    }
  } catch (error: any) {
    console.error('Store File API Error:', error)
    console.error('Error Response:', error?.response?.data)
    toast.error(`บันทึกลิงก์ไฟล์ไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
    throw error
  }
}

async function createDocumentDetail(values: Record<string, any>) {
  const data = buildDocumentDetailPayload(values)
  const datasetId =  DOCUMENT_EDIT.DATASET_ID //'document_create'
  let version: 'v1.2.0' | 'v1.2.1' | 'v1.2.2' | null = null

  switch (requestType.value) {
    case '1':
      version = 'v1.2.1'
      break
    case '4':
      version = 'v1.2.2'
      break
    case '5':
      version = 'v1.2.0'
      break
    default:
      return null
  }

  if (!data || !version) {
    return null
  }

  try {
    await createDatasetRow(datasetId, version, data)
    return data
  } catch (error: any) {
    console.error('Create Document Detail API Error:', error)
    console.error('Error Response:', error?.response?.data)
    toast.error(`บันทึกรายละเอียดคำร้องไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
    throw error
  }
}

 type FileSelectOptions = {
  maxFiles?: number
}

function syncFileCountField(key: string, value?: number, shouldValidate = false) {
  const fieldName = fileCountFieldMap[key]
  if (!fieldName) return
  const nextValue = typeof value === 'number' ? value : fileMap.value[key]?.length || 0
  formRef.value?.setFieldValue(fieldName, nextValue, shouldValidate)
}

function syncSlipCountField(value?: number, shouldValidate = false) {
  syncFileCountField('slip', value, shouldValidate)
}

function resetAllFileCounts() {
  Object.keys(fileCountFieldMap).forEach((key) => syncFileCountField(key, 0))
  fileSizeErrors.value = {}
}

function handleFileSelect(
  event: Event,
  key: string,
  multiple = false,
  onValueChange?: (value: number) => void,
  options?: FileSelectOptions,
) {
  const input = event.target as HTMLInputElement
  if (options?.maxFiles !== undefined && options.maxFiles <= 0) {
    input.value = ''
    return
  }
  const files = Array.from(input?.files || [])
  const acceptedFiles = files.filter((file) => file.size <= MAX_FILE_SIZE)
  const rejectedFiles = files.filter((file) => file.size > MAX_FILE_SIZE)
  if (!fileMap.value[key]) fileMap.value[key] = []

  if (multiple) {
    const maxAdditional = options?.maxFiles
      ? Math.max(options.maxFiles - fileMap.value[key].length, 0)
      : acceptedFiles.length
    if (maxAdditional <= 0) {
      input.value = ''
      return
    }
    fileMap.value[key].push(...acceptedFiles.slice(0, maxAdditional))
  } else {
    fileMap.value[key] = acceptedFiles.slice(0, 1)
  }

  fileSizeErrors.value[key] = rejectedFiles.length > 0 ? FILE_SIZE_ERROR_MESSAGE : undefined

  input.value = ''
  const length = fileMap.value[key]?.length || 0
  onValueChange?.(length)
  if (!onValueChange) {
    syncFileCountField(key, length)
  }
}

function triggerFileInput(key: string) {
  const input = fileInputRefs.value[key]
  input?.click()
}

function removeFile(key: string, index: number, onValueChange?: (value: number) => void) {
  if (!fileMap.value[key]) return
  fileMap.value[key].splice(index, 1)
  fileSizeErrors.value[key] = undefined
  const length = fileMap.value[key]?.length || 0
  onValueChange?.(length)
  if (!onValueChange) {
    syncFileCountField(key, length, true)
  }
}

function getFileErrorMessage(key: string, errors: string[]) {
  return fileSizeErrors.value[key] || errors[0] || ''
}

function formatFileSize(bytes: number) {
  if (!bytes) return '0 KB'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1)
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
}

function clearType1DependentFields(type: 'salary' | 'work' | 'letter') {
  if (type === 'salary') {
    salaryQty.value = ''
    formRef.value?.setFieldValue('salaryQty', '')
  }

  if (type === 'work') {
    workQty.value = ''
    formRef.value?.setFieldValue('workQty', '')
  }

  if (type === 'letter') {
    letterBank.value = ''
    letterQty.value = ''
    formRef.value?.setFieldValue('letterBank', '')
    formRef.value?.setFieldValue('letterQty', '')
  }
}

function clearType4LetterFields() {
  letterBank4.value = ''
  letterQty4.value = ''
  formRef.value?.setFieldValue('letterBank4', '')
  formRef.value?.setFieldValue('letterQty4', '')
  if (fileMap.value['letter-doc']?.length) {
    fileMap.value['letter-doc'] = []
  }
  fileSizeErrors.value['letter-doc'] = undefined
  syncFileCountField('letter-doc', 0, true)
  const letterInput = fileInputRefs.value['letter-doc']
  if (letterInput) {
    letterInput.value = ''
  }
}

type Type4CheckboxKey = 'chkDegree' | 'chkMarriage' | 'chkDivorce' | 'chkLetter4'

const type4CheckboxRefs: Record<Type4CheckboxKey, typeof chkDegree> = {
  chkDegree,
  chkMarriage,
  chkDivorce,
  chkLetter4,
}

function updateType4Checkbox(key: Type4CheckboxKey, value: boolean) {
  const target = type4CheckboxRefs[key]
  if (!target) return
  target.value = value
  formRef.value?.setFieldValue(key, value)
}

function clearReasonDocs() {
  if (fileMap.value['reason-doc']?.length) {
    fileMap.value['reason-doc'] = []
  }
  fileSizeErrors.value['reason-doc'] = undefined
  syncFileCountField('reason-doc', 0, true)
  const reasonInput = fileInputRefs.value['reason-doc']
  if (reasonInput) {
    reasonInput.value = ''
  }
}

const reasonSelectionCount = computed(() => {
  let count = 0
  if (chkDegree.value) count += 1
  if (chkMarriage.value) count += 1
  if (chkDivorce.value) count += 1
  return count
})

const canUploadReasonDocs = computed(() => reasonSelectionCount.value > 0)

watch(reasonSelectionCount, (count) => {
  if (count <= 0) {
    clearReasonDocs()
    return
  }
  const reasonFiles = fileMap.value['reason-doc'] || []
  if (reasonFiles.length > count) {
    fileMap.value['reason-doc'] = reasonFiles.slice(0, count)
    syncFileCountField('reason-doc', fileMap.value['reason-doc'].length, true)
  }
})

const initialValues = computed(() => ({
  requestType: requestType.value,
  title: title.value,
  chkSalary: false,
  salaryQty: salaryQty.value,
  salary_info: salary_info.value,
  salary_base: salary_base.value,
  salary_compensation: salary_compensation.value,
  chkWork: false,
  workQty: workQty.value,
  chkLetter: false,
  letterBank: letterBank.value,
  letterQty: letterQty.value,
  slipCount: fileMap.value['slip']?.length || 0,
  cardDocCount: fileMap.value['card-doc']?.length || 0,
  abroadDocCount: fileMap.value['abroad-doc']?.length || 0,
  reportDocCount: fileMap.value['report-doc']?.length || 0,
  updateDocCount: fileMap.value['update-doc']?.length || 0,
  letterDocCount: fileMap.value['letter-doc']?.length || 0,
  reasonDocCount: fileMap.value['reason-doc']?.length || 0,
  educationRequestDocCount: fileMap.value['education-request-doc']?.length || 0,
  chkDegree: chkDegree.value,
  chkMarriage: chkMarriage.value,
  chkDivorce: chkDivorce.value,
  chkLetter4: chkLetter4.value,
  letterBank4: letterBank4.value,
  letterQty4: letterQty4.value,

  // Education fields
  education_level: educationData.value.education_level,
  qualification: educationData.value.qualification,
  qualification_name: educationData.value.qualification_name,
  major_group: educationData.value.major_group,
  minor_group: educationData.value.minor_group,
  institution: educationData.value.institution,
  start_date: educationData.value.start_date,
  graduation_date: educationData.value.graduation_date,
  country: educationData.value.country,
  honor_type: educationData.value.honor_type,
  'qualification-used': educationData.value['qualification-used'],
}))

/* Reset state when changing request type */
watch(requestType, () => {
  title.value = ''
  salaryQty.value = ''
  workQty.value = ''
  letterBank.value = ''
  letterQty.value = ''
  updateType4Checkbox('chkDegree', false)
  updateType4Checkbox('chkMarriage', false)
  updateType4Checkbox('chkDivorce', false)
  updateType4Checkbox('chkLetter4', false)
  clearType4LetterFields()
  fileMap.value = {}
  resetAllFileCounts()
  syncSlipCountField(0)
  if (formRef.value) {
    formRef.value.resetForm({ values: initialValues.value })
  }
})

const schema = computed(() => {
  // base shape
  const shape: Record<string, any> = {
    requestType: z.string().min(1, 'กรุณาเลือกประเภทคำร้อง'),
    title: z.string().optional(),

    chkSalary: z.boolean().optional(),
    salaryQty: z.string().optional(),
    // salary detail fields (required when requestType === '1')
    salary_info: z.string().optional(),
    salary_base: z.string().optional(),
    salary_compensation: z.string().optional(),
    chkWork: z.boolean().optional(),
    workQty: z.string().optional(),
    chkLetter: z.boolean().optional(),
    letterBank: z.string().optional(),
    letterQty: z.string().optional(),
    slipCount: z.number().optional(),
    cardDocCount: z.number().optional(),
    abroadDocCount: z.number().optional(),
    reportDocCount: z.number().optional(),
    updateDocCount: z.number().optional(),
    letterDocCount: z.number().optional(),
    reasonDocCount: z.number().optional(),
    educationRequestDocCount: z.number().optional(),

    chkDegree: z.boolean().optional(),
    chkMarriage: z.boolean().optional(),
    chkDivorce: z.boolean().optional(),
    chkLetter4: z.boolean().optional(),
    letterBank4: z.string().optional(),
    letterQty4: z.string().optional(),

    // Education fields (type 5)
    education_level: z.string().optional(),
    qualification: z.string().optional(),
    qualification_name: z.string().optional(),
    major_group: z.string().optional(),
    minor_group: z.string().optional(),
    institution: z.string().optional(),
    start_date: z.string().optional(),
    graduation_date: z.string().optional(),
    country: z.string().optional(),
    honor_type: z.string().optional(),
    'qualification-used': z.string().optional(),
  }

  const base = z.object(shape).superRefine((data, ctx) => {
    // requestType specific validations
    if (data.requestType === '1') {
      const hasType1Selection = Boolean(data.chkSalary || data.chkWork || data.chkLetter)
      if (!hasType1Selection) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['chkSalary'],
          message: 'กรุณาเลือกอย่างน้อย 1 รายการ',
        })
      }
      // require salary detail fields for request type 1
      if (!data.salary_info || String(data.salary_info).trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['salary_info'],
          message: 'กรุณากรอกข้อมูลเงินเดือน',
        })
      }
      if (!data.salary_base || String(data.salary_base).trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['salary_base'],
          message: 'กรุณากรอกเงินวิทยฐานะ',
        })
      }
      if (!data.salary_compensation || String(data.salary_compensation).trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['salary_compensation'],
          message: 'กรุณากรอกเงินค่าตอบแทน',
        })
      }
      // if checkboxes selected, require their qty/bank
      if (data.chkSalary && (!data.salaryQty || String(data.salaryQty).trim() === '')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['salaryQty'],
          message: 'กรุณากรอกจำนวนใบรับรองเงินเดือน',
        })
      }
      if (data.chkWork && (!data.workQty || String(data.workQty).trim() === '')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['workQty'],
          message: 'กรุณากรอกจำนวนใบรับรองการปฏิบัติงาน',
        })
      }
      if (data.chkLetter) {
        if (!data.letterBank || String(data.letterBank).trim() === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['letterBank'],
            message: 'กรุณาเลือกธนาคาร',
          })
        }
        if (!data.letterQty || String(data.letterQty).trim() === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['letterQty'],
            message: 'กรุณากรอกจำนวน',
          })
        }
      }
      // require at least one slip file regardless of checkbox selections
      if (!data.slipCount || data.slipCount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['slipCount'],
          message: 'กรุณาแนบสลิปเงินเดือน',
        })
      }
    }

    if (data.requestType === '4') {
      const hasType4Selection = Boolean(
        data.chkDegree || data.chkMarriage || data.chkDivorce || data.chkLetter4,
      )
      if (!hasType4Selection) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['chkDegree'],
          message: 'กรุณาเลือกเหตุผลอย่างน้อย 1 รายการ',
        })
      }
    }

    if (data.requestType === '4' || data.requestType === '5') {
      const reasonSelectionTotal =
        Number(data.chkDegree ? 1 : 0) +
        Number(data.chkMarriage ? 1 : 0) +
        Number(data.chkDivorce ? 1 : 0)

      if (reasonSelectionTotal > 0) {
        if (!data.reasonDocCount || data.reasonDocCount < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['reasonDocCount'],
            message: 'กรุณาแนบไฟล์หลักฐานเหตุผลที่เลือก',
          })
        }
        if ((data.reasonDocCount || 0) > reasonSelectionTotal) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['reasonDocCount'],
            message: 'แนบไฟล์ได้ไม่เกินจำนวนเหตุผลที่เลือก',
          })
        }
      }

      if (data.chkLetter4) {
        if (!data.letterBank4 || String(data.letterBank4).trim() === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['letterBank4'],
            message: 'กรุณาเลือกธนาคาร',
          })
        }
        if (!data.letterQty4 || String(data.letterQty4).trim() === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['letterQty4'],
            message: 'กรุณากรอกจำนวน',
          })
        }
        if (!data.letterDocCount || data.letterDocCount <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['letterDocCount'],
            message: 'กรุณาแนบไฟล์หนังสือผ่านสิทธิ์',
          })
        }
      }
    }

    if (data.requestType === '2' && (!data.cardDocCount || data.cardDocCount <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cardDocCount'],
        message: 'กรุณาแนบไฟล์คำขอบัตรประจำตัว',
      })
    }

    if (data.requestType === '3' && (!data.abroadDocCount || data.abroadDocCount <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['abroadDocCount'],
        message: 'กรุณาแนบไฟล์คำร้องขออนุญาตไปต่างประเทศ',
      })
    }

    if (data.requestType === '5') {
      // Validate all education fields
      const educationFields = [
        { key: 'education_level', label: 'ระดับการศึกษา' },
        { key: 'qualification', label: 'วุฒิการศึกษา' },
        { key: 'qualification_name', label: 'ชื่อวุฒิการศึกษา' },
        { key: 'major_group', label: 'สาขาวิชาเอก' },
        { key: 'institution', label: 'สถานศึกษา' },
        { key: 'start_date', label: 'วันที่เข้าศึกษา' },
        { key: 'graduation_date', label: 'วันที่สำเร็จการศึกษา' },
        { key: 'country', label: 'ประเทศ' },
        { key: 'qualification-used', label: 'วุฒิที่ใช้บรรจุ' },
      ]

      educationFields.forEach(({ key, label }) => {
        const value = data[key as keyof typeof data]
        if (!value || String(value).trim() === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${label} จำเป็นต้องกรอก`,
          })
        }
      })

      if (!data.educationRequestDocCount || data.educationRequestDocCount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['educationRequestDocCount'],
          message: 'กรุณาแนบไฟล์คำร้องขอเพิ่มวุติการศึกษา',
        })
      }
    }
  })

  return toTypedSchema(base)
})



async function onSubmit(values: Record<string, any>) {
  isSubmitting.value = true
  const payload: Record<string, any> = { ...values }
  payload.files = { ...fileMap.value }

  try {
    console.log(
      'CreateDocument submit payload:',
      JSON.parse(JSON.stringify(payload, getCircularReplacer())),
    )
  } catch (_error) {
    // ignore
     toast.error(`เกิดข้อผิดพลาด: ${_error}`, {
      position: 'bottom-right',
    })
  }
  try {
    await createDocumentType()
    const uploadedKeys = await uploadFile()
    await storeFile(uploadedKeys)
    if (requestType.value === '1' || requestType.value === '4' || requestType.value === '5') {
      await createDocumentDetail(values)
    }

    toast.success('ยื่นคำร้องสำเร็จ', {
      position: 'bottom-right',
    })
    resetCreateDocumentForm()
  } catch (_error) {
    // แต่ละฟังก์ชันจัดการ error toast ของตัวเองแล้ว
     toast.error(`ยื่นคำร้องไม่สำเร็จ: ${_error}`, {
      position: 'bottom-right',
    })
  } finally {
    isSubmitting.value = false
  }
}

// helper for safe JSON stringify (in case of File objects)
function getCircularReplacer() {
  const seen = new WeakSet()
  return function (_key: any, value: any) {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return
      seen.add(value)
      // replace File objects with filename for logging
      if (value instanceof File) return { name: value.name, size: value.size, type: value.type }
    }
    return value
  }
}
async function submitDocForm() {
  if (isSubmitting.value) return

  // sync ค่าเข้า form ก่อน (เหมือนเดิม)
  formRef.value?.setFieldValue('requestType', requestType.value)
  formRef.value?.setFieldValue('salaryQty', salaryQty.value)

  formRef.value?.setFieldValue('salary_info', salary_info.value ?? '')
  formRef.value?.setFieldValue('salary_base', salary_base.value ?? '')
  formRef.value?.setFieldValue('salary_compensation', salary_compensation.value ?? '')

  formRef.value?.setFieldValue('workQty', workQty.value)
  formRef.value?.setFieldValue('letterBank', letterBank.value)
  formRef.value?.setFieldValue('letterQty', letterQty.value)
  formRef.value?.setFieldValue('letterBank4', letterBank4.value)
  formRef.value?.setFieldValue('letterQty4', letterQty4.value)
  formRef.value?.setFieldValue('chkDegree', chkDegree.value)
  formRef.value?.setFieldValue('chkMarriage', chkMarriage.value)
  formRef.value?.setFieldValue('chkDivorce', chkDivorce.value)
  formRef.value?.setFieldValue('chkLetter4', chkLetter4.value)

  // Sync education fields for type 5
  formRef.value?.setFieldValue('education_level', educationData.value.education_level)
  formRef.value?.setFieldValue('qualification', educationData.value.qualification)
  formRef.value?.setFieldValue('qualification_name', educationData.value.qualification_name)
  formRef.value?.setFieldValue('major_group', educationData.value.major_group)
  formRef.value?.setFieldValue('minor_group', educationData.value.minor_group)
  formRef.value?.setFieldValue('institution', educationData.value.institution)
  formRef.value?.setFieldValue('start_date', educationData.value.start_date)
  formRef.value?.setFieldValue('graduation_date', educationData.value.graduation_date)
  formRef.value?.setFieldValue('country', educationData.value.country)
  formRef.value?.setFieldValue('honor_type', educationData.value.honor_type)
  formRef.value?.setFieldValue('qualification-used', educationData.value['qualification-used'])

  Object.keys(fileCountFieldMap).forEach((key) => {
    const length = fileMap.value[key]?.length || 0
    syncFileCountField(key, length, true)
  })

  if (requestType.value === '1') {
    formRef.value?.setFieldTouched?.('chkSalary', true, true)
    await formRef.value?.validateField?.('chkSalary')
  }

  if (requestType.value === '4') {
    formRef.value?.setFieldTouched?.('chkDegree', true, true)
    await formRef.value?.validateField?.('chkDegree')
  }

  if (requestType.value === '5') {
    // Mark all education fields as touched for type 5
    const educationFields = [
      'education_level',
      'qualification',
      'qualification_name',
      'major_group',
      'institution',
      'start_date',
      'graduation_date',
      'country',
      'qualification-used',
      'educationRequestDocCount',
    ]
    educationFields.forEach((field) => {
      formRef.value?.setFieldTouched?.(field, true, true)
    })
  }

  const formElement = document.getElementById('doc-form') as HTMLFormElement | null
  formElement?.requestSubmit()
}

onMounted(() => {
  getFileTemplateType2()
  getFileTemplateType3()
  getFileTemplateType4_1()
  getFileTemplateType4_2()
})

</script>

<template>
  <div class="mx-6 flex flex-col gap-4 pb-6">
    <Card class="w-full gap-3 pb-6">
      <CardContent>
        <VeeForm
          ref="formRef"
          v-slot="{ values }"
          :validation-schema="schema"
          :initial-values="initialValues"
          id="doc-form"
          @submit="onSubmit"
        >
          <!-- ══════════ Header: หัวข้อ + ประเภทคำร้อง ══════════ -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <VeeField name="requestType" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel>ประเภทคำร้อง <span class="text-red-500">*</span></FieldLabel>
                <Select
                  :model-value="field.value"
                  @update:model-value="
                    (v) => {
                      field.onChange?.(v)
                      requestType = String(v ?? '')
                    }
                  "
                >
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="เลือกประเภทคำร้อง" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="opt in requestTypeOptions"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
          </div>

          <!-- Type 1: คำร้องขอเอกสาร -->
          <template v-if="requestType === '1'">
            <Separator class="my-4" />

            <!-- ใบรับรองเงินเดือน -->
            <div class="mb-4 flex flex-wrap items-start gap-4">
              <VeeField name="chkSalary" v-slot="{ field, errors }">
                <div class="mt-2 flex min-w-40 flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <Checkbox
                      id="chk-salary"
                      :model-value="Boolean(field.value)"
                      @update:model-value="
                        (checked: boolean | 'indeterminate') => {
                          const isChecked = checked === true
                          field.onChange?.(isChecked)
                          if (!isChecked) clearType1DependentFields('salary')
                        }
                      "
                    />
                    <Label for="chk-salary" class="cursor-pointer"> ใบรับรองเงินเดือน </Label>
                  </div>
                  <FieldError v-if="errors.length" :errors="errors" />
                </div>
              </VeeField>

              <VeeField name="salaryQty" v-slot="{ field, errors }">
                <Field class="w-64" :data-invalid="!!errors.length">
                  <FieldLabel>จำนวน <span class="text-red-500">*</span></FieldLabel>
                  <Input
                    :disabled="!values.chkSalary"
                    :model-value="field.value"
                    @update:model-value="
                      (v: any) => {
                        const normalizedValue = normalizeStringInput(v)
                        field.onChange?.(normalizedValue)
                        salaryQty = normalizedValue
                      }
                    "
                    type="number"
                    min="1"
                    max="100"
                    placeholder="กรอกจำนวน"
                  />
                  <FieldError v-if="errors.length" :errors="errors" />
                </Field>
              </VeeField>
            </div>

            <!-- ใบรับรองการปฏิบัติงาน -->
            <div class="mb-4 flex flex-wrap items-start gap-4">
              <VeeField name="chkWork" v-slot="{ field }">
                <div class="mt-2 flex min-w-40 items-center gap-2">
                  <Checkbox
                    id="chk-work"
                    :model-value="Boolean(field.value)"
                    @update:model-value="
                      (checked: boolean | 'indeterminate') => {
                        const isChecked = checked === true
                        field.onChange?.(isChecked)
                        if (!isChecked) clearType1DependentFields('work')
                      }
                    "
                  />
                  <Label for="chk-work" class="cursor-pointer"> ใบรับรองการปฏิบัติงาน </Label>
                </div>
              </VeeField>

              <VeeField name="workQty" v-slot="{ field, errors }">
                <Field class="w-64" :data-invalid="!!errors.length">
                  <FieldLabel>จำนวน <span class="text-red-500">*</span></FieldLabel>
                  <Input
                    :disabled="!values.chkWork"
                    :model-value="field.value"
                    @update:model-value="
                      (v: any) => {
                        const normalizedValue = normalizeStringInput(v)
                        field.onChange?.(normalizedValue)
                        workQty = normalizedValue
                      }
                    "
                    type="number"
                    min="1"
                    max="100"
                    placeholder="กรอกจำนวน"
                  />
                  <FieldError v-if="errors.length" :errors="errors" />
                </Field>
              </VeeField>
            </div>

            <!-- เอกสารหนังสือผ่านสิทธิ์ -->
            <div class="mb-4 flex flex-wrap items-start gap-4">
              <VeeField name="chkLetter" v-slot="{ field }">
                <div class="mt-2 flex min-w-40 items-center gap-2">
                  <Checkbox
                    id="chk-letter"
                    :model-value="Boolean(field.value)"
                    @update:model-value="
                      (checked: boolean | 'indeterminate') => {
                        const isChecked = checked === true
                        field.onChange?.(isChecked)
                        if (!isChecked) clearType1DependentFields('letter')
                      }
                    "
                  />
                  <Label for="chk-letter" class="cursor-pointer"> เอกสารหนังสือผ่านสิทธิ์ </Label>
                </div>
              </VeeField>

              <VeeField name="letterBank" v-slot="{ field, errors }">
                <Field class="w-64" :data-invalid="!!errors.length">
                  <FieldLabel>ธนาคาร <span class="text-red-500">*</span></FieldLabel>
                  <Select
                    :disabled="!values.chkLetter"
                    :model-value="field.value"
                    @update:model-value="
                      (v: any) => {
                        field.onChange?.(v)
                        letterBank = String(v ?? '')
                      }
                    "
                  >
                    <SelectTrigger class="w-full">
                      <SelectValue placeholder="เลือก" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="b in bankOptions" :key="b.value" :value="b.value">
                        {{ b.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError v-if="errors.length" :errors="errors" />
                </Field>
              </VeeField>

              <VeeField name="letterQty" v-slot="{ field, errors }">
                <Field class="w-64" :data-invalid="!!errors.length">
                  <FieldLabel>จำนวน <span class="text-red-500">*</span></FieldLabel>
                  <Input
                    :disabled="!values.chkLetter"
                    :model-value="field.value"
                    @update:model-value="
                      (v: any) => {
                        const normalizedValue = normalizeStringInput(v)
                        field.onChange?.(normalizedValue)
                        letterQty = normalizedValue
                      }
                    "
                    type="number"
                    min="1"
                    max="100"
                    placeholder="กรอกจำนวน"
                  />
                  <FieldError v-if="errors.length" :errors="errors" />
                </Field>
              </VeeField>
            </div>

            <ErrorMessage name="chkSalary" v-slot="{ message }">
              <p class="text-sm text-red-500">{{ message }}</p>
            </ErrorMessage>

            <!-- แนบสลิปเงินเดือน -->
            <div class="mt-2">
              <div class="mb-4 flex flex-wrap items-end gap-4">
                <VeeField name="salary_info" v-slot="{ field, errors }">
                  <Field class="w-64" :data-invalid="!!errors.length">
                    <FieldLabel>ข้อมูลเงินเดือน <span class="text-red-500">*</span></FieldLabel>
                    <Input
                      :model-value="field.value"
                      @update:model-value="
                        (v) => {
                          field.onChange?.(v)
                          salary_info = String(v ?? '')
                        }
                      "
                      type="text"
                      placeholder="ข้อมูลเงินเดือน"
                    />
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>

                <VeeField name="salary_base" v-slot="{ field, errors }">
                  <Field class="w-64" :data-invalid="!!errors.length">
                    <FieldLabel>เงินวิทยฐานะ <span class="text-red-500">*</span></FieldLabel>
                    <Input
                      :model-value="field.value"
                      @update:model-value="
                        (v) => {
                          field.onChange?.(v)
                          salary_base = String(v ?? '')
                        }
                      "
                      type="text"
                      placeholder="เงินวิทยฐานะ"
                    />
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>

                <VeeField name="salary_compensation" v-slot="{ field, errors }">
                  <Field class="w-64" :data-invalid="!!errors.length">
                    <FieldLabel>เงินค่าตอบแทน <span class="text-red-500">*</span></FieldLabel>
                    <Input
                      :model-value="field.value"
                      @update:model-value="
                        (v) => {
                          field.onChange?.(v)
                          salary_compensation = String(v ?? '')
                        }
                      "
                      type="text"
                      placeholder="เงินค่าตอบแทน"
                    />
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>
              </div>
              <VeeField name="slipCount" v-slot="{ field, errors }">
                <div>
                  <p class="mb-2 text-sm font-semibold">
                    แนบสลิปเงินเดือน<span class="text-red-500"> *</span>
                  </p>
                  <input
                    :ref="
                      (el: any) => {
                        if (el) fileInputRefs['slip'] = el as HTMLInputElement
                      }
                    "
                    type="file"
                    class="hidden"
                    accept=".pdf,.jpg,.png"
                    @change="handleFileSelect($event, 'slip', false, field.onChange)"
                  />
                  <Button type="button" class="cursor-pointer" @click="triggerFileInput('slip')">
                    <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
                  </Button>
                  <div v-if="fileMap['slip']?.length" class="mt-2 flex flex-col gap-1">
                    <div
                      v-for="(file, i) in fileMap['slip']"
                      :key="i"
                      class="border-muted bg-muted/40 flex min-h-11 w-full max-w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm"
                    >
                      <span class="min-w-0 flex-1 truncate">{{ file.name }}</span>
                      <span class="text-muted-foreground shrink-0 text-xs">{{
                        formatFileSize(file.size)
                      }}</span>
                      <button
                        type="button"
                        class="hover:text-destructive text-muted-foreground rounded p-0.5 cursor-pointer"
                        @click="removeFile('slip', i, field.onChange)"
                      >
                        <X class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p v-if="getFileErrorMessage('slip', errors)" class="mt-2 text-sm text-red-600">
                    {{ getFileErrorMessage('slip', errors) }}
                  </p>
                </div>
              </VeeField>
            </div>
          </template>

          <!-- Type 2: คำขอบัตรประจำตัว -->
          <template v-if="requestType === '2'">
            <Separator class="my-4" />
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p class="mb-2 text-sm font-semibold">แบบฟอร์มเอกสารคำขอบัตรประจำตัว</p>
                <Button
                  type="button"
                  class="cursor-pointer"
                  variant="default"
                  @click="handleDownloadTemplate(urlDownload2, downloadFileName2)"
                >
                  <FileText class="mr-1 h-4 w-4" /> ดาวโหลดไฟล์
                </Button>
              </div>
              <VeeField name="cardDocCount" v-slot="{ field, errors }">
                <div>
                  <p class="mb-2 text-sm font-semibold">
                    แนบเอกสาร<span class="text-red-500"> *</span>
                  </p>
                  <input
                    :ref="
                      (el: any) => {
                        if (el) fileInputRefs['card-doc'] = el as HTMLInputElement
                      }
                    "
                    type="file"
                    class="hidden"
                    accept=".pdf,.jpg,.png"
                    @change="handleFileSelect($event, 'card-doc', false, field.onChange)"
                  />
                  <Button
                    type="button"
                    class="cursor-pointer"
                    variant="destructive"
                    @click="triggerFileInput('card-doc')"
                  >
                    <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
                  </Button>
                  <div v-if="fileMap['card-doc']?.length" class="mt-2 flex flex-col gap-1">
                    <div
                      v-for="(file, i) in fileMap['card-doc']"
                      :key="i"
                      class="border-muted bg-muted/40 flex min-h-11 w-full max-w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm"
                    >
                      <span class="min-w-0 flex-1 truncate">{{ file.name }}</span>
                      <span class="text-muted-foreground shrink-0 text-xs">{{
                        formatFileSize(file.size)
                      }}</span>
                      <button
                        type="button"
                        class="hover:text-destructive text-muted-foreground rounded p-0.5 cursor-pointer"
                        @click="removeFile('card-doc', i, field.onChange)"
                      >
                        <X class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p
                    v-if="getFileErrorMessage('card-doc', errors)"
                    class="mt-2 text-sm text-red-600"
                  >
                    {{ getFileErrorMessage('card-doc', errors) }}
                  </p>
                </div>
              </VeeField>
            </div>
          </template>

          <!-- Type 3: คำร้องขออนุญาตไปต่างประเทศ -->
          <template v-if="requestType === '3'">
            <Separator class="my-4" />
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p class="mb-2 text-sm font-semibold">แบบฟอร์มเอกสารคำร้องขออนุญาตไปต่างประเทศ</p>
                <Button
                  type="button"
                  class="cursor-pointer"
                  variant="default"
                  @click="handleDownloadTemplate(urlDownload3, downloadFileName3)"
                >
                  <FileText class="mr-1 h-4 w-4" /> ดาวโหลดไฟล์
                </Button>
              </div>
              <VeeField name="abroadDocCount" v-slot="{ field, errors }">
                <div>
                  <p class="mb-2 text-sm font-semibold">
                    แนบเอกสาร<span class="text-red-500">*</span>
                  </p>
                  <input
                    :ref="
                      (el: any) => {
                        if (el) fileInputRefs['abroad-doc'] = el as HTMLInputElement
                      }
                    "
                    type="file"
                    class="hidden"
                    accept=".pdf,.jpg,.png"
                    @change="handleFileSelect($event, 'abroad-doc', false, field.onChange)"
                  />
                  <Button
                    type="button"
                    class="cursor-pointer"
                    variant="destructive"
                    @click="triggerFileInput('abroad-doc')"
                  >
                    <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
                  </Button>
                  <div v-if="fileMap['abroad-doc']?.length" class="mt-2 flex flex-col gap-1">
                    <div
                      v-for="(file, i) in fileMap['abroad-doc']"
                      :key="i"
                      class="border-muted bg-muted/40 flex min-h-11 w-fit  max-w-xl items-center gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm"
                    >
                      <span class="truncate">{{ file.name }}</span>
                      <span class="text-muted-foreground shrink-0 text-xs">{{
                        formatFileSize(file.size)
                      }}</span>
                      <button
                        type="button"
                        class="hover:text-destructive text-muted-foreground rounded p-0.5 cursor-pointer"
                        @click="removeFile('abroad-doc', i, field.onChange)"
                      >
                        <X class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p
                    v-if="getFileErrorMessage('abroad-doc', errors)"
                    class="mt-2 text-sm text-red-600"
                  >
                    {{ getFileErrorMessage('abroad-doc', errors) }}
                  </p>
                </div>
              </VeeField>
            </div>
          </template>

          <!-- Type 4: แบบรายงานเปลี่ยนแปลงหรือเพิ่มเติมรายการลงในสมุดประวัติ -->
          <template v-if="requestType === '4'">
            <Separator class="my-4" />

            <!-- Checkboxes -->
            <div class="mb-4 flex flex-wrap items-center gap-6">
              <VeeField name="chkDegree" v-slot="{ field }">
                <div class="flex items-center gap-2">
                  <Checkbox
                    id="chk-degree"
                    :model-value="Boolean(field.value)"
                    @update:model-value="
                      (checked: boolean | 'indeterminate') => {
                        const isChecked = checked === true
                        field.onChange?.(isChecked)
                        chkDegree = isChecked
                      }
                    "
                  />
                  <Label for="chk-degree" class="cursor-pointer">ได้รับวุฒิเพิ่ม(ปรับวุฒิ)</Label>
                </div>
              </VeeField>

              <VeeField name="chkMarriage" v-slot="{ field }">
                <div class="flex items-center gap-2">
                  <Checkbox
                    id="chk-marriage"
                    :model-value="Boolean(field.value)"
                    @update:model-value="
                      (checked: boolean | 'indeterminate') => {
                        const isChecked = checked === true
                        field.onChange?.(isChecked)
                        chkMarriage = isChecked
                      }
                    "
                  />
                  <Label for="chk-marriage" class="cursor-pointer">จดทะเบียนสมรส</Label>
                </div>
              </VeeField>

              <VeeField name="chkDivorce" v-slot="{ field }">
                <div class="flex items-center gap-2">
                  <Checkbox
                    id="chk-divorce"
                    :model-value="Boolean(field.value)"
                    @update:model-value="
                      (checked: boolean | 'indeterminate') => {
                        const isChecked = checked === true
                        field.onChange?.(isChecked)
                        chkDivorce = isChecked
                      }
                    "
                  />
                  <Label for="chk-divorce" class="cursor-pointer">จดทะเบียนหย่า</Label>
                </div>
              </VeeField>
            </div>

            <ErrorMessage name="chkDegree" v-slot="{ message }">
              <p class="text-sm text-red-500">{{ message }}</p>
            </ErrorMessage>

            <!-- Download + Upload แบบรายงาน -->
            <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p class="mb-2 text-sm font-semibold">
                  แบบรายงานเปลี่ยนแปลงหรือเพิ่มเติมรายการลงในสมุดประวัติ
                </p>
                <Button
                  type="button"
                  class="cursor-pointer"
                  variant="default"
                  @click="handleDownloadTemplate(urlDownload4_1, downloadFileName4_1)"
                >
                  <FileText class="mr-1 h-4 w-4" /> ดาวโหลดไฟล์
                </Button>
              </div>

              <VeeField name="reasonDocCount" v-slot="{ field, errors }">
                <div>
                  <div class="mb-2 flex flex-wrap items-center gap-2">
                    <p class="text-sm font-semibold">
                      แนบไฟล์หลักฐานเหตุผล<span class="text-red-500">*</span>
                    </p>
                    <span class="text-muted-foreground text-xs">
                      {{
                        canUploadReasonDocs
                          ? `อัปโหลดได้สูงสุด ${reasonSelectionCount} ไฟล์`
                          : 'กรุณาเลือกเหตุผลก่อน'
                      }}
                    </span>
                  </div>
                  <input
                    :ref="
                      (el: any) => {
                        if (el) fileInputRefs['reason-doc'] = el as HTMLInputElement
                      }
                    "
                    type="file"
                    class="hidden"
                    accept=".pdf,.jpg,.png"
                    multiple
                    :disabled="!canUploadReasonDocs"
                    @change="
                      handleFileSelect($event, 'reason-doc', true, field.onChange, {
                        maxFiles: canUploadReasonDocs ? reasonSelectionCount : 0,
                      })
                    "
                  />
                  <Button
                    type="button"
                    class="cursor-pointer"
                    variant="destructive"
                    :disabled="!canUploadReasonDocs"
                    @click="triggerFileInput('reason-doc')"
                  >
                    <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
                  </Button>
                  <div v-if="fileMap['reason-doc']?.length" class="mt-2 flex flex-col gap-1">
                    <div
                      v-for="(file, i) in fileMap['reason-doc']"
                      :key="i"
                      class="border-muted bg-muted/40 flex min-h-11 w-full max-w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm"
                    >
                      <span class="min-w-0 flex-1 truncate">{{ file.name }}</span>
                      <span class="text-muted-foreground shrink-0 text-xs">{{
                        formatFileSize(file.size)
                      }}</span>
                      <button
                        type="button"
                        class="hover:text-destructive text-muted-foreground rounded p-0.5 cursor-pointer"
                        @click="removeFile('reason-doc', i, field.onChange)"
                      >
                        <X class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p
                    v-if="getFileErrorMessage('reason-doc', errors)"
                    class="mt-2 text-sm text-red-600"
                  >
                    {{ getFileErrorMessage('reason-doc', errors) }}
                  </p>
                </div>
              </VeeField>
            </div>

            <Separator class="my-4" />

            <!-- เอกสารหนังสือผ่านสิทธิ์ -->
            <div class="mb-4 flex flex-wrap items-center gap-4">
              <VeeField name="chkLetter4" v-slot="{ field }">
                <div class="mt-2 flex min-w-40 items-center gap-2">
                  <Checkbox
                    id="chk-letter4"
                    :model-value="Boolean(field.value)"
                    @update:model-value="
                      (checked: boolean | 'indeterminate') => {
                        const isChecked = checked === true
                        field.onChange?.(isChecked)
                        chkLetter4 = isChecked
                        if (!isChecked) {
                          clearType4LetterFields()
                        }
                      }
                    "
                  />
                  <Label for="chk-letter4" class="cursor-pointer">เอกสารหนังสือผ่านสิทธิ์</Label>
                </div>
              </VeeField>

              <VeeField name="letterBank4" v-slot="{ field, errors }">
                <Field class="w-64" :data-invalid="!!errors.length">
                  <FieldLabel>ธนาคาร <span class="text-red-500">*</span></FieldLabel>
                  <Select
                    :disabled="!values.chkLetter4"
                    :model-value="field.value"
                    @update:model-value="
                      (v: any) => {
                        field.onChange?.(v)
                        letterBank4 = String(v ?? '')
                      }
                    "
                  >
                    <SelectTrigger class="w-full">
                      <SelectValue placeholder="เลือก" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="b in bankOptions" :key="b.value" :value="b.value">
                        {{ b.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError v-if="errors.length" :errors="errors" />
                </Field>
              </VeeField>

              <VeeField name="letterQty4" v-slot="{ field, errors }">
                <Field class="w-64" :data-invalid="!!errors.length">
                  <FieldLabel>จำนวน <span class="text-red-500">*</span></FieldLabel>
                  <Input
                    :disabled="!values.chkLetter4"
                    :model-value="field.value"
                    @update:model-value="
                      (v: any) => {
                        const normalizedValue = normalizeStringInput(v)
                        field.onChange?.(normalizedValue)
                        letterQty4 = normalizedValue
                      }
                    "
                    type="number"
                    min="1"
                    max="100"
                    placeholder="กรอกจำนวน"
                  />
                  <FieldError v-if="errors.length" :errors="errors" />
                </Field>
              </VeeField>
            </div>

            <!-- Download + Upload แบบคำขอเพิ่ม -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p class="mb-2 text-sm font-semibold">
                  แบบคำขอเพิ่ม/ปรับปรุงข้อมูลในฐานข้อมูลบุคลากรภาครัฐ
                </p>
                <Button
                  type="button"
                  class="cursor-pointer"
                  variant="default"
                  @click="handleDownloadTemplate(urlDownload4_2, downloadFileName4_2)"
                >
                  <FileText class="mr-1 h-4 w-4" /> ดาวโหลดไฟล์
                </Button>
              </div>
              <VeeField name="letterDocCount" v-slot="{ field, errors }">
                <div class="w-full max-w-sm">
                  <p class="mb-2 text-sm font-semibold">
                    แนบไฟล์หนังสือผ่านสิทธิ์<span class="text-red-500">*</span>
                  </p>
                  <input
                    :ref="
                      (el: any) => {
                        if (el) fileInputRefs['letter-doc'] = el as HTMLInputElement
                      }
                    "
                    type="file"
                    class="hidden"
                    accept=".pdf,.jpg,.png"
                    :disabled="!values.chkLetter4"
                    @change="handleFileSelect($event, 'letter-doc', false, field.onChange)"
                  />
                  <Button
                    type="button"
                    class="cursor-pointer"
                    variant="destructive"
                    :disabled="!values.chkLetter4"
                    @click="triggerFileInput('letter-doc')"
                  >
                    <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
                  </Button>
                  <div v-if="fileMap['letter-doc']?.length" class="mt-2 flex flex-col gap-1">
                    <div
                      v-for="(file, i) in fileMap['letter-doc']"
                      :key="i"
                      class="border-muted bg-muted/40 flex min-h-11 w-full max-w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm"
                    >
                      <span class="min-w-0 flex-1 truncate">{{ file.name }}</span>
                      <span class="text-muted-foreground shrink-0 text-xs">{{
                        formatFileSize(file.size)
                      }}</span>
                      <button
                        type="button"
                        class="hover:text-destructive text-muted-foreground rounded p-0.5 cursor-pointer"
                        @click="removeFile('letter-doc', i, field.onChange)"
                      >
                        <X class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p
                    v-if="getFileErrorMessage('letter-doc', errors)"
                    class="mt-2 text-sm text-red-600"
                  >
                    {{ getFileErrorMessage('letter-doc', errors) }}
                  </p>
                </div>
              </VeeField>
            </div>
          </template>

          <!-- Type 5: คำร้องขอเพิ่มวุติการศึกษา -->
          <template v-if="requestType === '5'">
            <Separator class="my-4" />

            <!-- Education Information Form using VeeForm -->
            <div class="space-y-4">
              <!-- Row 1: Education Level, Qualification -->
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <VeeField name="education_level" v-slot="{ field, errors }">
                  <Field :data-invalid="!!errors.length">
                    <FieldLabel>ระดับการศึกษา<span class="text-red-500">*</span></FieldLabel>
                    <Input
                      :model-value="field.value"
                      @update:model-value="field.onChange"
                      placeholder="เช่น ปริญญาตรี"
                    />
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>
                <VeeField name="qualification" v-slot="{ field, errors }">
                  <Field :data-invalid="!!errors.length">
                    <FieldLabel>วุฒิการศึกษา<span class="text-red-500">*</span></FieldLabel>
                    <Input
                      :model-value="field.value"
                      @update:model-value="field.onChange"
                      placeholder="เช่น B.A., B.Sc."
                    />
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>
              </div>

              <!-- Row 2: Qualification Name, Major Group -->
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <VeeField name="qualification_name" v-slot="{ field, errors }">
                  <Field :data-invalid="!!errors.length">
                    <FieldLabel>ชื่อวุฒิการศึกษา<span class="text-red-500">*</span></FieldLabel>
                    <Input
                      :model-value="field.value"
                      @update:model-value="field.onChange"
                      placeholder="เช่น ศิลปศาสตร์"
                    />
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>
                <VeeField name="major_group" v-slot="{ field, errors }">
                  <Field :data-invalid="!!errors.length">
                    <FieldLabel>สาขาวิชาเอก<span class="text-red-500">*</span></FieldLabel>
                    <Input
                      :model-value="field.value"
                      @update:model-value="field.onChange"
                      placeholder="เช่น ภาษาไทย"
                    />
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>
              </div>

              <!-- Row 3: Minor Group, Institution -->
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <VeeField name="minor_group" v-slot="{ field }">
                  <Field>
                    <FieldLabel>สาขาวิชาโท</FieldLabel>
                    <Input
                      :model-value="field.value"
                      @update:model-value="field.onChange"
                      placeholder="หากมี"
                    />
                  </Field>
                </VeeField>
                <VeeField name="institution" v-slot="{ field, errors }">
                  <Field :data-invalid="!!errors.length">
                    <FieldLabel>สถานศึกษา<span class="text-red-500">*</span></FieldLabel>
                    <Input
                      :model-value="field.value"
                      @update:model-value="field.onChange"
                      placeholder="เช่น มหาวิทยาลัยศรีนครินทร์วิโรฒ"
                    />
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>
              </div>

              <!-- Row 4: Start Date, Graduation Date -->
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <VeeField name="start_date" v-slot="{ field, errors }">
                  <Field :data-invalid="!!errors.length">
                    <FieldLabel>วันที่เข้าศึกษา<span class="text-red-500">*</span></FieldLabel>
                    <Popover v-model:open="datePopoverOpen['start_date']">
                      <PopoverTrigger as-child>
                        <Button
                          variant="outline"
                          :class="[
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          ]"
                        >
                          <CalendarIcon class="mr-2 h-4 w-4" />
                          {{
                            field.value
                              ? formatDisplayDate(field.value as string)
                              : 'วว / ดด / ปปปป'
                          }}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent class="w-auto p-0" align="start">
                        <Calendar
                          :model-value="stringToDateValue(field.value as string)"
                          layout="month-and-year"
                          @update:model-value="
                            (val: DateValue | undefined) => {
                              if (val) {
                                field.onChange?.(dateValueToString(val))
                                datePopoverOpen['start_date'] = false
                              }
                            }
                          "
                        />
                      </PopoverContent>
                    </Popover>
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>
                <VeeField name="graduation_date" v-slot="{ field, errors }">
                  <Field :data-invalid="!!errors.length">
                    <FieldLabel>วันที่สำเร็จการศึกษา<span class="text-red-500">*</span></FieldLabel>
                    <Popover v-model:open="datePopoverOpen['graduation_date']">
                      <PopoverTrigger as-child>
                        <Button
                          variant="outline"
                          :class="[
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          ]"
                        >
                          <CalendarIcon class="mr-2 h-4 w-4" />
                          {{
                            field.value
                              ? formatDisplayDate(field.value as string)
                              : 'วว / ดด / ปปปป'
                          }}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent class="w-auto p-0" align="start">
                        <Calendar
                          :model-value="stringToDateValue(field.value as string)"
                          layout="month-and-year"
                          @update:model-value="
                            (val: DateValue | undefined) => {
                              if (val) {
                                field.onChange?.(dateValueToString(val))
                                datePopoverOpen['graduation_date'] = false
                              }
                            }
                          "
                        />
                      </PopoverContent>
                    </Popover>
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>
              </div>

              <!-- Row 5: Country, Honor Type -->
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <VeeField name="country" v-slot="{ field, errors }">
                  <Field :data-invalid="!!errors.length">
                    <FieldLabel>ประเทศ<span class="text-red-500">*</span></FieldLabel>
                    <Input
                      :model-value="field.value"
                      @update:model-value="field.onChange"
                      placeholder="เช่น ไทย"
                    />
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>
                <VeeField name="honor_type" v-slot="{ field }">
                  <Field>
                    <FieldLabel>เกียรตินิยม</FieldLabel>
                    <Input
                      :model-value="field.value"
                      @update:model-value="field.onChange"
                      placeholder="หากมี"
                    />
                  </Field>
                </VeeField>
              </div>

              <!-- Qualification Used -->
              <VeeField name="qualification-used" v-slot="{ field, errors }">
                <Field :data-invalid="!!errors.length">
                  <FieldLabel
                    >วุฒิที่ใช้บรรจุ/วุฒิการศึกษาสูงสุด<span class="text-red-500"
                      >*</span
                    ></FieldLabel
                  >
                  <Input
                    :model-value="field.value"
                    @update:model-value="field.onChange"
                    placeholder="ระบุวุฒิ"
                  />
                  <FieldError v-if="errors.length" :errors="errors" />
                </Field>
              </VeeField>
            </div>

            <Separator class="my-4" />

            <!-- Education Request File Upload -->
            <VeeField name="educationRequestDocCount" v-slot="{ field, errors }">
              <div>
                <p class="mb-2 text-sm font-semibold">
                  แนบไฟล์คำร้องขอเพิ่มวุติการศึกษา<span class="text-red-500">*</span>
                </p>
                <input
                  :ref="
                    (el: any) => {
                      if (el) fileInputRefs['education-request-doc'] = el as HTMLInputElement
                    }
                  "
                  type="file"
                  class="hidden"
                  accept=".pdf,.jpg,.png"
                  @change="handleFileSelect($event, 'education-request-doc', false, field.onChange)"
                />
                <Button
                  type="button"
                  class="cursor-pointer"
                  variant="destructive"
                  @click="triggerFileInput('education-request-doc')"
                >
                  <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
                </Button>
                <div
                  v-if="fileMap['education-request-doc']?.length"
                  class="mt-2 flex flex-col gap-1"
                >
                  <div
                    v-for="(file, i) in fileMap['education-request-doc']"
                    :key="i"
                    class="border-muted bg-muted/40 flex min-h-11 w-full max-w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm"
                  >
                    <span class="min-w-0 flex-1 truncate">{{ file.name }}</span>
                    <span class="text-muted-foreground shrink-0 text-xs">{{
                      formatFileSize(file.size)
                    }}</span>
                    <button
                      type="button"
                      class="hover:text-destructive text-muted-foreground rounded p-0.5 cursor-pointer"
                      @click="removeFile('education-request-doc', i, field.onChange)"
                    >
                      <X class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p
                  v-if="getFileErrorMessage('education-request-doc', errors)"
                  class="mt-2 text-sm text-red-600"
                >
                  {{ getFileErrorMessage('education-request-doc', errors) }}
                </p>
              </div>
            </VeeField>
          </template>
        </VeeForm>
      </CardContent>

      <!-- ══════════ Footer: Submit button ══════════ -->
      <!-- <div v-if="requestType" class="flex justify-end px-6 pb-4">
        <Button type="button" class="cursor-pointer" class="px-6"> ยื่นคำร้อง </Button>
      </div> -->
    </Card>
  </div>
  <div
    class="sticky right-0 bottom-0 z-40 mt-8 flex w-full justify-end border-t border-gray-200 bg-white/95 px-6 py-4 backdrop-blur"
  >
    <Button
      type="button"
      class="min-w-32 cursor-pointer rounded-xl bg-[#16A34A] px-8 py-2.5 font-semibold text-white shadow-sm hover:bg-[#15803D]"
      :disabled="isSubmitting"
      @click="submitDocForm()"
    >
      <Spinner v-if="isSubmitting" class="mr-2 h-4 w-4" />
      ยื่นคำร้อง
    </Button>
  </div>
</template>
