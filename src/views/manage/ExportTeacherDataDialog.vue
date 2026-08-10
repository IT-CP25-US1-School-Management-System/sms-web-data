<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { exportData, getUrlFile } from '@/stores/reporting'
import {
  getThaiColumnLabel,
  TEACHER_EXPORT_GROUPS,
  TEACHER_EXPORT_SOURCES,
  type TeacherExportSource,
} from '@/lib/teacherExport'
import { toast } from 'vue-sonner'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const selectedIds = ref<string[]>(TEACHER_EXPORT_SOURCES.map((source) => source.id))
const exporting = ref(false)
const progress = ref({ current: 0, total: 0, label: '' })

type XlsxModule = typeof import('xlsx')
interface CsvTable {
  headers: string[]
  rows: unknown[][]
}

interface OwnerName {
  prefix: string
  firstName: string
  lastName: string
}

const selectedSources = computed(() =>
  TEACHER_EXPORT_SOURCES.filter((source) => selectedIds.value.includes(source.id)),
)
const isAllSelected = computed(() => selectedIds.value.length === TEACHER_EXPORT_SOURCES.length)

watch(
  () => props.open,
  (open) => {
    if (open && !exporting.value) {
      selectedIds.value = TEACHER_EXPORT_SOURCES.map((source) => source.id)
      progress.value = { current: 0, total: 0, label: '' }
    }
  },
)

function handleOpenChange(open: boolean) {
  if (!open && !exporting.value) emit('close')
}

function toggleAll(checked: boolean | 'indeterminate') {
  selectedIds.value = checked === true ? TEACHER_EXPORT_SOURCES.map((source) => source.id) : []
}

function toggleSource(id: string, checked: boolean | 'indeterminate') {
  if (checked === true) {
    selectedIds.value = [...new Set([...selectedIds.value, id])]
    return
  }

  selectedIds.value = selectedIds.value.filter((selectedId) => selectedId !== id)
}

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

async function waitForExportFile(jobId: string): Promise<string> {
  const deadline = Date.now() + 120_000

  while (Date.now() < deadline) {
    const response = await getUrlFile(jobId)
    const job = response.data

    if (job.status === 'succeeded' && job.destination_uri) return job.destination_uri
    if (job.status === 'failed') {
      throw new Error(job.error_message || 'ระบบไม่สามารถสร้างไฟล์ข้อมูลได้')
    }

    await delay(1_500)
  }

  throw new Error('ใช้เวลาเตรียมไฟล์นานเกินกำหนด กรุณาลองใหม่อีกครั้ง')
}

function makeUniqueHeaders(headers: unknown[]): string[] {
  const counts = new Map<string, number>()

  return headers.map((header) => {
    const label = getThaiColumnLabel(header) || 'ข้อมูล'
    const count = (counts.get(label) || 0) + 1
    counts.set(label, count)
    return count === 1 ? label : `${label} (${count})`
  })
}

function readCsv(XLSX: XlsxModule, csv: string): CsvTable {
  const workbook = XLSX.read(csv.replace(/^\uFEFF/, ''), { type: 'string', raw: true })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return { headers: [], rows: [] }

  const csvRows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheetName]!, {
    header: 1,
    defval: '',
    raw: false,
  })

  return {
    headers: (csvRows[0] || []).map((header) =>
      String(header)
        .replace(/^\uFEFF/, '')
        .trim(),
    ),
    rows: csvRows.slice(1),
  }
}

function createWorksheet(XLSX: XlsxModule, table: CsvTable) {
  if (table.headers.length === 0) return XLSX.utils.aoa_to_sheet([['ไม่พบข้อมูล']])

  const normalizedRows = [makeUniqueHeaders(table.headers), ...table.rows]
  const worksheet = XLSX.utils.aoa_to_sheet(normalizedRows)
  const columnWidths = normalizedRows[0]!.map((header, columnIndex) => {
    const contentWidth = normalizedRows
      .slice(0, 250)
      .reduce((width, row) => Math.max(width, String(row[columnIndex] ?? '').length), 0)
    return { wch: Math.min(45, Math.max(12, String(header).length + 2, contentWidth + 2)) }
  })

  worksheet['!cols'] = columnWidths
  worksheet['!autofilter'] = { ref: worksheet['!ref'] || 'A1:A1' }
  return worksheet
}

async function downloadSource(XLSX: XlsxModule, source: TeacherExportSource): Promise<CsvTable> {
  const job = await exportData({
    dataset_id: source.datasetId,
    view: source.view,
    format: 'csv',
    version: source.version,
  })
  const downloadUrl = await waitForExportFile(job.job_id)
  const response = await fetch(downloadUrl)

  if (!response.ok) throw new Error(`ดาวน์โหลดข้อมูล ${source.label} ไม่สำเร็จ`)
  return readCsv(XLSX, await response.text())
}

function getCell(table: CsvTable, row: unknown[], header: string): string {
  const columnIndex = table.headers.indexOf(header)
  return columnIndex >= 0 ? String(row[columnIndex] ?? '').trim() : ''
}

function buildOwnerLookup(personalTable: CsvTable): Map<string, OwnerName> {
  const owners = new Map<string, OwnerName>()

  for (const row of personalTable.rows) {
    const personId = getCell(personalTable, row, 'id')
    if (!personId) continue

    owners.set(personId, {
      prefix: getCell(personalTable, row, 'prefixes_prefixes_name_th'),
      firstName: getCell(personalTable, row, 'first_name_th'),
      lastName: getCell(personalTable, row, 'last_name_th'),
    })
  }

  return owners
}

function getOwnerId(table: CsvTable, row: unknown[]): string {
  const ownerIdHeaders = [
    'person_id',
    'person_data_id',
    'person_addresses_person_id',
    'family_members_person_id',
    'education_records_person_id',
    'document_links_person_id',
  ]

  for (const header of ownerIdHeaders) {
    const value = getCell(table, row, header)
    if (value) return value
  }

  return ''
}

function enrichWithOwnerNames(
  source: TeacherExportSource,
  table: CsvTable,
  owners: Map<string, OwnerName>,
): CsvTable {
  if (source.view === 'personal_detail' || table.headers.length === 0) return table

  let insertIndex = 0
  while (
    insertIndex < table.headers.length &&
    (table.headers[insertIndex] === 'id' || table.headers[insertIndex]?.endsWith('_id'))
  ) {
    insertIndex += 1
  }

  const headers = [...table.headers]
  headers.splice(insertIndex, 0, 'owner_prefix_th', 'owner_first_name_th', 'owner_last_name_th')

  const rows = table.rows.map((row) => {
    const matchedOwner = owners.get(getOwnerId(table, row))
    const owner: OwnerName = matchedOwner || {
      prefix: '',
      firstName: getCell(table, row, 'person_data_first_name_th'),
      lastName: getCell(table, row, 'person_data_last_name_th'),
    }
    const enrichedRow = [...row]
    enrichedRow.splice(insertIndex, 0, owner.prefix, owner.firstName, owner.lastName)
    return enrichedRow
  })

  return { headers, rows }
}

function createIndexSheet(
  XLSX: XlsxModule,
  results: Array<{ source: TeacherExportSource; table: CsvTable }>,
) {
  const rows = [
    [
      'ลำดับ',
      'ชุดข้อมูล',
      'ชื่อแผ่นงาน',
      'จำนวนรายการ',
      'รหัสชุดข้อมูล',
      'วิวข้อมูล',
      'เวอร์ชัน',
      'วันที่ส่งออก',
    ],
    ...results.map(({ source, table }, index) => [
      index + 1,
      source.label,
      source.sheetName,
      table.rows.length,
      source.datasetId,
      source.view,
      source.version,
      new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(),
      ),
    ]),
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 34 },
    { wch: 28 },
    { wch: 16 },
    { wch: 22 },
    { wch: 26 },
    { wch: 14 },
    { wch: 24 },
  ]
  worksheet['!autofilter'] = { ref: worksheet['!ref'] || 'A1:H1' }
  return worksheet
}

async function handleExport() {
  if (selectedSources.value.length === 0 || exporting.value) return

  exporting.value = true
  progress.value = { current: 0, total: selectedSources.value.length, label: '' }

  try {
    const XLSX = await import('xlsx')
    const results: Array<{ source: TeacherExportSource; table: CsvTable }> = []
    const personalSource = TEACHER_EXPORT_SOURCES.find(
      (source) => source.view === 'personal_detail',
    )!
    const requiresOwnerLookup = selectedSources.value.some(
      (source) => source.view !== 'personal_detail',
    )
    const personalIsSelected = selectedSources.value.some(
      (source) => source.view === 'personal_detail',
    )
    const totalJobs =
      selectedSources.value.length + (requiresOwnerLookup && !personalIsSelected ? 1 : 0)
    let currentJob = 0
    let personalTable: CsvTable | null = null

    if (requiresOwnerLookup && !personalIsSelected) {
      currentJob += 1
      progress.value = {
        current: currentJob,
        total: totalJobs,
        label: 'กำลังจับคู่ชื่อเจ้าของข้อมูล',
      }
      personalTable = await downloadSource(XLSX, personalSource)
    }

    for (const source of selectedSources.value) {
      currentJob += 1
      progress.value = {
        current: currentJob,
        total: totalJobs,
        label: source.label,
      }
      const table = await downloadSource(XLSX, source)
      if (source.view === 'personal_detail') personalTable = table
      results.push({ source, table })
    }

    progress.value.label = 'กำลังสร้างไฟล์ Excel'
    const ownerLookup = buildOwnerLookup(personalTable || { headers: [], rows: [] })
    const enrichedResults = results.map(({ source, table }) => ({
      source,
      table: enrichWithOwnerNames(source, table, ownerLookup),
    }))
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, createIndexSheet(XLSX, enrichedResults), 'สารบัญ')

    for (const result of enrichedResults) {
      XLSX.utils.book_append_sheet(
        workbook,
        createWorksheet(XLSX, result.table),
        result.source.sheetName.slice(0, 31),
      )
    }

    const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '_')
    XLSX.writeFile(workbook, `ข้อมูลบุคลากร_${timestamp}.xlsx`, { compression: true })
    toast.success('สร้างไฟล์ Excel สำเร็จ', {
      description: `รวมข้อมูล ${enrichedResults.length} หมวด พร้อมชื่อเจ้าของข้อมูลแล้ว`,
    })
    emit('close')
  } catch (error: any) {
    console.error('Failed to export teacher data:', error)
    toast.error('ไม่สามารถส่งออกข้อมูลได้', {
      description: error?.message || 'กรุณาลองใหม่อีกครั้ง',
    })
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent
      class="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90dvh] sm:max-w-3xl"
      :show-close-button="!exporting"
    >
      <DialogHeader class="shrink-0 border-b px-6 py-5">
        <div class="flex items-start gap-3 pr-8">
          <div
            class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg"
          >
            <FileSpreadsheet class="size-5" />
          </div>
          <div class="space-y-1">
            <DialogTitle>ส่งออกข้อมูลบุคลากร</DialogTitle>
            <DialogDescription>
              เลือกชุดข้อมูลที่ต้องการ ระบบจะรวมเป็นไฟล์ Excel
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
        <label
          class="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 transition-colors"
        >
          <Checkbox
            :model-value="isAllSelected ? true : selectedIds.length > 0 ? 'indeterminate' : false"
            :disabled="exporting"
            @update:model-value="toggleAll"
          />
          <span class="font-medium">เลือกทั้งหมด</span>
          <span class="text-muted-foreground ml-auto text-sm">
            {{ selectedIds.length }}/{{ TEACHER_EXPORT_SOURCES.length }} ชุดข้อมูล
          </span>
        </label>

        <div class="my-3 border-t" />

        <section v-for="group in TEACHER_EXPORT_GROUPS" :key="group.id" class="mb-5 last:mb-0">
          <h3 class="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wide uppercase">
            {{ group.label }}
          </h3>
          <div class="grid gap-1 sm:grid-cols-2">
            <label
              v-for="source in TEACHER_EXPORT_SOURCES.filter((item) => item.group === group.id)"
              :key="source.id"
              class="hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 transition-colors"
              :class="exporting && 'cursor-not-allowed opacity-60'"
            >
              <Checkbox
                class="mt-0.5"
                :model-value="selectedIds.includes(source.id)"
                :disabled="exporting"
                @update:model-value="toggleSource(source.id, $event)"
              />
              <span class="min-w-0">
                <span class="block text-sm font-medium">{{ source.label }}</span>
                <span class="text-muted-foreground block text-xs leading-5">
                  {{ source.description }}
                </span>
              </span>
            </label>
          </div>
        </section>
      </div>

      <div v-if="exporting" class="bg-muted/40 shrink-0 border-t px-6 py-3">
        <div class="mb-2 flex items-center justify-between gap-4 text-sm">
          <span class="flex min-w-0 items-center gap-2">
            <Loader2 class="text-primary size-4 shrink-0 animate-spin" />
            <span class="truncate">{{ progress.label }}</span>
          </span>
          <span class="text-muted-foreground shrink-0">
            {{ progress.current }}/{{ progress.total }}
          </span>
        </div>
        <div class="bg-muted h-1.5 overflow-hidden rounded-full">
          <div
            class="bg-primary h-full rounded-full transition-all duration-300"
            :style="{ width: `${(progress.current / Math.max(progress.total, 1)) * 100}%` }"
          />
        </div>
      </div>

      <DialogFooter class="bg-background shrink-0 border-t px-6 py-4 sm:justify-between">
        <p class="text-muted-foreground text-xs"></p>
        <div class="flex justify-end gap-2">
          <Button variant="outline" :disabled="exporting" @click="emit('close')">ยกเลิก</Button>
          <Button :disabled="selectedSources.length === 0 || exporting" @click="handleExport">
            <Loader2 v-if="exporting" class="mr-2 size-4 animate-spin" />
            <Download v-else class="mr-2 size-4" />
            {{ exporting ? 'กำลังเตรียมไฟล์' : 'ดาวน์โหลด Excel' }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
