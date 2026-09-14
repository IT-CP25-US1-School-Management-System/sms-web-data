<script setup lang="ts">
import { FileText, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ref, computed } from 'vue'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form as VeeForm, Field as VeeField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { toast } from 'vue-sonner'
import { generateUUID } from '@/lib/helpers'
import { useAuthStore } from '@/stores/auth'
import { createDatasetRow, deleteDatasetRow } from '@/stores/dataset'
import { createFileDocument, deleteFileDocument } from '@/stores/document'
import type { CreateFileDocumentParams, FileDocument } from '@/types/document'
import type { DocumentLink, DocumentRequest, RequestCommitteePA } from '@/types/document_request'
import { DOCUMENT_EDIT } from '@/lib/constants'
import { PA_UPLOAD_FIELDS, preparePAUploadFile, type PAUploadKey } from '@/lib/paUpload'
import { subjectGroups } from '@/lib/subjectGroups'

const fileMap = ref<Record<string, File[]>>({})
const fileInputRefs = ref<Record<string, HTMLInputElement | null>>({})
const fileSizeErrors = ref<Record<string, string | undefined>>({})
const formRef = ref<any>(null)
const isSubmitting = ref(false)
const MAX_FILE_SIZE = 15 * 1024 * 1024
const FILE_SIZE_ERROR_MESSAGE = `ขนาดไฟล์ต้องไม่เกิน ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))} MB`
const authStore = useAuthStore()

const subject_group = ref('')
const teaching_level_1 = ref('')
const subject_name = ref('')
const salary = ref('')
const teaching_hours_per_week = ref('')
const support_hours_per_week = ref('')
const dev_quality_hours_per_week = ref('')
const policy_hours_per_week = ref('')
const committee_name_1 = ref('')
const committee_name_2 = ref('')
const committee_name_3 = ref('')

const documentRequest = ref<DocumentRequest>({
  id: '',
  person_id: '',
  document_type: 'การประเมินPA',
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

function hourSchema(requiredMessage: string) {
  return z
    .union([z.string(), z.number()])
    .refine(
      (value) =>
        String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0,
      requiredMessage,
    )
}

function requiredText(message: string) {
  return z.string().trim().min(1, message)
}

const subjectGroupIds = new Set(subjectGroups.map((group) => String(group.id)))

const validationSchema = computed(() => {
  return toTypedSchema(
    z.object({
      subject_group: requiredText('กลุ่มสาระการเรียนรู้ จำเป็นต้องเลือก').refine(
        (value) => subjectGroupIds.has(value),
        'กลุ่มสาระการเรียนรู้ไม่ถูกต้อง',
      ),
      teaching_level_1: requiredText('ปฏิบัติการสอนชั้น/ระดับ จำเป็นต้องกรอก'),
      subject_name: requiredText('รายวิชา จำเป็นต้องกรอก'),
      salary: hourSchema('เงินเดือนปัจจุบัน จำเป็นต้องกรอก'),
      teaching_hours_per_week: hourSchema('การสอนตามตารางสอน จำเป็นต้องกรอก'),
      support_hours_per_week: hourSchema('งานส่งเสริมและสนับสนุนการจัดการเรียนรู้ จำเป็นต้องกรอก'),
      dev_quality_hours_per_week: hourSchema('งานพัฒนาคุณภาพการศึกษา จำเป็นต้องกรอก'),
      policy_hours_per_week: hourSchema('งานตอบสนองนโยบายและจุดเน้น จำเป็นต้องกรอก'),
      committee_name_1: requiredText('คนที่ 1 จำเป็นต้องกรอก'),
      committee_name_2: requiredText('คนที่ 2 จำเป็นต้องกรอก'),
      committee_name_3: requiredText('คนที่ 3 จำเป็นต้องกรอก'),
      'pa2-pa1-count': z.number().min(1, 'PA1 จำเป็นต้องแนบไฟล์'),
      'pa2-eval1-count': z.number().min(1, 'PA2 กรรมการคนที่ 1 จำเป็นต้องแนบไฟล์'),
      'pa2-eval2-count': z.number().min(1, 'PA2 กรรมการคนที่ 2 จำเป็นต้องแนบไฟล์'),
      'pa2-eval3-count': z.number().min(1, 'PA2 กรรมการคนที่ 3 จำเป็นต้องแนบไฟล์'),
      'pa3-count': z.number().min(1, 'PA3 จำเป็นต้องแนบไฟล์'),
    }),
  )
})

const initialValues = computed(() => ({
  subject_group: subject_group.value,
  teaching_level_1: teaching_level_1.value,
  subject_name: subject_name.value,
  salary: salary.value,
  teaching_hours_per_week: teaching_hours_per_week.value,
  support_hours_per_week: support_hours_per_week.value,
  dev_quality_hours_per_week: dev_quality_hours_per_week.value,
  policy_hours_per_week: policy_hours_per_week.value,
  committee_name_1: committee_name_1.value,
  committee_name_2: committee_name_2.value,
  committee_name_3: committee_name_3.value,
  'pa2-pa1-count': fileMap.value['pa2-pa1']?.length || 0,
  'pa2-eval1-count': fileMap.value['pa2-eval1']?.length || 0,
  'pa2-eval2-count': fileMap.value['pa2-eval2']?.length || 0,
  'pa2-eval3-count': fileMap.value['pa2-eval3']?.length || 0,
  'pa3-count': fileMap.value['pa3']?.length || 0,
}))

function handleFileSelect(event: Event, key: PAUploadKey, multiple = false) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input?.files || [])
  const acceptedFiles = files
    .filter((file) => file.size <= MAX_FILE_SIZE)
    .map((file) => preparePAUploadFile(file, key))
  const rejectedFiles = files.filter((file) => file.size > MAX_FILE_SIZE)
  if (!fileMap.value[key]) fileMap.value[key] = []
  if (multiple) {
    fileMap.value[key].push(...acceptedFiles)
  } else {
    fileMap.value[key] = acceptedFiles.slice(0, 1)
  }
  fileSizeErrors.value[key] = rejectedFiles.length > 0 ? FILE_SIZE_ERROR_MESSAGE : undefined
  input.value = ''
  const countField = `${key}-count`
  formRef.value?.setFieldValue(countField, fileMap.value[key].length, false)
  formRef.value?.validateField?.(countField)
}

function removeFile(key: PAUploadKey, idx: number) {
  fileMap.value[key]?.splice(idx, 1)
  fileSizeErrors.value[key] = undefined
  const countField = `${key}-count`
  formRef.value?.setFieldValue(countField, fileMap.value[key]?.length || 0, false)
  formRef.value?.validateField?.(countField)
}

function getFileErrorMessage(key: string, errors: string[]) {
  return fileSizeErrors.value[key] || errors[0] || ''
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function triggerFileInput(key: PAUploadKey) {
  fileInputRefs.value[key]?.click()
}

function getCurrentUserName() {
  return (
    authStore.user?.name || authStore.user?.given_name || authStore.user?.email || 'current-user'
  )
}

function getSelectedFiles() {
  return PA_UPLOAD_FIELDS.flatMap((field) =>
    (fileMap.value[field.key] || []).map((file) => ({ field, file })),
  )
}

function resetEvaluationPAForm() {
  subject_group.value = ''
  teaching_level_1.value = ''
  subject_name.value = ''
  salary.value = ''
  teaching_hours_per_week.value = ''
  support_hours_per_week.value = ''
  dev_quality_hours_per_week.value = ''
  policy_hours_per_week.value = ''
  committee_name_1.value = ''
  committee_name_2.value = ''
  committee_name_3.value = ''
  documentRequest.value.id = ''
  fileMap.value = {}
  fileSizeErrors.value = {}

  Object.values(fileInputRefs.value).forEach((input) => {
    if (input) input.value = ''
  })

  formRef.value?.resetForm({
    values: {
      subject_group: '',
      teaching_level_1: '',
      subject_name: '',
      salary: '',
      teaching_hours_per_week: '',
      support_hours_per_week: '',
      dev_quality_hours_per_week: '',
      policy_hours_per_week: '',
      committee_name_1: '',
      committee_name_2: '',
      committee_name_3: '',
      'pa2-pa1-count': 0,
      'pa2-eval1-count': 0,
      'pa2-eval2-count': 0,
      'pa2-eval3-count': 0,
      'pa3-count': 0,
    },
  })
}

function toNumber(value: unknown) {
  return Number(value)
}

function buildDocumentDetailPayload(values: Record<string, any>): RequestCommitteePA {
  if (!documentRequest.value.id) {
    throw new Error('ไม่พบรหัสคำร้องหลัก')
  }

  return {
    id: generateUUID(),
    request_id: documentRequest.value.id,
    subject_group: String(values.subject_group ?? ''),
    teaching_level_1: String(values.teaching_level_1 ?? ''),
    teaching_level_2: '',
    subject_name: String(values.subject_name ?? ''),
    salary: toNumber(values.salary),
    teaching_hours_per_week: toNumber(values.teaching_hours_per_week),
    support_hours_per_week: toNumber(values.support_hours_per_week),
    dev_quality_hours_per_week: toNumber(values.dev_quality_hours_per_week),
    policy_hours_per_week: toNumber(values.policy_hours_per_week),
    committee_name_1: String(values.committee_name_1 ?? ''),
    committee_name_2: String(values.committee_name_2 ?? ''),
    committee_name_3: String(values.committee_name_3 ?? ''),
  }
}

async function createDocumentType() {
  const datasetId = DOCUMENT_EDIT.DATASET_ID //'document_create'
  const version = DOCUMENT_EDIT.DATASET_VERSION_DOCUMENT_REQUEST //'v1.0.0'

  documentRequest.value.id = generateUUID()
  documentRequest.value.person_id = authStore.user?.id || ''
  documentRequest.value.document_type = 'การประเมินPA'
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

async function uploadFile(uploadedFiles: { documentKey: string; category: string }[] = []) {
  const files = getSelectedFiles()
  const params: CreateFileDocumentParams = {
    path: 'file-req',
    folder: 'file',
    uploaded_by: getCurrentUserName(),
    description: 'การประเมินPA',
  }

  try {
    for (const { file, field } of files) {
      const response = await createFileDocument<FileDocument>(file, params)
      if (!response.data?.resource_id) {
        throw new Error('อัปโหลดไฟล์ไม่สำเร็จ')
      }
      uploadedFiles.push({
        documentKey: response.data.resource_id,
        category: field.category,
      })
    }

    return uploadedFiles
  } catch (error: any) {
    console.error('Document Upload API Error:', error)
    console.error('Error Response:', error?.response?.data)
    toast.error(`อัปโหลดไฟล์ไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
    throw error
  }
}

async function storeFile(uploadedFiles: { documentKey: string; category: string }[]) {
  const datasetId = DOCUMENT_EDIT.DATASET_ID //'document_create'
  const version = DOCUMENT_EDIT.DATASET_VERSION_DOCUMENT_LINK //'v1.1.0'

  try {
    for (const uploadedFile of uploadedFiles) {
      documentLink.value = {
        document_key: uploadedFile.documentKey,
        entity_table: 'document_request',
        entity_id: documentRequest.value.id,
        purpose: uploadedFile.category,
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

  try {
    await createDatasetRow<RequestCommitteePA>(
      DOCUMENT_EDIT.DATASET_ID,
      DOCUMENT_EDIT.DATASET_VERSION_COMMITTEE_PA,
      data,
      DOCUMENT_EDIT.VIEW_COMMITTEE_PA,
    )
    return data
  } catch (error: any) {
    console.error('Create Document Detail API Error:', error)
    console.error('Error Response:', error?.response?.data)
    toast.error(
      `บันทึกรายละเอียดคำร้องไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      {
        position: 'bottom-right',
      },
    )
    throw error
  }
}

async function rollbackIncompleteRequest(
  uploadedFiles: { documentKey: string }[],
  requestCreated: boolean,
) {
  let requestDeleted = !requestCreated

  if (requestCreated && documentRequest.value.id) {
    try {
      await deleteDatasetRow(
        DOCUMENT_EDIT.DATASET_ID,
        DOCUMENT_EDIT.DATASET_VERSION_DOCUMENT_REQUEST,
        documentRequest.value.id,
      )
      requestDeleted = true
      documentRequest.value.id = ''
    } catch (rollbackError) {
      console.error('Document request rollback error:', rollbackError)
    }
  }

  if (requestDeleted && uploadedFiles.length) {
    const cleanupResults = await Promise.allSettled(
      uploadedFiles.map((file) => deleteFileDocument(file.documentKey)),
    )
    cleanupResults.forEach((result) => {
      if (result.status === 'rejected') {
        console.error('PA file rollback error:', result.reason)
      }
    })
  }
}

async function onSubmit(values: Record<string, any>) {
  isSubmitting.value = true
  const uploadedFiles: { documentKey: string; category: string }[] = []
  let requestCreated = false

  try {
    await uploadFile(uploadedFiles)
    await createDocumentType()
    requestCreated = true
    await createDocumentDetail(values)
    await storeFile(uploadedFiles)
    resetEvaluationPAForm()

    toast.success('ยื่นคำร้องสำเร็จ', { position: 'bottom-right' })
  } catch {
    await rollbackIncompleteRequest(uploadedFiles, requestCreated)
    toast.error('ยื่นคำร้องไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่', {
      position: 'bottom-right',
    })
  } finally {
    isSubmitting.value = false
  }
}

async function submitPA2Form() {
  if (isSubmitting.value) return

  formRef.value?.setFieldValue('subject_group', subject_group.value)
  formRef.value?.setFieldValue('teaching_level_1', teaching_level_1.value)
  formRef.value?.setFieldValue('subject_name', subject_name.value)
  formRef.value?.setFieldValue('salary', salary.value)
  formRef.value?.setFieldValue('teaching_hours_per_week', teaching_hours_per_week.value)
  formRef.value?.setFieldValue('support_hours_per_week', support_hours_per_week.value)
  formRef.value?.setFieldValue('dev_quality_hours_per_week', dev_quality_hours_per_week.value)
  formRef.value?.setFieldValue('policy_hours_per_week', policy_hours_per_week.value)
  formRef.value?.setFieldValue('committee_name_1', committee_name_1.value)
  formRef.value?.setFieldValue('committee_name_2', committee_name_2.value)
  formRef.value?.setFieldValue('committee_name_3', committee_name_3.value)
  formRef.value?.setFieldValue('pa2-pa1-count', fileMap.value['pa2-pa1']?.length || 0)
  formRef.value?.setFieldValue('pa2-eval1-count', fileMap.value['pa2-eval1']?.length || 0)
  formRef.value?.setFieldValue('pa2-eval2-count', fileMap.value['pa2-eval2']?.length || 0)
  formRef.value?.setFieldValue('pa2-eval3-count', fileMap.value['pa2-eval3']?.length || 0)
  formRef.value?.setFieldValue('pa3-count', fileMap.value['pa3']?.length || 0)

  const fieldNames = [
    'subject_group',
    'teaching_level_1',
    'subject_name',
    'salary',
    'teaching_hours_per_week',
    'support_hours_per_week',
    'dev_quality_hours_per_week',
    'policy_hours_per_week',
    'committee_name_1',
    'committee_name_2',
    'committee_name_3',
    'pa2-pa1-count',
    'pa2-eval1-count',
    'pa2-eval2-count',
    'pa2-eval3-count',
    'pa3-count',
  ]

  for (const fieldName of fieldNames) {
    formRef.value?.setFieldTouched?.(fieldName, true, true)
    await formRef.value?.validateField?.(fieldName)
  }

  const result = await formRef.value?.validate?.()
  if (!result?.valid) {
    toast.error('กรุณากรอกข้อมูลและแนบเอกสารที่จำเป็นให้ครบถ้วน', {
      position: 'bottom-right',
    })
    return
  }

  await onSubmit((result.values || {}) as Record<string, any>)
}
</script>
<template>
  <div class="mx-4 flex flex-col gap-4 pb-6 sm:mx-6">
    <Card class="w-full gap-0 pb-6">
      <CardHeader class="pb-0">
        <CardTitle>รายละเอียดการประเมิน PA</CardTitle>
      </CardHeader>
      <CardContent>
        <VeeForm
          ref="formRef"
          :validation-schema="validationSchema"
          :initial-values="initialValues"
          id="pa-evaluation-form"
          @submit="onSubmit"
        >
          <Separator class="my-4" />
          <div class="mb-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <VeeField name="subject_group" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel>กลุ่มสาระการเรียนรู้ <span class="text-red-500">*</span></FieldLabel>
                <Select
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      subject_group = String(v ?? '')
                    }
                  "
                >
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="เลือก" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="group in subjectGroups"
                      :key="group.id"
                      :value="String(group.id)"
                    >
                      {{ group.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="teaching_level_1" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel>ปฏิบัติการสอนชั้น/ระดับ <span class="text-red-500">*</span></FieldLabel>
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      teaching_level_1 = String(v ?? '')
                    }
                  "
                  type="text"
                  placeholder=""
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="subject_name" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel>รายวิชา <span class="text-red-500">*</span></FieldLabel>
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      subject_name = String(v ?? '')
                    }
                  "
                  type="text"
                  placeholder="เช่น 1.ภาษาอังกฤษ1 ชั้น ม.4"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="salary" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel>เงินเดือนปัจจุบัน <span class="text-red-500">*</span></FieldLabel>
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      salary = String(v ?? '')
                    }
                  "
                  type="number"
                  min="0"
                  step="0.01"
                  inputmode="decimal"
                  placeholder="จำนวนเงิน (บาท)"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
          </div>

          <div class="mb-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <VeeField name="teaching_hours_per_week" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel>การสอนตามตารางสอน <span class="text-red-500">*</span></FieldLabel>
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      teaching_hours_per_week = String(v ?? '')
                    }
                  "
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="จำนวนชั่วโมง / สัปดาห์"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="support_hours_per_week" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel
                  >งานส่งเสริมและสนับสนุนการจัดการเรียนรู้
                  <span class="text-red-500">*</span></FieldLabel
                >
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      support_hours_per_week = String(v ?? '')
                    }
                  "
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="จำนวนชั่วโมง / สัปดาห์"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="dev_quality_hours_per_week" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel
                  >งานพัฒนาคุณภาพการศึกษาของสถานศึกษา
                  <span class="text-red-500">*</span></FieldLabel
                >
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      dev_quality_hours_per_week = String(v ?? '')
                    }
                  "
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="จำนวนชั่วโมง / สัปดาห์"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="policy_hours_per_week" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel
                  >งานตอบสนองนโยบายและจุดเน้น <span class="text-red-500">*</span></FieldLabel
                >
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      policy_hours_per_week = String(v ?? '')
                    }
                  "
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="จำนวนชั่วโมง / สัปดาห์"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
          </div>

          <div class="mb-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <VeeField name="committee_name_1" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel
                  >รายชื่อคณะกรรมการประเมิน คนที่ 1 <span class="text-red-500">*</span></FieldLabel
                >
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      committee_name_1 = String(v ?? '')
                    }
                  "
                  type="text"
                  placeholder=""
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="committee_name_2" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel
                  >รายชื่อคณะกรรมการผู้ประเมิน คนที่ 2
                  <span class="text-red-500">*</span></FieldLabel
                >
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      committee_name_2 = String(v ?? '')
                    }
                  "
                  type="text"
                  placeholder=""
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="committee_name_3" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel
                  >รายชื่อคณะกรรมการผู้ประเมิน คนที่ 3
                  <span class="text-red-500">*</span></FieldLabel
                >
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      committee_name_3 = String(v ?? '')
                    }
                  "
                  type="text"
                  placeholder=""
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
          </div>

          <div class="mt-6 mb-3">
            <h3 class="font-semibold">เอกสารประกอบการประเมิน</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              แนบไฟล์ PDF ไม่เกิน 15 MB และตั้งชื่อไฟล์ตามตัวอย่างของแต่ละรายการ
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <VeeField
              v-for="uploadField in PA_UPLOAD_FIELDS"
              :key="uploadField.key"
              :name="uploadField.countField"
              v-slot="{ errors }"
            >
              <div class="flex min-w-0 flex-col rounded-lg border p-4">
                <p class="mb-1 text-sm font-semibold">
                  {{ uploadField.label }} <span class="text-red-500">*</span>
                </p>
                <p class="text-muted-foreground mb-3 text-xs">
                  ตั้งชื่อไฟล์ : {{ uploadField.filenameHint }}
                </p>
                <input
                  :ref="
                    (el: any) => {
                      if (el) fileInputRefs[uploadField.key] = el as HTMLInputElement
                    }
                  "
                  type="file"
                  class="hidden"
                  accept=".pdf"
                  @change="handleFileSelect($event, uploadField.key)"
                />
                <Button
                  type="button"
                  class="w-full cursor-pointer sm:w-fit"
                  @click="triggerFileInput(uploadField.key)"
                >
                  <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
                </Button>
                <div v-if="fileMap[uploadField.key]?.length" class="mt-3 flex flex-col gap-1">
                  <div
                    v-for="(file, i) in fileMap[uploadField.key]"
                    :key="`${file.name}-${i}`"
                    class="border-muted bg-muted/40 flex min-h-11 w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm"
                  >
                    <span class="min-w-0 flex-1 truncate">{{ file.name }}</span>
                    <span class="text-muted-foreground shrink-0 text-xs">{{
                      formatFileSize(file.size)
                    }}</span>
                    <button
                      type="button"
                      class="hover:text-destructive text-muted-foreground shrink-0 cursor-pointer rounded p-0.5"
                      :aria-label="`นำไฟล์ ${file.name} ออก`"
                      @click="removeFile(uploadField.key, i)"
                    >
                      <X class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p
                  v-if="getFileErrorMessage(uploadField.key, errors)"
                  class="mt-2 text-sm text-red-600"
                >
                  {{ getFileErrorMessage(uploadField.key, errors) }}
                </p>
              </div>
            </VeeField>
          </div>
        </VeeForm>
      </CardContent>
    </Card>
  </div>
  <div
    class="sticky right-0 bottom-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3"
  >
    <Button
      type="button"
      class="cursor-pointer rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]"
      :disabled="isSubmitting"
      @click="submitPA2Form"
    >
      <Spinner v-if="isSubmitting" class="mr-2 h-4 w-4" />
      ส่งเอกสาร
    </Button>
  </div>
</template>
<style></style>
