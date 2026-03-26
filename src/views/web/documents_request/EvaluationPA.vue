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
import { createDatasetRow } from '@/stores/dataset'
import { createFileDocument } from '@/stores/document'
import type { CreateFileDocumentParams, FileDocument } from '@/types/document'
import type { DocumentLink, DocumentRequest } from '@/types/document_request'

const fileMap = ref<Record<string, File[]>>({})
const fileInputRefs = ref<Record<string, HTMLInputElement | null>>({})
const fileSizeErrors = ref<Record<string, string | undefined>>({})
const formRef = ref<any>(null)
const isSubmitting = ref(false)
const MAX_FILE_SIZE = 15 * 1024 * 1024
const FILE_SIZE_ERROR_MESSAGE = `ขนาดไฟล์ต้องไม่เกิน ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))} MB`
const authStore = useAuthStore()

const pa2GroupSubject = ref('')
const pa2TeachLevel1 = ref('')
const pa2TeachLevel2 = ref('')
const pa2Subject = ref('')
const pa2TeachHours = ref('')
const pa2SupportHours = ref('')
const pa2QualityHours = ref('')
const pa2PolicyHours = ref('')
const pa2Evaluator1 = ref('')
const pa2Evaluator2 = ref('')
const pa2Evaluator3 = ref('')

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

const validationSchema = computed(() => {
  return toTypedSchema(
    z.object({
      pa2GroupSubject: z.string().min(1, 'กลุ่มสาระ จำเป็นต้องเลือก'),
      pa2TeachLevel1: z.string().min(1, 'ปฏิบัติการสอนชั้น/ระดับ จำเป็นต้องกรอก'),
      pa2TeachLevel2: z.string().min(1, 'ปฏิบัติการสอนชั้น/ระดับ จำเป็นต้องกรอก'),
      pa2Subject: z.string().min(1, 'รายวิชา จำเป็นต้องกรอก'),
      pa2TeachHours: z.string().min(1, 'การสอนตามตารางสอน จำเป็นต้องกรอก'),
      pa2SupportHours: z.string().min(1, 'งานส่งเสริมและสนับสนุนการจัดการเรียนรู้ จำเป็นต้องกรอก'),
      pa2QualityHours: z.string().min(1, 'งานพัฒนาคุณภาพการศึกษา จำเป็นต้องกรอก'),
      pa2PolicyHours: z.string().min(1, 'งานตอบสนองนโยบายและจุดเน้น จำเป็นต้องกรอก'),
      pa2Evaluator1: z.string().min(1, 'คนที่ 1 จำเป็นต้องกรอก'),
      pa2Evaluator2: z.string().min(1, 'คนที่ 2 จำเป็นต้องกรอก'),
      pa2Evaluator3: z.string().min(1, 'คนที่ 3 จำเป็นต้องกรอก'),
      'pa2-pa1-count': z.number().min(1, 'PA1 จำเป็นต้องแนบไฟล์'),
      'pa2-eval1-count': z.number().min(1, 'PA2 กรรมการคนที่ 1 จำเป็นต้องแนบไฟล์'),
      'pa2-eval2-count': z.number().min(1, 'PA2 กรรมการคนที่ 2 จำเป็นต้องแนบไฟล์'),
      'pa2-eval3-count': z.number().min(1, 'PA2 กรรมการคนที่ 3 จำเป็นต้องแนบไฟล์'),
    }),
  )
})

const initialValues = computed(() => ({
  pa2GroupSubject: pa2GroupSubject.value,
  pa2TeachLevel1: pa2TeachLevel1.value,
  pa2TeachLevel2: pa2TeachLevel2.value,
  pa2Subject: pa2Subject.value,
  pa2TeachHours: pa2TeachHours.value,
  pa2SupportHours: pa2SupportHours.value,
  pa2QualityHours: pa2QualityHours.value,
  pa2PolicyHours: pa2PolicyHours.value,
  pa2Evaluator1: pa2Evaluator1.value,
  pa2Evaluator2: pa2Evaluator2.value,
  pa2Evaluator3: pa2Evaluator3.value,
  'pa2-pa1-count': fileMap.value['pa2-pa1']?.length || 0,
  'pa2-eval1-count': fileMap.value['pa2-eval1']?.length || 0,
  'pa2-eval2-count': fileMap.value['pa2-eval2']?.length || 0,
  'pa2-eval3-count': fileMap.value['pa2-eval3']?.length || 0,
}))

const groupSubjectOptions = [
  { label: 'ภาษาไทย', value: 'thai' },
  { label: 'คณิตศาสตร์', value: 'math' },
  { label: 'วิทยาศาสตร์และเทคโนโลยี', value: 'science' },
  { label: 'สังคมศึกษา ศาสนาและวัฒนธรรม', value: 'social' },
  { label: 'ศิลปะ', value: 'art' },
  { label: 'สุขศึกษาและพลศึกษา', value: 'health' },
  { label: 'การงานอาชีพ', value: 'career' },
  { label: 'ภาษาต่างประเทศ', value: 'foreign' },
]

function handleFileSelect(event: Event, key: string, multiple = false) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input?.files || [])
  const acceptedFiles = files.filter((file) => file.size <= MAX_FILE_SIZE)
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

function removeFile(key: string, idx: number) {
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

function triggerFileInput(key: string) {
  fileInputRefs.value[key]?.click()
}

function getCurrentUserName() {
  return authStore.user?.name || authStore.user?.given_name || authStore.user?.email || 'current-user'
}

function getSelectedFiles(): File[] {
  return Object.values(fileMap.value).flatMap((files) => files ?? [])
}

function resetEvaluationPAForm() {
  pa2GroupSubject.value = ''
  pa2TeachLevel1.value = ''
  pa2TeachLevel2.value = ''
  pa2Subject.value = ''
  pa2TeachHours.value = ''
  pa2SupportHours.value = ''
  pa2QualityHours.value = ''
  pa2PolicyHours.value = ''
  pa2Evaluator1.value = ''
  pa2Evaluator2.value = ''
  pa2Evaluator3.value = ''
  fileMap.value = {}
  fileSizeErrors.value = {}

  Object.values(fileInputRefs.value).forEach((input) => {
    if (input) input.value = ''
  })

  formRef.value?.resetForm({
    values: {
      pa2GroupSubject: '',
      pa2TeachLevel1: '',
      pa2TeachLevel2: '',
      pa2Subject: '',
      pa2TeachHours: '',
      pa2SupportHours: '',
      pa2QualityHours: '',
      pa2PolicyHours: '',
      pa2Evaluator1: '',
      pa2Evaluator2: '',
      pa2Evaluator3: '',
      'pa2-pa1-count': 0,
      'pa2-eval1-count': 0,
      'pa2-eval2-count': 0,
      'pa2-eval3-count': 0,
    },
  })
}

function buildDocumentDetailPayload(_values: Record<string, any>) {
  // TODO: คุณเติม logic และ version ของ dataset สำหรับ Evaluation PA ที่นี่
  return null as { version: string; data: Record<string, any> } | null
}

async function createDocumentType() {
  const datasetId = 'document_create'
  const version = 'v1.0.0'

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

async function uploadFile() {
  const files = getSelectedFiles()
  const params: CreateFileDocumentParams = {
    path: 'file-req',
    folder: 'file',
    uploaded_by: getCurrentUserName(),
    description: 'การประเมินPA',
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

async function storeFile(documentIds: string[]) {
  const datasetId = 'document_create'
  const version = 'v1.1.0'

  try {
    for (const documentId of documentIds) {
      documentLink.value = {
        document_key: documentId,
        entity_table: 'document_request',
        entity_id: documentRequest.value.id,
        purpose: 'การประเมินPA',
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
  const payload = buildDocumentDetailPayload(values)
  if (!payload) return null

  const datasetId = 'document_create'

  try {
    await createDatasetRow(datasetId, payload.version, payload.data)
    return payload.data
  } catch (error: any) {
    console.error('Create Document Detail API Error:', error)
    console.error('Error Response:', error?.response?.data)
    toast.error(`บันทึกรายละเอียดคำร้องไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
    throw error
  }
}

async function onSubmit(values: Record<string, any>) {
  isSubmitting.value = true
  const payload: Record<string, any> = { ...values }
  payload.files = { ...fileMap.value }

  try {
    console.log('EvaluationPA submit payload:', JSON.parse(JSON.stringify(payload)))
  } catch (_error) {
    // ignore
  }

  try {
    await createDocumentType()
    const uploadedKeys = await uploadFile()
    await storeFile(uploadedKeys)
    await createDocumentDetail(values)
    resetEvaluationPAForm()

    toast.success('ยื่นคำร้องสำเร็จ', { position: 'bottom-right' })
  } catch (_error) {
    // แต่ละฟังก์ชันจัดการ error toast ของตัวเองแล้ว
    toast.error(`เกิดข้อผิดพลาด: ${_error}`, {
      position: 'bottom-right',
    })
  } finally {
    isSubmitting.value = false
  }
}

async function submitPA2Form() {
  if (isSubmitting.value) return

  formRef.value?.setFieldValue('pa2GroupSubject', pa2GroupSubject.value)
  formRef.value?.setFieldValue('pa2TeachLevel1', pa2TeachLevel1.value)
  formRef.value?.setFieldValue('pa2TeachLevel2', pa2TeachLevel2.value)
  formRef.value?.setFieldValue('pa2Subject', pa2Subject.value)
  formRef.value?.setFieldValue('pa2TeachHours', pa2TeachHours.value)
  formRef.value?.setFieldValue('pa2SupportHours', pa2SupportHours.value)
  formRef.value?.setFieldValue('pa2QualityHours', pa2QualityHours.value)
  formRef.value?.setFieldValue('pa2PolicyHours', pa2PolicyHours.value)
  formRef.value?.setFieldValue('pa2Evaluator1', pa2Evaluator1.value)
  formRef.value?.setFieldValue('pa2Evaluator2', pa2Evaluator2.value)
  formRef.value?.setFieldValue('pa2Evaluator3', pa2Evaluator3.value)
  formRef.value?.setFieldValue('pa2-pa1-count', fileMap.value['pa2-pa1']?.length || 0)
  formRef.value?.setFieldValue('pa2-eval1-count', fileMap.value['pa2-eval1']?.length || 0)
  formRef.value?.setFieldValue('pa2-eval2-count', fileMap.value['pa2-eval2']?.length || 0)
  formRef.value?.setFieldValue('pa2-eval3-count', fileMap.value['pa2-eval3']?.length || 0)

  const fieldNames = [
    'pa2GroupSubject',
    'pa2TeachLevel1',
    'pa2TeachLevel2',
    'pa2Subject',
    'pa2TeachHours',
    'pa2SupportHours',
    'pa2QualityHours',
    'pa2PolicyHours',
    'pa2Evaluator1',
    'pa2Evaluator2',
    'pa2Evaluator3',
    'pa2-pa1-count',
    'pa2-eval1-count',
    'pa2-eval2-count',
    'pa2-eval3-count',
  ]

  for (const fieldName of fieldNames) {
    formRef.value?.setFieldTouched?.(fieldName, true, true)
    await formRef.value?.validateField?.(fieldName)
  }

  const formElement = document.getElementById('pa-evaluation-form') as HTMLFormElement | null
  formElement?.requestSubmit()
}
</script>
<template>
  <div class="mx-6 flex flex-col gap-4 pb-6">
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
          <div
            class="mb-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            <VeeField name="pa2GroupSubject" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel>กลุ่มสาระ <span class="text-red-500">*</span></FieldLabel>
                <Select
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      pa2GroupSubject = String(v ?? '')
                    }
                  "
                >
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="เลือก" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="g in groupSubjectOptions" :key="g.value" :value="g.value">
                      {{ g.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="pa2TeachLevel1" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel>ปฏิบัติการสอนชั้น/ระดับ <span class="text-red-500">*</span></FieldLabel>
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      pa2TeachLevel1 = String(v ?? '')
                    }
                  "
                  type="text"
                  placeholder=""
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="pa2TeachLevel2" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel>ปฏิบัติการสอนชั้น/ระดับ <span class="text-red-500">*</span></FieldLabel>
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      pa2TeachLevel2 = String(v ?? '')
                    }
                  "
                  type="text"
                  placeholder=""
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="pa2Subject" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel>รายวิชา <span class="text-red-500">*</span></FieldLabel>
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      pa2Subject = String(v ?? '')
                    }
                  "
                  type="text"
                  placeholder="เช่น 1.ภาษาอังกฤษ1 ชั้น ม.4"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
          </div>

          <div
            class="mb-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            <VeeField name="pa2TeachHours" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel>การสอนตามตารางสอน <span class="text-red-500">*</span></FieldLabel>
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      pa2TeachHours = String(v ?? '')
                    }
                  "
                  type="text"
                  placeholder="จำนวนชั่วโมง / สัปดาห์"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="pa2SupportHours" v-slot="{ field, errors }">
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
                      pa2SupportHours = String(v ?? '')
                    }
                  "
                  type="text"
                  placeholder="จำนวนชั่วโมง / สัปดาห์"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="pa2QualityHours" v-slot="{ field, errors }">
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
                      pa2QualityHours = String(v ?? '')
                    }
                  "
                  type="text"
                  placeholder="จำนวนชั่วโมง / สัปดาห์"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="pa2PolicyHours" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel
                  >งานตอบสนองนโยบายและจุดเน้น <span class="text-red-500">*</span></FieldLabel
                >
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      pa2PolicyHours = String(v ?? '')
                    }
                  "
                  type="text"
                  placeholder="จำนวนชั่วโมง / สัปดาห์"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
          </div>

          <div
            class="mb-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            <VeeField name="pa2Evaluator1" v-slot="{ field, errors }">
              <Field :data-invalid="!!errors.length">
                <FieldLabel
                  >รายชื่อคณะกรรมการประเมิน คนที่ 1 <span class="text-red-500">*</span></FieldLabel
                >
                <Input
                  :model-value="field.value as string"
                  @update:model-value="
                    (v) => {
                      field.onChange(v)
                      pa2Evaluator1 = String(v ?? '')
                    }
                  "
                  type="text"
                  placeholder=""
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="pa2Evaluator2" v-slot="{ field, errors }">
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
                      pa2Evaluator2 = String(v ?? '')
                    }
                  "
                  type="text"
                  placeholder=""
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
            <VeeField name="pa2Evaluator3" v-slot="{ field, errors }">
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
                      pa2Evaluator3 = String(v ?? '')
                    }
                  "
                  type="text"
                  placeholder=""
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
          </div>

          <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <VeeField name="pa2-pa1-count" v-slot="{ errors }">
              <div>
                <p class="mb-1 text-sm font-semibold">ข้อตกลงPA (PA1) <span class="text-red-500">*</span></p>
                <p class="text-muted-foreground mb-2 text-xs">
                  ตั้งชื่อไฟล์ : กลุ่มสาระ-ชื่อ-สกุล-คศ.ปัจจุบัน-pa1
                </p>
                <input
                  :ref="
                    (el: any) => {
                      if (el) fileInputRefs['pa2-pa1'] = el as HTMLInputElement
                    }
                  "
                  type="file"
                  class="hidden"
                  accept=".pdf"
                  @change="handleFileSelect($event, 'pa2-pa1')"
                />
                <Button type="button" class="cursor-pointer" @click="triggerFileInput('pa2-pa1')">
                  <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
                </Button>
                <div v-if="fileMap['pa2-pa1']?.length" class="mt-2 flex flex-col gap-1">
                  <div
                    v-for="(file, i) in fileMap['pa2-pa1']"
                    :key="i"
                    class="border-muted bg-muted/40 flex min-h-11 w-full max-w-xl items-center gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm"
                  >
                    <span class="truncate">{{ file.name }}</span>
                    <span class="text-muted-foreground shrink-0 text-xs">{{
                      formatFileSize(file.size)
                    }}</span>
                    <button
                      type="button"
                      class="hover:text-destructive text-muted-foreground rounded p-0.5"
                      @click="removeFile('pa2-pa1', i)"
                    >
                      <X class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p v-if="getFileErrorMessage('pa2-pa1', errors)" class="mt-2 text-sm text-red-600">
                  {{ getFileErrorMessage('pa2-pa1', errors) }}
                </p>
              </div>
            </VeeField>
            <VeeField name="pa2-eval1-count" v-slot="{ errors }">
              <div>
                <p class="mb-1 text-sm font-semibold">PA2 (กรรมการคนที่1 ผู้อำนวยการ) <span class="text-red-500">*</span></p>
                <p class="text-muted-foreground mb-2 text-xs">
                  ตั้งชื่อไฟล์ : กลุ่มสาระ-ชื่อ-สกุล-คศ.ปัจจุบัน-pa2-กรรมการ1
                </p>
                <input
                  :ref="
                    (el: any) => {
                      if (el) fileInputRefs['pa2-eval1'] = el as HTMLInputElement
                    }
                  "
                  type="file"
                  class="hidden"
                  accept=".pdf"
                  @change="handleFileSelect($event, 'pa2-eval1')"
                />
                <Button type="button" class="cursor-pointer" @click="triggerFileInput('pa2-eval1')">
                  <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
                </Button>
                <div v-if="fileMap['pa2-eval1']?.length" class="mt-2 flex flex-col gap-1">
                  <div
                    v-for="(file, i) in fileMap['pa2-eval1']"
                    :key="i"
                    class="border-muted bg-muted/40 flex min-h-11 w-full max-w-xl items-center gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm"
                  >
                    <span class="truncate">{{ file.name }}</span>
                    <span class="text-muted-foreground shrink-0 text-xs">{{
                      formatFileSize(file.size)
                    }}</span>
                    <button
                      type="button"
                      class="hover:text-destructive text-muted-foreground rounded p-0.5"
                      @click="removeFile('pa2-eval1', i)"
                    >
                      <X class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p
                  v-if="getFileErrorMessage('pa2-eval1', errors)"
                  class="mt-2 text-sm text-red-600"
                >
                  {{ getFileErrorMessage('pa2-eval1', errors) }}
                </p>
              </div>
            </VeeField>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <VeeField name="pa2-eval2-count" v-slot="{ errors }">
              <div>
                <p class="mb-1 text-sm font-semibold">PA2 (กรรมการคนที่ 2) <span class="text-red-500">*</span></p>
                <p class="text-muted-foreground mb-2 text-xs">
                  ตั้งชื่อไฟล์ : กลุ่มสาระ-ชื่อ-สกุล-คศ.ปัจจุบัน-pa2-กรรมการ2
                </p>
                <input
                  :ref="
                    (el: any) => {
                      if (el) fileInputRefs['pa2-eval2'] = el as HTMLInputElement
                    }
                  "
                  type="file"
                  class="hidden"
                  accept=".pdf"
                  @change="handleFileSelect($event, 'pa2-eval2')"
                />
                <Button type="button" class="cursor-pointer" @click="triggerFileInput('pa2-eval2')">
                  <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
                </Button>
                <div v-if="fileMap['pa2-eval2']?.length" class="mt-2 flex flex-col gap-1">
                  <div
                    v-for="(file, i) in fileMap['pa2-eval2']"
                    :key="i"
                    class="border-muted bg-muted/40 flex min-h-11 w-fit max-w-xl items-center gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm"
                  >
                    <span class="truncate">{{ file.name }}</span>
                    <span class="text-muted-foreground shrink-0 text-xs">{{
                      formatFileSize(file.size)
                    }}</span>
                    <button
                      type="button"
                      class="hover:text-destructive text-muted-foreground rounded p-0.5 cursor-pointer "
                      @click="removeFile('pa2-eval2', i)"
                    >
                      <X class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p
                  v-if="getFileErrorMessage('pa2-eval2', errors)"
                  class="mt-2 text-sm text-red-600"
                >
                  {{ getFileErrorMessage('pa2-eval2', errors) }}
                </p>
              </div>
            </VeeField>
            <VeeField name="pa2-eval3-count" v-slot="{ errors }">
              <div>
                <p class="mb-1 text-sm font-semibold">PA2 (กรรมการคนที่ 3) <span class="text-red-500">*</span></p>
                <p class="text-muted-foreground mb-2 text-xs">
                  ตั้งชื่อไฟล์ : กลุ่มสาระ-ชื่อ-สกุล-คศ.ปัจจุบัน-pa2-กรรมการ3
                </p>
                <input
                  :ref="
                    (el: any) => {
                      if (el) fileInputRefs['pa2-eval3'] = el as HTMLInputElement
                    }
                  "
                  type="file"
                  class="hidden"
                  accept=".pdf"
                  @change="handleFileSelect($event, 'pa2-eval3')"
                />
                <Button type="button" class="cursor-pointer" @click="triggerFileInput('pa2-eval3')">
                  <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
                </Button>
                <div v-if="fileMap['pa2-eval3']?.length" class="mt-2 flex flex-col gap-1">
                  <div
                    v-for="(file, i) in fileMap['pa2-eval3']"
                    :key="i"
                    class="border-muted bg-muted/40 flex min-h-11 w-full max-w-xl items-center gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm"
                  >
                    <span class="truncate">{{ file.name }}</span>
                    <span class="text-muted-foreground shrink-0 text-xs">{{
                      formatFileSize(file.size)
                    }}</span>
                    <button
                      type="button"
                      class="hover:text-destructive text-muted-foreground rounded p-0.5 cursor-pointer"
                      @click="removeFile('pa2-eval3', i)"
                    >
                      <X class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p
                  v-if="getFileErrorMessage('pa2-eval3', errors)"
                  class="mt-2 text-sm text-red-600"
                >
                  {{ getFileErrorMessage('pa2-eval3', errors) }}
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
