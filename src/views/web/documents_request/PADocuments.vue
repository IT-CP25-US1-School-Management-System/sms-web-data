<script setup lang="ts">
import { FileText, X, ChevronUp } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form as VeeForm, Field as VeeField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { toast } from 'vue-sonner'
import { ref, computed } from 'vue'
import { generateUUID } from '@/lib/helpers'
import { useAuthStore } from '@/stores/auth'
import { createDatasetRow } from '@/stores/dataset'
import { createFileDocument } from '@/stores/document'
import type { CreateFileDocumentParams, FileDocument } from '@/types/document'
import type { DocumentLink, DocumentRequest } from '@/types/document_request'
import { Spinner } from '@/components/ui/spinner'
import { DOCUMENT_EDIT } from '@/lib/constants'
const fileMap = ref<Record<string, File[]>>({})
const fileInputRefs = ref<Record<string, HTMLInputElement | null>>({})
const formRef = ref<any>(null)
const fileSizeErrors = ref<Record<string, string | undefined>>({})
const isSubmitting = ref(false)
const MAX_FILE_SIZE = 15 * 1024 * 1024
const FILE_SIZE_ERROR_MESSAGE = `ขนาดไฟล์ต้องไม่เกิน ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))} MB`
const authStore = useAuthStore()

const documentRequest = ref<DocumentRequest>({
  id: '',
  person_id: '',
  document_type: 'การส่งเอกสารPA',
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

const paSections = [
  'แบบข้อตกลงในการพัฒนางาน PA1',
  'แบบบันทึกมอบหมายให้บุคลากรมีชั่วโมงปฏิบัติงาน',
  'รายงานกิจกรรมชุมชนแห่งการเรียนรู้ทางวิชาชีพ PLC',
  'รายงานการวิจัย',
  'แผนการจัดการเรียนรู้',
  'สรุปผลการเยี่ยมบ้านนักเรียน',
  'รายงานการประเมินตนเอง T-SAR',
  'KP Innovative',
]
const paOpenState = ref<Record<number, boolean>>(
  Object.fromEntries(paSections.map((_, i) => [i, true])),
)

const paFileSchema = computed(() => {
  const shape: Record<string, any> = {}
  paSections.forEach((section, idx) => {
    shape[`pa-${idx}-count`] = z.number().min(1, `${section} จำเป็นต้องแนบไฟล์`)
  })
  return toTypedSchema(z.object(shape))
})

const initialValues = computed(() => {
  const vals: Record<string, any> = {}
  paSections.forEach((_, idx) => {
    vals[`pa-${idx}-count`] = fileMap.value[`pa-${idx}`]?.length || 0
  })
  return vals
})

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
  const idx = key.split('-')[1]
  formRef.value?.setFieldValue(`pa-${idx}-count`, fileMap.value[key].length, false)
  formRef.value?.validateField?.(`pa-${idx}-count`)
}

function removeFile(key: string, idx: number) {
  fileMap.value[key]?.splice(idx, 1)
  fileSizeErrors.value[key] = undefined
  const sectionIdx = key.split('-')[1]
  formRef.value?.setFieldValue(`pa-${sectionIdx}-count`, fileMap.value[key]?.length || 0, false)
  formRef.value?.validateField?.(`pa-${sectionIdx}-count`)
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
  return (
    authStore.user?.name || authStore.user?.given_name || authStore.user?.email || 'current-user'
  )
}

// function getSelectedFiles(): File[] {
//   return Object.values(fileMap.value).flatMap((files) => files ?? [])
// }

type UploadedSectionFile = {
  documentKey: string
  section: string
}

function getSelectedFilesBySection() {
  return paSections.flatMap((section, idx) =>
    (fileMap.value[`pa-${idx}`] ?? []).map((file) => ({
      file,
      section,
    })),
  )
}

function resetPAForm() {
  fileMap.value = {}
  fileSizeErrors.value = {}

  Object.values(fileInputRefs.value).forEach((input) => {
    if (input) input.value = ''
  })

  formRef.value?.resetForm({
    values: Object.fromEntries(paSections.map((_, idx) => [`pa-${idx}-count`, 0])),
  })
}

async function createDocumentType() {
  const datasetId = DOCUMENT_EDIT.DATASET_ID //'document_create'
  const version = DOCUMENT_EDIT.DATASET_VERSION_DOCUMENT_REQUEST //'v1.0.0'

  documentRequest.value.id = generateUUID()
  documentRequest.value.person_id = authStore.user?.id || ''
  documentRequest.value.document_type = 'การส่งเอกสารPA'
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
  const filesBySection = getSelectedFilesBySection()
  const params: CreateFileDocumentParams = {
    path: 'file-req',
    folder: 'file',
    uploaded_by: getCurrentUserName(),
    description: 'การส่งเอกสารPA',
  }

  try {
    const uploadedFiles: UploadedSectionFile[] = []
    for (const { file, section } of filesBySection) {
      const response = await createFileDocument<FileDocument>(file, params)
      if (!response.data?.resource_id) {
        throw new Error('อัปโหลดไฟล์ไม่สำเร็จ')
      }
      uploadedFiles.push({
        documentKey: response.data.resource_id,
        section,
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

async function storeFile(uploadedFiles: UploadedSectionFile[]) {
  const datasetId = DOCUMENT_EDIT.DATASET_ID //'document_create'
  const version = DOCUMENT_EDIT.DATASET_VERSION_DOCUMENT_LINK //'v1.1.0'

  try {
    for (const uploadedFile of uploadedFiles) {
      documentLink.value = {
        document_key: uploadedFile.documentKey,
        entity_table: 'document_request',
        entity_id: documentRequest.value.id,
        purpose: uploadedFile.section,
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

async function onSubmit(values: Record<string, any>) {
  isSubmitting.value = true
  const payload: Record<string, any> = { ...values }
  payload.files = { ...fileMap.value }

  try {
    console.log('PADocuments submit payload:', JSON.parse(JSON.stringify(payload)))
  } catch (_error) {
    // ignore
  }

  try {
    await createDocumentType()
    const uploadedFiles = await uploadFile()
    await storeFile(uploadedFiles)
    resetPAForm()

    toast.success('การส่งเอกสาร PA สำเร็จ', { position: 'bottom-right' })
  } catch (_error) {
    // แต่ละฟังก์ชันจัดการ error toast ของตัวเองแล้ว
    toast.error('การส่งเอกสาร PA ไม่สำเร็จ', { position: 'bottom-right' })
  } finally {
    isSubmitting.value = false
  }
}

async function submitPAForm() {
  if (isSubmitting.value) return

  for (const idx of paSections.keys()) {
    formRef.value?.setFieldTouched?.(`pa-${idx}-count`, true, true)
    await formRef.value?.validateField?.(`pa-${idx}-count`)
  }

  const formElement = document.getElementById('pa-document-form') as HTMLFormElement | null
  formElement?.requestSubmit()
}
</script>

<template>
  <div class="mx-6 flex flex-col gap-4 pb-6">
    <VeeForm
      ref="formRef"
      :validation-schema="paFileSchema"
      :initial-values="initialValues"
      id="pa-document-form"
      @submit="onSubmit"
    >
      <div class="mt-4 flex flex-col gap-3">
        <Card
          v-for="(section, sIdx) in paSections"
          :key="sIdx"
          class="w-full gap-0"
          :class="{ 'pb-0': !paOpenState[sIdx] }"
        >
          <CardHeader :class="{ 'pb-0': !paOpenState[sIdx] }">
            <div
              class="flex cursor-pointer flex-row items-center justify-between"
              @click="paOpenState[sIdx] = !paOpenState[sIdx]"
            >
              <CardTitle class="text-sm">{{ section }}</CardTitle>
              <ChevronUp
                class="h-5 w-5 transition-transform"
                :class="paOpenState[sIdx] ? 'rotate-0' : 'rotate-180'"
              />
            </div>
          </CardHeader>
          <div
            class="grid overflow-hidden transition-all duration-300 ease-in-out"
            :class="paOpenState[sIdx] ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
          >
            <div class="overflow-hidden">
              <CardContent class="pt-3">
                <p class="mb-2 text-sm font-semibold">
                  แนบไฟล์ PDF <span class="text-red-500">*</span>
                </p>
                <VeeField :name="`pa-${sIdx}-count`" v-slot="{ errors }">
                  <input
                    :ref="
                      (el: any) => {
                        if (el) fileInputRefs[`pa-${sIdx}`] = el as HTMLInputElement
                      }
                    "
                    type="file"
                    class="hidden"
                    accept=".pdf"
                    @change="handleFileSelect($event, `pa-${sIdx}`)"
                  />
                  <Button
                    type="button"
                    class="cursor-pointer"
                    @click="triggerFileInput(`pa-${sIdx}`)"
                  >
                    <FileText class="mr-1 h-4 w-4" /> อัปโหลดไฟล์
                  </Button>
                  <div v-if="fileMap[`pa-${sIdx}`]?.length" class="mt-2 flex flex-col gap-1">
                    <div
                      v-for="(file, i) in fileMap[`pa-${sIdx}`]"
                      :key="i"
                      class="border-muted bg-muted/40 flex min-h-11 w-fit max-w-xl items-center gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm"
                    >
                      <span class="truncate">{{ file.name }}</span>
                      <span class="text-muted-foreground shrink-0 text-xs">{{
                        formatFileSize(file.size)
                      }}</span>
                      <button
                        type="button"
                        class="hover:text-destructive text-muted-foreground cursor-pointer rounded p-0.5"
                        @click="removeFile(`pa-${sIdx}`, i)"
                      >
                        <X class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p
                    v-if="getFileErrorMessage(`pa-${sIdx}`, errors)"
                    class="mt-2 text-sm text-red-600"
                  >
                    {{ getFileErrorMessage(`pa-${sIdx}`, errors) }}
                  </p>
                </VeeField>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>
    </VeeForm>
  </div>
  <div
    class="sticky right-0 bottom-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3"
  >
    <Button
      type="button"
      class="cursor-pointer rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]"
      :disabled="isSubmitting"
      @click="submitPAForm"
    >
      <Spinner v-if="isSubmitting" class="mr-2" />

      ส่งเอกสาร
    </Button>
  </div>
</template>

<style></style>
