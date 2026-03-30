<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
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
import { Textarea } from '@/components/ui/textarea'
import { Search, Loader2 } from 'lucide-vue-next'
import { generateUUID, getPrefixName, toDateInputFormat } from '@/lib/helpers'
import type { AttendanceStatus, DailyAttendanceCreateDTO } from '@/types/attendance'
import type { PersonData } from '@/types/teacher'
import { createDailyAttendance, getDailyAttendance, getTeachers } from '@/stores/teachers'
import { toast } from 'vue-sonner'

type AttendanceDraftRow = {
  person_id: string
  display_name: string
  status: AttendanceStatus
  check_in_time: string
  remark: string
}

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const loadingTeachers = ref(false)
const submitting = ref(false)
const teachers = ref<PersonData[]>([])
const existingPersonIds = ref<string[]>([])
const attendanceDate = ref(toDateInputFormat(new Date()))
const searchQuery = ref('')
const draftRows = ref<AttendanceDraftRow[]>([])
const FETCH_PAGE_SIZE = 20

const ATTENDANCE_STATUS_OPTIONS: Array<{ label: string; value: AttendanceStatus }> = [
  { label: 'มาปฏิบัติราชการปกติ', value: 'present' },
  { label: 'ไปราชการ', value: 'business_trip' },
  { label: 'ลาป่วย', value: 'sick_leave' },
  { label: 'ลากิจ', value: 'personal_leave' },
  { label: 'มาสาย', value: 'late' },
  { label: 'ไปช่วยราชการ', value: 'official_help' },
  { label: 'อื่นๆ', value: 'other' },
]

const existingPersonIdSet = computed(() => new Set(existingPersonIds.value))

const filteredRows = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return draftRows.value

  return draftRows.value.filter((row) => row.display_name.toLowerCase().includes(query))
})

const skippedCount = computed(() => existingPersonIds.value.length)

const canSubmit = computed(
  () => !submitting.value && !loadingTeachers.value && draftRows.value.length > 0,
)

function getTeacherDisplayName(teacher: PersonData) {
  return `${teacher.prefixes?.prefixes_name_th || getPrefixName(teacher.prefix_id)}${teacher.first_name_th} ${teacher.last_name_th}`
}

function buildDraftRows() {
  draftRows.value = teachers.value
    .filter((teacher) => !existingPersonIdSet.value.has(teacher.id))
    .map((teacher) => ({
      person_id: teacher.id,
      display_name: getTeacherDisplayName(teacher),
      status: 'present',
      check_in_time: '',
      remark: '',
    }))
}

async function fetchAllTeachers() {
  const rows: PersonData[] = []
  let page = 1
  let totalPages = 1

  do {
    const response = await getTeachers({
      page,
      per_page: FETCH_PAGE_SIZE,
      sort_by: 'first_name_th',
      sort_order: 'asc',
    })

    rows.push(...response.data)
    totalPages = response.total_pages || 1
    page += 1
  } while (page <= totalPages)

  return rows
}

async function fetchExistingAttendanceForDate(date: string) {
  const rows: string[] = []
  let page = 1
  let totalPages = 1

  do {
    const response = await getDailyAttendance({
      page,
      per_page: FETCH_PAGE_SIZE,
      where: [[{ table_name: 'daily_attendance', field: 'date', operator: '=', value: date }]],
    })

    rows.push(...response.data.map((record) => record.person_id))
    totalPages = response.total_pages || 1
    page += 1
  } while (page <= totalPages)

  return rows
}

function normalizeTimeValue(value: string) {
  if (!value) return null
  return value.length === 5 ? `${value}:00` : value
}

function resetFormState() {
  attendanceDate.value = toDateInputFormat(new Date())
  searchQuery.value = ''
  teachers.value = []
  existingPersonIds.value = []
  draftRows.value = []
}

async function loadTeachersAndDrafts() {
  loadingTeachers.value = true
  try {
    teachers.value = await fetchAllTeachers()
    existingPersonIds.value = await fetchExistingAttendanceForDate(attendanceDate.value)
    buildDraftRows()
  } catch (error: any) {
    console.error('Failed to prepare attendance dialog:', error)
    toast.error('เกิดข้อผิดพลาด', {
      description: error.message || 'ไม่สามารถเตรียมข้อมูลการลงเวลาได้',
    })
    emit('close')
  } finally {
    loadingTeachers.value = false
  }
}

async function refreshExistingAttendance(date: string) {
  if (!props.open || !teachers.value.length) return

  loadingTeachers.value = true
  try {
    existingPersonIds.value = await fetchExistingAttendanceForDate(date)
    buildDraftRows()
  } catch (error: any) {
    console.error('Failed to refresh attendance by date:', error)
    toast.error('เกิดข้อผิดพลาด', {
      description: error.message || 'ไม่สามารถตรวจสอบข้อมูลที่มีอยู่เดิมได้',
    })
  } finally {
    loadingTeachers.value = false
  }
}

function handleStatusChange(row: AttendanceDraftRow, status: string) {
  row.status = status as AttendanceStatus

  if (row.status !== 'late') {
    row.check_in_time = ''
  }
}

async function submitAttendance() {
  if (!canSubmit.value) return

  submitting.value = true
  const createdAt = new Date().toISOString()

  try {
    const payloads: DailyAttendanceCreateDTO[] = draftRows.value.map((row) => ({
      id: generateUUID(),
      person_id: row.person_id,
      date: attendanceDate.value,
      status: row.status,
      check_in_time: normalizeTimeValue(row.check_in_time),
      remark: row.remark.trim() || null,
      created_at: createdAt,
      updated_at: null,
    }))

    const results = await Promise.allSettled(
      payloads.map((payload) => createDailyAttendance(payload)),
    )
    const failedRows = results
      .map((result, index) => ({ result, row: draftRows.value[index] }))
      .filter((item) => item.result.status === 'rejected')

    if (failedRows.length > 0) {
      const successCount = payloads.length - failedRows.length
      toast.error('บันทึกข้อมูลการลาไม่ครบทุกคน', {
        description:
          successCount > 0
            ? `สำเร็จ ${successCount} รายการ, ไม่สำเร็จ ${failedRows.length} รายการ`
            : 'ไม่สามารถบันทึกข้อมูลได้',
      })
      return
    }

    toast.success('บันทึกข้อมูลการลาเรียบร้อยแล้ว', {
      description: `สร้างข้อมูลจำนวน ${payloads.length} รายการ`,
    })

    emit('success')
    emit('close')
    resetFormState()
  } catch (error: any) {
    console.error('Failed to create attendance:', error)
    toast.error('เกิดข้อผิดพลาด', {
      description: error.message || 'ไม่สามารถบันทึกข้อมูลการลาได้',
    })
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      void loadTeachersAndDrafts()
      return
    }

    resetFormState()
  },
)

watch(
  () => attendanceDate.value,
  (date, previousDate) => {
    if (!date || date === previousDate) return
    void refreshExistingAttendance(date)
  },
)
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
    <DialogContent class="flex max-h-[90vh] max-w-[95vw] flex-col xl:max-w-7xl 2xl:max-w-[1200px]">
      <DialogHeader>
        <DialogTitle>เพิ่มข้อมูลการลา</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <div class="space-y-2">
          <label class="text-sm font-medium">วันที่ลงข้อมูล</label>
          <Input v-model="attendanceDate" type="date" :disabled="loadingTeachers || submitting" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">ค้นหารายชื่อ</label>
          <div class="relative">
            <Search
              class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            />
            <Input
              v-model="searchQuery"
              type="text"
              placeholder="ค้นหาชื่อ - นามสกุล"
              class="pl-10"
              :disabled="loadingTeachers || submitting"
            />
          </div>
        </div>
      </div>

      <div class="bg-muted/20 rounded-lg border px-4 py-3 text-sm">
        <p>ครูทั้งหมด {{ teachers.length }} คน</p>
        <p>พร้อมสร้างข้อมูล {{ draftRows.length }} คน</p>
        <p v-if="skippedCount > 0" class="text-amber-700">
          ข้าม {{ skippedCount }} คน เพราะมีข้อมูลในวันที่เลือกอยู่แล้ว
        </p>
      </div>

      <div class="min-h-0 flex-1 overflow-auto rounded-lg border">
        <table class="w-full" style="table-layout: fixed">
          <thead class="bg-muted/70 sticky top-0">
            <tr>
              <th class="px-3 py-2 text-left font-medium">ชื่อ - นามสกุล</th>
              <th class="px-3 py-2 text-left font-medium">สถานะ</th>
              <th class="px-3 py-2 text-left font-medium">เวลาเข้า</th>
              <th class="px-3 py-2 text-left font-medium">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingTeachers">
              <td colspan="4" class="py-10 text-center">
                <div class="flex items-center justify-center gap-2">
                  <Loader2 class="h-5 w-5 animate-spin" />
                  <span class="text-muted-foreground">กำลังเตรียมรายชื่อครู...</span>
                </div>
              </td>
            </tr>

            <tr v-else-if="filteredRows.length === 0">
              <td colspan="4" class="text-muted-foreground py-10 text-center">
                ไม่พบรายการที่พร้อมสร้างข้อมูล
              </td>
            </tr>

            <tr v-for="row in filteredRows" v-else :key="row.person_id" class="border-t align-top">
              <td class="px-3 py-2">{{ row.display_name }}</td>
              <td class="px-3 py-2">
                <Select
                  :model-value="row.status"
                  :disabled="submitting"
                  @update:model-value="(value) => handleStatusChange(row, String(value))"
                >
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="option in ATTENDANCE_STATUS_OPTIONS"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td class="px-3 py-2">
                <Input
                  v-model="row.check_in_time"
                  type="time"
                  :disabled="submitting || row.status !== 'late'"
                />
              </td>
              <td class="px-3 py-2">
                <Textarea
                  v-model="row.remark"
                  rows="2"
                  placeholder="รายละเอียดเพิ่มเติม"
                  :disabled="submitting"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="submitting" @click="emit('close')">ยกเลิก</Button>
        <Button
          class="bg-green-600 text-white hover:bg-green-700"
          :disabled="!canSubmit"
          @click="submitAttendance"
        >
          <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
          บันทึกข้อมูลการลา
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
