<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-vue-next'
import { toDateInputFormat } from '@/lib/helpers'
import {
  exportReportingTemplate,
  getReportingTemplateExportJob,
  getReportingTemplates,
} from '@/stores/reporting'
import type { ReportingTemplateRecord } from '@/types/reporting'
import { toast } from 'vue-sonner'

const FETCH_PAGE_SIZE = 20
const POLL_INTERVAL_MS = 1500

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const templates = ref<ReportingTemplateRecord[]>([])
const loadingTemplates = ref(false)
const exportDate = ref(toDateInputFormat(new Date()))
const selectedTemplateId = ref('')
const exporting = ref(false)
const exportJobId = ref('')
const exportErrorMessage = ref('')
const exportStatusText = ref('')
const cancelled = ref(false)
const pollingTimerId = ref<number | null>(null)

const canSubmit = computed(
  () =>
    !loadingTemplates.value &&
    !exporting.value &&
    Boolean(selectedTemplateId.value) &&
    Boolean(exportDate.value),
)

function resetState() {
  templates.value = []
  loadingTemplates.value = false
  exportDate.value = toDateInputFormat(new Date())
  selectedTemplateId.value = ''
  exporting.value = false
  exportJobId.value = ''
  exportErrorMessage.value = ''
  exportStatusText.value = ''
  cancelled.value = false
  clearPollingTimer()
}

function clearPollingTimer() {
  if (pollingTimerId.value !== null) {
    window.clearTimeout(pollingTimerId.value)
    pollingTimerId.value = null
  }
}

function wait(ms: number) {
  return new Promise((resolve) => {
    pollingTimerId.value = window.setTimeout(() => {
      pollingTimerId.value = null
      resolve(undefined)
    }, ms)
  })
}

async function fetchAllTemplates() {
  const rows: ReportingTemplateRecord[] = []
  let page = 1
  let totalPages = 1

  do {
    const response = await getReportingTemplates({
      page,
      per_page: FETCH_PAGE_SIZE,
      sort_by: 'created_at',
      sort_order: 'desc',
    })

    rows.push(...response.data)
    totalPages = response.total_pages || 1
    page += 1
  } while (page <= totalPages)

  return rows
}

async function loadTemplates() {
  loadingTemplates.value = true
  exportErrorMessage.value = ''

  try {
    templates.value = await fetchAllTemplates()
    const firstTemplate = templates.value[0]
    if (firstTemplate) {
      selectedTemplateId.value = firstTemplate.template_id
    }
  } catch (error: any) {
    console.error('Failed to load reporting templates:', error)
    toast.error('โหลดรายการ template ไม่สำเร็จ', {
      description: error?.response?.data?.message || error?.message,
    })
  } finally {
    loadingTemplates.value = false
  }
}

async function forceDownloadFile(url: string, filename?: string) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.download = filename || `attendance-report-${exportDate.value}.pdf`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(blobUrl)
    return
  } catch (error) {
    console.error('Failed to force download file via blob, fallback to direct URL:', error)
  }

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename || `attendance-report-${exportDate.value}.pdf`
  anchor.target = '_blank'
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

async function pollExportJob(jobId: string) {
  while (!cancelled.value) {
    const response = await getReportingTemplateExportJob(jobId)
    const job = response.data

    if (job.status === 'pending') {
      exportStatusText.value = 'กำลังออกรายงาน'
      await wait(POLL_INTERVAL_MS)
      continue
    }

    if (job.status === 'failed') {
      if (job.error_message != 'data not found for the provided key') {
        exportErrorMessage.value = job.error_message || 'ออกรายงานไม่สำเร็จ'
        exportStatusText.value = ''
        toast.error('ออกรายงานไม่สำเร็จ', {
          description: exportErrorMessage.value,
        })
      } else {
        exportErrorMessage.value = 'ไม่พบข้อมูลสำหรับวันที่เลือก'
        exportStatusText.value = ''
        toast.error('ออกรายงานไม่สำเร็จ', {
          description: exportErrorMessage.value,
        })
      }
      return
    }

    if (job.status === 'succeeded' && job.url) {
      exportStatusText.value = 'กำลังดาวน์โหลดรายงาน'
      await forceDownloadFile(job.url, job.original_filename)
      toast.success('ออกรายงานสำเร็จ')
      emit('close')
      return
    }

    exportErrorMessage.value = 'สถานะงานไม่ถูกต้อง'
    toast.error('ออกรายงานไม่สำเร็จ', {
      description: exportErrorMessage.value,
    })
    return
  }
}

async function submitExport() {
  if (!canSubmit.value) return

  exporting.value = true
  cancelled.value = false
  exportErrorMessage.value = ''
  exportStatusText.value = 'กำลังออกรายงาน'

  try {
    const response = await exportReportingTemplate(selectedTemplateId.value, exportDate.value)
    exportJobId.value = response.job_id
    await pollExportJob(response.job_id)
  } catch (error: any) {
    console.error('Failed to export attendance report:', error)
    exportErrorMessage.value =
      error?.response?.data?.message || error?.message || 'ออกรายงานไม่สำเร็จ'
    toast.error('ออกรายงานไม่สำเร็จ', {
      description: exportErrorMessage.value,
    })
  } finally {
    clearPollingTimer()
    exporting.value = false
    exportStatusText.value = ''
  }
}

function handleCancel() {
  cancelled.value = true
  clearPollingTimer()
  emit('close')
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      void loadTemplates()
      return
    }

    resetState()
  },
)

onBeforeUnmount(() => {
  cancelled.value = true
  clearPollingTimer()
})
</script>

<template>
  <Dialog
    :open="open"
    @update:open="
      (value) => {
        if (!value) handleCancel()
      }
    "
  >
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>ออกรายงานการลา</DialogTitle>
        <DialogDescription>
          เลือก template รายงานและวันที่ที่ต้องการออกรายงาน
          ระบบจะรอจนไฟล์พร้อมแล้วดาวน์โหลดให้อัตโนมัติ
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">เลือก template</label>
          <Select v-model="selectedTemplateId" :disabled="loadingTemplates || exporting">
            <SelectTrigger class="w-full">
              <SelectValue
                :placeholder="loadingTemplates ? 'กำลังโหลด template...' : 'เลือก template รายงาน'"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="template in templates"
                :key="template.id"
                :value="template.template_id"
              >
                {{ template.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">วันที่รายงาน</label>
          <Input v-model="exportDate" type="date" :disabled="exporting" />
        </div>

        <div v-if="exporting" class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div class="flex items-center gap-2 text-sm text-blue-800">
            <Loader2 class="h-4 w-4 animate-spin" />
            <span>{{ exportStatusText || 'กำลังออกรายงาน' }}</span>
          </div>
          <p v-if="exportJobId" class="mt-2 text-xs text-blue-700">Job ID: {{ exportJobId }}</p>
        </div>

        <div
          v-if="exportErrorMessage"
          class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ exportErrorMessage }}
        </div>

        <p
          v-if="!loadingTemplates && templates.length === 0"
          class="text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm"
        >
          ยังไม่มี template รายงานให้เลือก
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleCancel">
          {{ exporting ? 'ยกเลิก' : 'ปิด' }}
        </Button>
        <Button
          class="bg-green-600 text-white hover:bg-green-700"
          :disabled="!canSubmit"
          @click="submitExport"
        >
          <Loader2 v-if="exporting" class="mr-2 h-4 w-4 animate-spin" />
          {{ exporting ? 'กำลังออกรายงาน' : 'ยืนยัน' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
