<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Download, FileSpreadsheet, Loader2, Users } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROUTE_NAMES } from '@/lib/constants'
import { collectPAPages, paLoadError, paYearOptions } from '@/lib/pa'
import { subjectGroups, type SubjectGroup } from '@/lib/subjectGroups'
import { getPADetail, getPAList, getWebPADetail, getWebPAList } from '@/stores/pa'
import type { PADetail, PAListFilters, PAListItem, PAStatus } from '@/types/pa'

const props = defineProps<{
  open: boolean
  initialFilters: PAListFilters
  allowedDepartments?: SubjectGroup[]
  fileRouteName?: string
  dataSource?: 'manage' | 'web'
}>()
const emit = defineEmits<{ close: [] }>()
const router = useRouter()
const years = paYearOptions()
const year = ref('all')
const department = ref('all')
const status = ref('all')
const selectedItems = ref<PAListItem[]>([])
const loading = ref(false)
const exporting = ref(false)
const error = ref('')
const progress = ref('')
const namePage = ref(1)
const namesPerPage = 6
let generation = 0
let initializing = false

const subjectGroupOptions = computed(() => props.allowedDepartments ?? subjectGroups)
const allowedDepartmentIds = computed(() => props.allowedDepartments?.map((group) => group.id))
const scopedDepartmentIds = computed(() => {
  if (props.allowedDepartments === undefined) return undefined
  const selected = Number(department.value)
  return department.value !== 'all' && allowedDepartmentIds.value?.includes(selected)
    ? [selected]
    : allowedDepartmentIds.value
})
const filters = computed<PAListFilters>(() => ({
  year: year.value === 'all' ? undefined : Number(year.value),
  departmentId:
    props.allowedDepartments === undefined && department.value !== 'all'
      ? Number(department.value)
      : undefined,
  departmentIds: scopedDepartmentIds.value,
  status: status.value === 'all' ? undefined : (status.value as PAStatus),
}))
const people = computed(() => {
  const unique = new Map<string, string>()
  for (const item of selectedItems.value) unique.set(item.request.person_id, item.fullName)
  return [...unique.values()].sort((a, b) => a.localeCompare(b, 'th'))
})
const totalNamePages = computed(() => Math.max(1, Math.ceil(people.value.length / namesPerPage)))
const visiblePeople = computed(() => {
  const start = (namePage.value - 1) * namesPerPage
  return people.value.slice(start, start + namesPerPage)
})
const visibleNameStart = computed(() =>
  people.value.length ? (namePage.value - 1) * namesPerPage + 1 : 0,
)
const visibleNameEnd = computed(() => Math.min(namePage.value * namesPerPage, people.value.length))

async function loadSelection() {
  if (!props.open) return
  const current = ++generation
  loading.value = true
  error.value = ''
  selectedItems.value = []
  try {
    const getList = props.dataSource === 'web' ? getWebPAList : getPAList
    const rows = await collectPAPages((page) => getList({ ...filters.value, page, per_page: 100 }))
    if (current === generation) {
      selectedItems.value = rows
      namePage.value = 1
    }
  } catch (cause) {
    if (current === generation) error.value = paLoadError(cause)
  } finally {
    if (current === generation) loading.value = false
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      generation++
      return
    }
    initializing = true
    year.value = props.initialFilters.year ? String(props.initialFilters.year) : 'all'
    const scopedSelection = props.initialFilters.departmentIds
    department.value = props.initialFilters.departmentId
      ? String(props.initialFilters.departmentId)
      : scopedSelection?.length === 1 && subjectGroupOptions.value.length > 1
        ? String(scopedSelection[0])
        : 'all'
    status.value = props.initialFilters.status || 'all'
    await nextTick()
    initializing = false
    if (props.open) void loadSelection()
  },
)
watch([year, department, status], () => {
  if (!initializing && props.open) void loadSelection()
})

function handleOpenChange(open: boolean) {
  if (!open && !exporting.value) emit('close')
}

async function exportExcel() {
  if (loading.value || exporting.value || error.value || !selectedItems.value.length) return
  exporting.value = true
  try {
    const getDetail = props.dataSource === 'web' ? getWebPADetail : getPADetail
    const details: PADetail[] = []
    for (const item of selectedItems.value) {
      progress.value = `${details.length + 1} / ${selectedItems.value.length}`
      details.push(await getDetail(item.request.id, item, allowedDepartmentIds.value))
    }
    const [{ buildPAWorkbook }, XLSX] = await Promise.all([
      import('@/lib/paExport'),
      import('xlsx'),
    ])
    const workbook = buildPAWorkbook(
      details,
      (id, category) =>
        new URL(
          router.resolve({
            name: props.fileRouteName || ROUTE_NAMES.MANAGE_PA_FILES,
            params: { id },
            query: { category },
          }).href,
          window.location.origin,
        ).href,
    )
    XLSX.writeFile(workbook, `การประเมิน-PA-${filters.value.year ?? 'ทุกปี'}.xlsx`)
    toast.success(`ส่งออกการประเมิน PA ${people.value.length} คนแล้ว`)
    emit('close')
  } catch {
    toast.error('ส่งออกไม่สำเร็จ เนื่องจากโหลดข้อมูลหรือไฟล์แนบไม่ครบ กรุณาลองใหม่')
  } finally {
    exporting.value = false
    progress.value = ''
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent
      class="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90dvh] sm:max-w-2xl"
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
            <DialogTitle>ดาวน์โหลดผลการประเมิน PA</DialogTitle>
            <DialogDescription>เลือกข้อมูลและตรวจสอบรายชื่อก่อนสร้างไฟล์ Excel</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div class="flex flex-wrap items-center gap-3">
          <Select v-model="year" :disabled="loading || exporting">
            <SelectTrigger class="w-32" aria-label="ปีที่ส่งคำร้อง">
              <SelectValue placeholder="ทุกปี" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกปี</SelectItem>
              <SelectItem v-for="option in years" :key="option" :value="String(option)">
                {{ option }}
              </SelectItem>
            </SelectContent>
          </Select>
          <div class="min-w-64 flex-1">
            <Select v-model="department" :disabled="loading || exporting">
              <SelectTrigger class="w-full" aria-label="กลุ่มสาระการเรียนรู้">
                <SelectValue placeholder="ทุกกลุ่มสาระ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกกลุ่มสาระ</SelectItem>
                <SelectItem
                  v-for="group in subjectGroupOptions"
                  :key="group.id"
                  :value="String(group.id)"
                >
                  {{ group.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select v-model="status" :disabled="loading || exporting">
            <SelectTrigger class="w-44" aria-label="สถานะคำร้อง">
              <SelectValue placeholder="ทุกสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสถานะ</SelectItem>
              <SelectItem value="กำลังดำเนินการ">กำลังดำเนินการ</SelectItem>
              <SelectItem value="อนุมัติ">อนุมัติ</SelectItem>
              <SelectItem value="ไม่อนุมัติ">ไม่อนุมัติ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="overflow-hidden rounded-lg border">
          <div class="bg-muted/50 flex items-center justify-between gap-3 border-b px-4 py-3">
            <span class="flex items-center gap-2 font-semibold"
              ><Users class="size-4" />รายชื่อ</span
            >
            <span class="text-primary font-semibold">{{ loading ? '-' : people.length }} คน</span>
          </div>
          <div v-if="loading" class="text-muted-foreground p-8 text-center">
            <Loader2 class="mr-2 inline size-4 animate-spin" />กำลังตรวจสอบรายชื่อ...
          </div>
          <div v-else-if="error" class="space-y-3 p-6 text-center">
            <p class="text-destructive text-sm">{{ error }}</p>
            <Button variant="outline" size="sm" @click="loadSelection">ลองใหม่</Button>
          </div>
          <p v-else-if="!people.length" class="text-muted-foreground p-8 text-center text-sm">
            ไม่พบรายชื่อตามตัวกรองที่เลือก
          </p>
          <template v-else>
            <ol class="divide-y">
              <li
                v-for="(name, index) in visiblePeople"
                :key="`${visibleNameStart + index}-${name}`"
                class="px-4 py-2.5 text-sm"
              >
                <span class="text-muted-foreground mr-3 inline-block w-6 text-right">
                  {{ visibleNameStart + index }}.
                </span>
                {{ name }}
              </li>
            </ol>
            <div class="flex items-center gap-2 border-t px-4 py-3">
              <span class="text-muted-foreground mr-auto text-xs">
                แสดง {{ visibleNameStart }}–{{ visibleNameEnd }} จาก {{ people.length }} คน
              </span>
              <Button
                variant="outline"
                size="sm"
                :disabled="namePage <= 1 || exporting"
                @click="namePage--"
              >
                ก่อนหน้า
              </Button>
              <span class="text-muted-foreground min-w-18 text-center text-xs">
                หน้า {{ namePage }} / {{ totalNamePages }}
              </span>
              <Button
                variant="outline"
                size="sm"
                :disabled="namePage >= totalNamePages || exporting"
                @click="namePage++"
              >
                ถัดไป
              </Button>
            </div>
          </template>
        </div>
      </div>

      <div v-if="exporting" class="bg-muted/40 shrink-0 border-t px-6 py-3 text-sm">
        <span class="flex items-center gap-2">
          <Loader2 class="text-primary size-4 animate-spin" />กำลังเตรียมไฟล์ {{ progress }}
        </span>
      </div>
      <DialogFooter class="shrink-0 border-t px-6 py-4">
        <Button variant="outline" :disabled="exporting" @click="emit('close')">ยกเลิก</Button>
        <Button
          :disabled="loading || exporting || !!error || !selectedItems.length"
          @click="exportExcel"
        >
          <Loader2 v-if="exporting" class="size-4 animate-spin" />
          <Download v-else class="size-4" />
          {{ exporting ? 'กำลังเตรียมไฟล์' : 'ดาวน์โหลด Excel' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
