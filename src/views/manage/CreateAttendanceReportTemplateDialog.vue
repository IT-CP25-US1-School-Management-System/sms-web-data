<script setup lang="ts">
import { computed, markRaw, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
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
import { MANAGE_REPORTING_DATASETS } from '@/lib/constants'
import { Loader2, Minus, Plus, Trash2, Upload } from 'lucide-vue-next'
import { createReportingTemplateFromUpload, uploadReportTemplate } from '@/stores/reporting'
import type {
  ReportTemplateColumn,
  ReportTemplatePosition,
  UploadReportTemplateParams,
} from '@/types/reporting'
import { toast } from 'vue-sonner'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

type TemplateMarker = ReportTemplatePosition
type ColumnOption = { value: string; label: string }

const VIEW_TABLE_NAME = 'view_attendance_pdf_report'
const REPORT_DATASET_ID = MANAGE_REPORTING_DATASETS.DATASET_ID
const REPORT_VERSION = MANAGE_REPORTING_DATASETS.DATASET_VERSION_ATTENDANCE_REPORT_TEMPLATE
const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const GROUPS = [
  { prefix: 'g', label: 'ข้าราชการครู' },
  { prefix: 'p', label: 'ลูกจ้างประจำ' },
  { prefix: 's', label: 'พนักงานราชการ' },
  { prefix: 't', label: 'ลูกจ้างชั่วคราว - ครู' },
  { prefix: 'j', label: 'ลูกจ้างชั่วคราว - แม่บ้าน/ภารโรง' },
] as const

const STATUS_FIELDS = [
  { key: 'business_trip', label: 'ไปราชการ' },
  { key: 'sick_leave', label: 'ลาป่วย' },
  { key: 'personal_leave', label: 'ลากิจ' },
  { key: 'late', label: 'มาสาย' },
  { key: 'official_help', label: 'ไปช่วยราชการ' },
  { key: 'other', label: 'อื่นๆ' },
] as const

const COLUMN_OPTIONS: ColumnOption[] = [
  { value: 'date', label: 'วันที่' },
  { value: 'day_of_week', label: 'วันในสัปดาห์' },
  { value: 'day_only', label: 'เลขวัน' },
  { value: 'month_name', label: 'ชื่อเดือน' },
  { value: 'thai_year', label: 'ปี พ.ศ.' },
  ...GROUPS.flatMap((group) => [
    { value: `${group.prefix}_total`, label: `${group.label} - รวมทั้งหมด` },
    {
      value: `${group.prefix}_net_present`,
      label: `${group.label} - มาปฏิบัติราชการจริง`,
    },
    ...STATUS_FIELDS.flatMap((status) => [
      {
        value: `${group.prefix}_${status.key}_count`,
        label: `${group.label} - ${status.label} (จำนวน)`,
      },
      {
        value: `${group.prefix}_${status.key}_list`,
        label: `${group.label} - ${status.label} (รายชื่อ)`,
      },
    ]),
  ]),
]

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const templateName = ref('')
const selectedFile = ref<File | null>(null)
const markers = ref<TemplateMarker[]>([])
const submitting = ref(false)
const lastTemplateId = ref('')
const zoom = ref(1)
const pdfLoading = ref(false)
const draggingColumn = ref('')
const draggingMarkerColumn = ref('')

const fileInputRef = ref<HTMLInputElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const previewSurfaceRef = ref<HTMLDivElement | null>(null)

const pdfDocument = shallowRef<PDFDocumentProxy | null>(null)
const pdfPage = shallowRef<PDFPageProxy | null>(null)
const renderedWidth = ref(0)
const renderedHeight = ref(0)

const columns = computed<ReportTemplateColumn[]>(() =>
  markers.value.map((marker) => ({
    table_name: marker.table_name,
    column_name: marker.column_name,
  })),
)

const canSubmit = computed(
  () =>
    !submitting.value &&
    !pdfLoading.value &&
    Boolean(templateName.value.trim()) &&
    Boolean(selectedFile.value) &&
    markers.value.length > 0,
)

const markerStyles = computed(() =>
  markers.value.map((marker) => ({
    ...marker,
    left: `${marker.x * zoom.value}px`,
    top: `${marker.y * zoom.value}px`,
    label: getColumnLabel(marker.column_name),
  })),
)

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

async function cleanupPdfDocument() {
  if (pdfDocument.value) {
    await pdfDocument.value.destroy()
    pdfDocument.value = null
  }

  pdfPage.value = null
  renderedWidth.value = 0
  renderedHeight.value = 0
}

function resetState() {
  templateName.value = ''
  selectedFile.value = null
  markers.value = []
  lastTemplateId.value = ''
  draggingColumn.value = ''
  draggingMarkerColumn.value = ''
  zoom.value = 1
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function getColumnLabel(columnName: string) {
  return COLUMN_OPTIONS.find((option) => option.value === columnName)?.label || columnName
}

function removeMarker(columnName: string) {
  markers.value = markers.value.filter((marker) => marker.column_name !== columnName)
}

function zoomIn() {
  zoom.value = clampZoom(zoom.value + ZOOM_STEP)
}

function zoomOut() {
  zoom.value = clampZoom(zoom.value - ZOOM_STEP)
}

function resetZoom() {
  zoom.value = 1
}

async function renderPdfPage() {
  if (!pdfPage.value || !canvasRef.value) return

  const page = pdfPage.value
  const canvas = canvasRef.value
  const viewport = page.getViewport({ scale: zoom.value })
  const context = canvas.getContext('2d')

  if (!context) return

  renderedWidth.value = viewport.width
  renderedHeight.value = viewport.height

  const outputScale = window.devicePixelRatio || 1
  canvas.width = Math.floor(viewport.width * outputScale)
  canvas.height = Math.floor(viewport.height * outputScale)
  canvas.style.width = `${viewport.width}px`
  canvas.style.height = `${viewport.height}px`

  context.setTransform(outputScale, 0, 0, outputScale, 0, 0)
  context.clearRect(0, 0, viewport.width, viewport.height)

  await page.render({
    canvas,
    canvasContext: context,
    viewport,
  }).promise
}

async function loadPdfFile(file: File) {
  pdfLoading.value = true
  try {
    await cleanupPdfDocument()

    const fileBuffer = await file.arrayBuffer()
    const loadingTask = getDocument({ data: fileBuffer })
    const documentProxy = await loadingTask.promise
    const firstPage = await documentProxy.getPage(1)

    pdfDocument.value = markRaw(documentProxy)
    pdfPage.value = markRaw(firstPage)

    await nextTick()
    await renderPdfPage()
  } catch (error: any) {
    console.error('Failed to load PDF preview:', error)
    toast.error('ไม่สามารถเปิด preview PDF ได้', {
      description: error?.message,
    })
  } finally {
    pdfLoading.value = false
  }
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null

  if (!file) {
    selectedFile.value = null
    await cleanupPdfDocument()
    return
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    toast.error('อัปโหลดได้เฉพาะไฟล์ PDF เท่านั้น')
    input.value = ''
    return
  }

  selectedFile.value = file
  zoom.value = 1
  await loadPdfFile(file)
}

function startColumnDrag(columnName: string, event: DragEvent) {
  draggingColumn.value = columnName
  event.dataTransfer?.setData('application/x-attendance-column', columnName)
  event.dataTransfer?.setData('text/plain', columnName)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
  }
}

function startMarkerDrag(columnName: string, event: DragEvent) {
  draggingMarkerColumn.value = columnName
  event.dataTransfer?.setData('application/x-attendance-marker', columnName)
  event.dataTransfer?.setData('text/plain', columnName)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function placeMarker(columnName: string, clientX: number, clientY: number) {
  const surface = previewSurfaceRef.value
  if (!surface) return

  const rect = surface.getBoundingClientRect()
  const x = Math.max(0, Math.round((clientX - rect.left) / zoom.value))
  const y = Math.max(0, Math.round((clientY - rect.top) / zoom.value))

  const nextMarker: TemplateMarker = {
    table_name: VIEW_TABLE_NAME,
    column_name: columnName,
    alias: columnName,
    x,
    y,
  }

  const existingIndex = markers.value.findIndex((marker) => marker.column_name === columnName)
  if (existingIndex >= 0) {
    markers.value.splice(existingIndex, 1, nextMarker)
    return
  }

  markers.value.push(nextMarker)
}

function handleSurfaceDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = draggingMarkerColumn.value ? 'move' : 'copy'
  }
}

function handleSurfaceDrop(event: DragEvent) {
  event.preventDefault()

  const markerColumnName = event.dataTransfer?.getData('application/x-attendance-marker') || ''
  const paletteColumnName = event.dataTransfer?.getData('application/x-attendance-column') || ''
  const columnName =
    markerColumnName || paletteColumnName || draggingMarkerColumn.value || draggingColumn.value

  if (!columnName) return

  placeMarker(columnName, event.clientX, event.clientY)
  draggingColumn.value = ''
  draggingMarkerColumn.value = ''
}

async function submitTemplate() {
  if (!selectedFile.value || !canSubmit.value) return

  submitting.value = true
  try {
    const payload: UploadReportTemplateParams = {
      name: templateName.value.trim(),
      dataset_id: REPORT_DATASET_ID,
      version: REPORT_VERSION,
      columns: columns.value,
      positions: markers.value,
    }

    const response = await uploadReportTemplate(selectedFile.value, payload)
    await createReportingTemplateFromUpload(templateName.value.trim(), response.id)
    lastTemplateId.value = response.id

    toast.success('อัปโหลด template รายงานสำเร็จ', {
      description: `Template ID: ${response.id}`,
    })
    emit('success')
  } catch (error: any) {
    console.error('Failed to upload report template:', error)
    toast.error('บันทึก template รายงานไม่สำเร็จ', {
      description: error?.response?.data?.message || error?.message,
    })
  } finally {
    submitting.value = false
  }
}

watch(zoom, async () => {
  if (!pdfPage.value) return

  pdfLoading.value = true
  try {
    await renderPdfPage()
  } finally {
    pdfLoading.value = false
  }
})

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      resetState()
      await cleanupPdfDocument()
    }
  },
)

onBeforeUnmount(async () => {
  await cleanupPdfDocument()
})
</script>

<template>
  <Dialog
    :open="open"
    @update:open="
      (value) => {
        if (!value) emit('close')
      }
    "
  >
    <DialogContent
      class="flex max-h-[92vh] max-w-[96vw] flex-col overflow-auto xl:max-w-7xl 2xl:max-w-[1700px]"
    >
      <DialogHeader>
        <DialogTitle>กำหนด templates รายงาน</DialogTitle>
        <DialogDescription>
          ลากก้อนข้อความภาษาไทยจากด้านซ้ายไปวางบน PDF ได้เลย และลาก marker
          ที่วางแล้วเพื่อย้ายตำแหน่งได้
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">ชื่อ template</label>
            <Input v-model="templateName" type="text" placeholder="เช่น รายงานการมาปฏิบัติราชการ" />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">ไฟล์ PDF</label>
            <input
              ref="fileInputRef"
              type="file"
              accept=".pdf,application/pdf"
              class="hidden"
              @change="handleFileChange"
            />
            <Button variant="outline" class="w-full justify-start" @click="openFilePicker">
              <Upload class="mr-2 h-4 w-4" />
              {{ selectedFile?.name || 'เลือกไฟล์ PDF' }}
            </Button>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">รายการข้อมูลสำหรับลากวาง</label>
            <div class="max-h-[280px] overflow-auto rounded-lg border p-2">
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="option in COLUMN_OPTIONS"
                  :key="option.value"
                  type="button"
                  draggable="true"
                  class="hover:border-primary hover:bg-primary/5 rounded-full border bg-white px-3 py-1.5 text-left text-sm transition-colors"
                  @dragstart="(event) => startColumnDrag(option.value, event)"
                  @dragend="draggingColumn = ''"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
            <p class="text-muted-foreground text-xs">
              พิกัดที่บันทึกจะอิงจาก PDF จริงที่ scale 1 ไม่เพี้ยนตาม zoom
            </p>
          </div>

          <div class="bg-muted/20 rounded-lg border p-3 text-sm">
            <p>Dataset: {{ REPORT_DATASET_ID }}</p>
            <p>Version: {{ REPORT_VERSION }}</p>
            <p>Table: {{ VIEW_TABLE_NAME }}</p>
            <p>Zoom: {{ Math.round(zoom * 100) }}%</p>
            <p>วางตำแหน่งแล้ว {{ markers.length }} จุด</p>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium">ตำแหน่งที่ตั้งไว้</p>
            <div class="max-h-[320px] space-y-2 overflow-auto rounded-lg border p-2">
              <div
                v-for="marker in markers"
                :key="marker.column_name"
                class="flex items-start justify-between gap-3 rounded-md border px-3 py-2"
              >
                <div class="min-w-0 text-sm">
                  <p class="truncate font-medium">{{ getColumnLabel(marker.column_name) }}</p>
                  <p class="text-muted-foreground">x: {{ marker.x }}, y: {{ marker.y }}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  class="text-red-600"
                  @click="removeMarker(marker.column_name)"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>

              <p
                v-if="markers.length === 0"
                class="text-muted-foreground px-2 py-6 text-center text-sm"
              >
                ยังไม่มีตำแหน่งที่กำหนด
              </p>
            </div>
          </div>
        </div>

        <div class="bg-muted/10 min-h-[520px] rounded-lg border p-3">
          <div class="mb-3 flex items-center justify-between gap-2">
            <div class="text-muted-foreground text-sm">หน้าแรกของ PDF</div>
            <div class="flex items-center gap-2">
              <Button variant="outline" size="sm" :disabled="!pdfPage" @click="zoomOut">
                <Minus class="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" :disabled="!pdfPage" @click="resetZoom">
                {{ Math.round(zoom * 100) }}%
              </Button>
              <Button variant="outline" size="sm" :disabled="!pdfPage" @click="zoomIn">
                <Plus class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            v-if="pdfPage"
            class="relative h-[72vh] overflow-auto rounded-md border bg-[#dfe3ea] p-4"
          >
            <div
              ref="previewSurfaceRef"
              class="relative mx-auto bg-white shadow"
              :style="{ width: `${renderedWidth}px`, height: `${renderedHeight}px` }"
              @dragover="handleSurfaceDragOver"
              @drop="handleSurfaceDrop"
            >
              <canvas ref="canvasRef" class="block" />

              <div
                v-for="marker in markerStyles"
                :key="marker.column_name"
                draggable="true"
                class="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full bg-red-600 px-2 py-1 text-[10px] font-medium text-white shadow"
                :style="{ left: marker.left, top: marker.top }"
                @dragstart="(event) => startMarkerDrag(marker.column_name, event)"
                @dragend="draggingMarkerColumn = ''"
              >
                {{ marker.label }}
              </div>
            </div>

            <div
              v-if="pdfLoading"
              class="absolute inset-0 flex items-center justify-center bg-white/70"
            >
              <div class="flex items-center gap-2 rounded-md bg-white px-3 py-2 shadow">
                <Loader2 class="h-4 w-4 animate-spin" />
                <span class="text-muted-foreground text-sm">กำลัง render PDF...</span>
              </div>
            </div>
          </div>

          <div
            v-else
            class="text-muted-foreground flex h-[72vh] items-center justify-center rounded-md border border-dashed text-center"
          >
            เลือกไฟล์ PDF เพื่อแสดง preview
          </div>
        </div>
      </div>

      <div
        v-if="lastTemplateId"
        class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
      >
        Template ID ล่าสุด: {{ lastTemplateId }}
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="submitting" @click="emit('close')">ยกเลิก</Button>
        <Button
          class="bg-green-600 text-white hover:bg-green-700"
          :disabled="!canSubmit"
          @click="submitTemplate"
        >
          <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
          บันทึก template
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
