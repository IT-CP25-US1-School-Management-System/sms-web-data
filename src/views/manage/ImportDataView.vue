<script setup lang="ts">
import { computed, onBeforeUnmount, ref, type Component } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import MainLayout from '@/layouts/manage/MainLayout.vue'
import { formatDateTime } from '@/lib/helpers'
import { DATASET_ID, DATASET_VERSION } from '@/stores/dataset'
import {
  createReportImportJob,
  createReportImportTemplate,
  getReportImportJobStatus,
} from '@/stores/reporting'
import type { ImportFileFormat, ImportJobState } from '@/types/reporting'
import { Download, GraduationCap, Loader2, Upload, Users, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

type ImportTargetKey = 'teacher' | 'student' | 'leave'

type ImportTarget = {
  key: ImportTargetKey
  label: string
  description: string
  datasetId: string
  version: string
  icon: Component
}

const defaultImportTarget: ImportTarget = {
  key: 'teacher',
  label: 'คุณครู',
  description: 'นำเข้าข้อมูลบุคลากรและครู',
  datasetId: DATASET_ID,
  version: DATASET_VERSION,
  icon: Users,
}

const importTargets: ImportTarget[] = [
  defaultImportTarget,
  {
    key: 'student',
    label: 'นักเรียน',
    description: 'นำเข้าข้อมูลนักเรียน',
    datasetId: 'data_student',
    version: 'v1.0.0',
    icon: GraduationCap,
  },
  // {
  //   key: 'leave',
  //   label: 'การลา',
  //   description: 'นำเข้าข้อมูลการลา',
  //   datasetId: 'xxxx',
  //   version: 'v4.0.0',
  //   icon: CalendarDays,
  // },
]

const selectedTargetKey = ref<ImportTargetKey>('teacher')
const selectedFile = ref<File | null>(null)
const dragActive = ref(false)
const isPreparingTemplate = ref(false)
const isSubmitting = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const latestJobId = ref('')
const latestImportedAt = ref('')
const latestJobStatus = ref<ImportJobState | ''>('')
const latestCompletedAt = ref('')
const latestErrorMessage = ref('')
const templateUrlCache = ref<Record<ImportTargetKey, string>>({
  teacher: '',
  student: '',
  leave: '',
})

const acceptedFileTypes = '.csv,.xls,.xlsx'
const templateFormat = 'xlsx'

const currentTarget = computed<ImportTarget>(
  () =>
    importTargets.find((target) => target.key === selectedTargetKey.value) ?? defaultImportTarget,
)

const selectedFileName = computed(() => selectedFile.value?.name || 'ยังไม่ได้เลือกไฟล์')
const canSubmit = computed(
  () => Boolean(selectedFile.value) && !isSubmitting.value && !isPreparingTemplate.value,
)
const isCheckingJobStatus = ref(false)

let importStatusTimer: ReturnType<typeof setTimeout> | null = null

const latestJobStatusLabel = computed(() => {
  switch (latestJobStatus.value) {
    case 'pending':
      return 'รอประมวลผล'
    case 'in_progress':
      return 'กำลังนำเข้า'
    case 'succeeded':
      return 'สำเร็จ'
    case 'failed':
      return 'ไม่สำเร็จ'
    default:
      return '-'
  }
})

const latestJobStatusClass = computed(() => {
  switch (latestJobStatus.value) {
    case 'pending':
      return 'text-amber-600'
    case 'in_progress':
      return 'text-sky-600'
    case 'succeeded':
      return 'text-emerald-600'
    case 'failed':
      return 'text-red-600'
    default:
      return 'text-foreground'
  }
})

function selectTarget(targetKey: ImportTargetKey) {
  selectedTargetKey.value = targetKey
}

function isAcceptedFile(file: File) {
  const name = file.name.toLowerCase()
  return ['.csv', '.xls', '.xlsx'].some((extension) => name.endsWith(extension))
}

function setSelectedFile(file: File | null) {
  if (!file) {
    selectedFile.value = null
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
    return
  }

  if (!isAcceptedFile(file)) {
    toast.error('รองรับเฉพาะไฟล์ CSV หรือ Excel เท่านั้น')
    return
  }

  selectedFile.value = file
}

function clearSelectedFile() {
  setSelectedFile(null)
}

function clearImportStatusTimer() {
  if (importStatusTimer) {
    clearTimeout(importStatusTimer)
    importStatusTimer = null
  }
}

function scheduleImportStatusRefresh(jobId: string) {
  clearImportStatusTimer()
  importStatusTimer = setTimeout(() => {
    void refreshImportJobStatus(jobId)
  }, 3000)
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  setSelectedFile(input.files?.[0] || null)
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  dragActive.value = true
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  dragActive.value = false
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  dragActive.value = false
  setSelectedFile(event.dataTransfer?.files?.[0] || null)
}

function resolveTemplateUrl(response: {
  url?: string
  template_url?: string
  download_url?: string
}) {
  return response.url || response.template_url || response.download_url || ''
}

function getImportFormat(file: File): ImportFileFormat {
  const lowerName = file.name.toLowerCase()

  if (lowerName.endsWith('.xlsx')) return 'xlsx'
  if (lowerName.endsWith('.xls')) return 'xls'
  return 'csv'
}

function formatTrackingDateTime(date?: string) {
  if (!date) return '-'

  const normalizedDate = date.includes('T') ? date : date.replace(' ', 'T')
  const parsedDate = new Date(normalizedDate)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return formatDateTime(parsedDate)
}

function triggerTemplateDownload(url: string) {
  if (typeof document === 'undefined') return

  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.rel = 'noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function downloadTemplate() {
  try {
    const cachedUrl = templateUrlCache.value[currentTarget.value.key]

    if (cachedUrl) {
      triggerTemplateDownload(cachedUrl)
      return
    }

    isPreparingTemplate.value = true

    const response = await createReportImportTemplate({
      dataset_id: currentTarget.value.datasetId,
      version: currentTarget.value.version,
      format: templateFormat,
    })

    const templateUrl = resolveTemplateUrl(response)

    if (!templateUrl) {
      throw new Error('ระบบไม่ได้ส่งลิงก์เทมเพลตกลับมา')
    }

    templateUrlCache.value[currentTarget.value.key] = templateUrl
    triggerTemplateDownload(templateUrl)
  } catch (error: any) {
    toast.error(`โหลดเทมเพลต${currentTarget.value.label}ไม่สำเร็จ`, {
      description: error?.response?.data?.message || error?.message,
    })
  } finally {
    isPreparingTemplate.value = false
  }
}

async function refreshImportJobStatus(jobId = latestJobId.value) {
  if (!jobId) return

  clearImportStatusTimer()

  try {
    isCheckingJobStatus.value = true

    const response = await getReportImportJobStatus(jobId)

    latestJobStatus.value = response.status
    latestImportedAt.value = response.created_at || latestImportedAt.value
    latestCompletedAt.value = response.completed_at || ''
    latestErrorMessage.value = response.error_message || ''

    if (response.status === 'pending' || response.status === 'in_progress') {
      scheduleImportStatusRefresh(jobId)
    }
  } catch (error: any) {
    toast.error('เช็กสถานะงานนำเข้าไม่สำเร็จ', {
      description: error?.response?.data?.message || error?.message,
    })
  } finally {
    isCheckingJobStatus.value = false
  }
}

async function submitImportJob() {
  const importFile = selectedFile.value

  if (!importFile) {
    toast.error('กรุณาเลือกไฟล์ที่ต้องการนำเข้า')
    return
  }

  try {
    isSubmitting.value = true

    const response = await createReportImportJob(
      importFile,
      currentTarget.value.datasetId,
      currentTarget.value.version,
      getImportFormat(importFile),
    )

    latestJobId.value = response.job_id
    latestImportedAt.value = new Date().toISOString()
    latestJobStatus.value = 'pending'
    latestCompletedAt.value = ''
    latestErrorMessage.value = ''
    clearSelectedFile()
    void refreshImportJobStatus(response.job_id)

    toast.success(`เริ่มนำเข้าข้อมูล${currentTarget.value.label}สำเร็จ`, {
      description: `Job ID: ${response.job_id}`,
    })
  } catch (error: any) {
    toast.error(`เริ่มนำเข้าข้อมูล${currentTarget.value.label}ไม่สำเร็จ`, {
      description: error?.response?.data?.message || error?.message,
    })
  } finally {
    isSubmitting.value = false
  }
}

onBeforeUnmount(() => {
  clearImportStatusTimer()
})
</script>

<template>
  <MainLayout>
    <div class="flex h-full flex-col overflow-auto">
      <Card class="mx-auto w-full max-w-5xl">
        <CardHeader class="space-y-3">
          <CardTitle class="text-2xl">นำเข้าข้อมูล</CardTitle>
          <CardDescription>
            เลือกประเภทข้อมูล ดาวน์โหลดเทมเพลต แล้วค่อยลากไฟล์มาวางเพื่อ import
          </CardDescription>
        </CardHeader>

        <CardContent class="space-y-6">
          <div class="grid gap-3 md:grid-cols-2">
            <button
              v-for="target in importTargets"
              :key="target.key"
              type="button"
              class="flex items-start gap-3 rounded-xl border p-4 text-left transition-colors"
              :class="
                selectedTargetKey === target.key
                  ? 'border-[#1C509F] bg-[#1C509F]/5'
                  : 'border-border hover:bg-muted/40'
              "
              @click="selectTarget(target.key)"
            >
              <component :is="target.icon" class="mt-0.5 h-5 w-5 shrink-0" />
              <div class="space-y-1">
                <p class="font-semibold">{{ target.label }}</p>
                <p class="text-muted-foreground text-sm">{{ target.description }}</p>
              </div>
            </button>
          </div>

          <div
            class="rounded-2xl border-2 border-dashed p-8 text-center transition-colors"
            :class="dragActive ? 'border-[#1C509F] bg-[#1C509F]/5' : 'border-border bg-muted/20'"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
          >
            <input
              ref="fileInputRef"
              :accept="acceptedFileTypes"
              type="file"
              class="hidden"
              @change="handleFileChange"
            />

            <div class="mx-auto flex max-w-xl flex-col items-center gap-4">
              <div class="rounded-full bg-[#1C509F]/10 p-4 text-[#1C509F]">
                <Upload class="h-8 w-8" />
              </div>

              <div class="space-y-2">
                <p class="text-lg font-semibold">
                  ลากไฟล์มาวางที่นี่ หรือเลือกไฟล์เพื่อ import {{ currentTarget.label }}
                </p>
                <p class="text-muted-foreground text-sm">รองรับไฟล์ CSV, XLS และ XLSX</p>
              </div>

              <Button variant="outline" @click="openFilePicker"> เลือกไฟล์ </Button>

              <div class="bg-background w-full rounded-xl border px-4 py-3 text-left">
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-muted-foreground text-xs">ไฟล์ที่เลือก</p>
                    <p class="truncate font-medium">{{ selectedFileName }}</p>
                  </div>

                  <Button
                    v-if="selectedFile"
                    type="button"
                    variant="ghost"
                    size="icon"
                    class="shrink-0 overflow-hidden text-[0px] text-red-500 hover:bg-red-50 hover:text-red-600"
                    aria-label="ลบไฟล์"
                    title="ลบไฟล์"
                    @click="clearSelectedFile"
                  >
                    <X class="h-4 w-4" />
                    ลบไฟล์
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div
            class="bg-muted/20 flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
          >
            <div class="space-y-1">
              <p class="font-medium">ประเภทข้อมูล: {{ currentTarget.label }}</p>
              <p class="text-muted-foreground text-sm">
                Dataset ที่จะใช้: {{ currentTarget.datasetId }}
              </p>
              <p class="text-muted-foreground text-sm">
                เวอร์ชันที่ใช้: {{ currentTarget.version }}
              </p>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                :disabled="isPreparingTemplate || isSubmitting"
                @click="downloadTemplate"
              >
                <Loader2 v-if="isPreparingTemplate" class="h-4 w-4 animate-spin" />
                <Download v-else class="h-4 w-4" />
                {{ isPreparingTemplate ? 'กำลังโหลดเทมเพลต...' : 'ดาวน์โหลดเทมเพลต' }}
              </Button>

              <Button
                class="bg-[#16A34A] text-white hover:bg-[#15803D]"
                :disabled="!canSubmit"
                @click="submitImportJob"
              >
                <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
                <Upload v-else class="h-4 w-4" />
                {{ isSubmitting ? 'กำลัง import...' : `Import ${currentTarget.label}` }}
              </Button>
            </div>
          </div>

          <div v-if="latestJobId" class="rounded-xl border border-[#1C509F]/20 bg-[#1C509F]/5 p-4">
            <p class="font-medium">เริ่มงานนำเข้าสำเร็จแล้ว</p>
            <p class="text-muted-foreground mt-1 text-sm">
              Job ID: <span class="text-foreground font-medium">{{ latestJobId }}</span>
            </p>
            <p class="text-muted-foreground text-sm">
              เวลาเริ่มงาน:
              <span class="text-foreground font-medium">
                {{ formatTrackingDateTime(latestImportedAt) }}
              </span>
            </p>
            <p class="text-muted-foreground text-sm">
              สถานะ:
              <span :class="['font-medium', latestJobStatusClass]">
                {{ latestJobStatusLabel }}
              </span>
            </p>
            <p v-if="latestCompletedAt" class="text-muted-foreground text-sm">
              เสร็จสิ้นเมื่อ:
              <span class="text-foreground font-medium">
                {{ formatTrackingDateTime(latestCompletedAt) }}
              </span>
            </p>
            <p v-if="latestErrorMessage" class="text-sm text-red-600">
              {{ latestErrorMessage }}
            </p>
            <div class="mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                :disabled="isCheckingJobStatus"
                @click="refreshImportJobStatus()"
              >
                <Loader2 v-if="isCheckingJobStatus" class="h-4 w-4 animate-spin" />
                <span>{{ isCheckingJobStatus ? 'กำลังเช็กสถานะ...' : 'เช็กสถานะล่าสุด' }}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </MainLayout>
</template>
