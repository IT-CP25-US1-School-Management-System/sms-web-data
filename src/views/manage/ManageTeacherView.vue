<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/layouts/manage/MainLayout.vue'
import CreateAttendanceDialog from '@/views/manage/CreateAttendanceDialog.vue'
import CreateAttendanceReportTemplateDialog from '@/views/manage/CreateAttendanceReportTemplateDialog.vue'
import ExportAttendanceReportDialog from '@/views/manage/ExportAttendanceReportDialog.vue'
import { Button } from '@/components/ui/button'
import { ROUTE_NAMES } from '@/lib/constants'
import { Input } from '@/components/ui/input'
import { formatDate, getPrefixName } from '@/lib/helpers'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-vue-next'
import { usePagination } from '@/composables/usePagination'
import type { PaginationData } from '@/composables/usePagination'
import { toast } from 'vue-sonner'
import type { PersonData } from '@/types/teacher'
import type { AttendanceStatus, DailyAttendanceRecord } from '@/types/attendance'
import { deleteTeacher, getDailyAttendance, getTeachers, useTeacherStore } from '@/stores/teachers'
import { deleteUser } from '@/stores/api'

type TabType = 'all' | 'government' | 'contract' | 'leave'

const router = useRouter()

const teachers = ref<PersonData[]>([])
const leaveRecords = ref<DailyAttendanceRecord[]>([])
const loading = ref(false)
const activeTab = ref<TabType>('all')
const searchQuery = ref('')
const showDeleteDialog = ref(false)
const showAttendanceDialog = ref(false)
const showReportTemplateDialog = ref(false)
const showExportReportDialog = ref(false)
const teacherToDelete = ref<PersonData | null>(null)
const deleting = ref(false)

const pagination = ref<PaginationData>({
  page: 1,
  per_page: 15,
  total_pages: 1,
  total_rows: 0,
})

const { canPreviousPage, canNextPage, getVisiblePages } = usePagination(pagination)

const isLeaveTab = computed(() => activeTab.value === 'leave')
const searchPlaceholder = computed(() => (isLeaveTab.value ? 'ค้นหาชื่อผู้ลา' : 'ค้นหาชื่อคุณครู'))
const tableTitle = computed(() => (isLeaveTab.value ? 'ข้อมูลการลา' : 'รายชื่อคุณครู'))

const fetchTeachers = async () => {
  loading.value = true
  try {
    const where: any[][] = []

    if (activeTab.value === 'government') {
      where.push([
        {
          table_name: 'person_data',
          field: 'is_government',
          operator: '=',
          value: 'true',
        },
      ])
    } else if (activeTab.value === 'contract') {
      where.push([
        {
          table_name: 'person_data',
          field: 'is_government',
          operator: '=',
          value: 'false',
        },
      ])
    }

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim()
      where.push([
        {
          table_name: 'person_data',
          field: 'first_name_th',
          operator: 'like',
          value: `%${query}%`,
        },
        { table_name: 'person_data', field: 'last_name_th', operator: 'like', value: `%${query}%` },
      ])
    }

    const response = await getTeachers({
      page: pagination.value.page,
      per_page: pagination.value.per_page,
      where: where.length > 0 ? where : undefined,
      sort_by: 'first_name_th',
      sort_order: 'asc',
    })

    teachers.value = response.data
    pagination.value.total_rows = response.total_rows
    pagination.value.total_pages = response.total_pages
  } catch (error: any) {
    console.error('Failed to fetch teachers:', error)
    toast.error('เกิดข้อผิดพลาด', {
      description: error.message || 'ไม่สามารถโหลดข้อมูลคุณครูได้',
    })
  } finally {
    loading.value = false
  }
}

const fetchDailyAttendance = async () => {
  loading.value = true
  try {
    const where: any[][] = []

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim()
      where.push([
        {
          table_name: 'person_data',
          field: 'first_name_th',
          operator: 'like',
          value: `%${query}%`,
        },
        { table_name: 'person_data', field: 'last_name_th', operator: 'like', value: `%${query}%` },
      ])
    }

    const response = await getDailyAttendance({
      page: pagination.value.page,
      per_page: pagination.value.per_page,
      where: where.length > 0 ? where : undefined,
      sort_by: 'date',
      sort_order: 'desc',
    })

    leaveRecords.value = response.data
    pagination.value.total_rows = response.total_rows
    pagination.value.total_pages = response.total_pages
  } catch (error: any) {
    console.error('Failed to fetch daily attendance:', error)
    toast.error('เกิดข้อผิดพลาด', {
      description: error.message || 'ไม่สามารถโหลดข้อมูลการลาได้',
    })
  } finally {
    loading.value = false
  }
}

const fetchCurrentTabData = async () => {
  if (isLeaveTab.value) {
    teachers.value = []
    await fetchDailyAttendance()
    return
  }

  leaveRecords.value = []
  await fetchTeachers()
}

const changeTab = (tab: TabType) => {
  activeTab.value = tab
  pagination.value.page = 1
}

watch([() => activeTab.value, () => pagination.value.page], () => {
  void fetchCurrentTabData()
})

let searchTimeout: number
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1
    void fetchCurrentTabData()
  }, 500) as unknown as number
})

onMounted(() => {
  void fetchCurrentTabData()
})

const goToPage = (page: number) => {
  pagination.value.page = page
}

const previousPage = () => {
  if (canPreviousPage.value) {
    pagination.value.page--
  }
}

const nextPage = () => {
  if (canNextPage.value) {
    pagination.value.page++
  }
}

const handleEdit = (teacher: PersonData) => {
  router.push({ name: ROUTE_NAMES.ADD_TEACHER_PERSONAL, query: { id: teacher.id } })
}

const handleDelete = (teacher: PersonData) => {
  teacherToDelete.value = teacher
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!teacherToDelete.value) return

  deleting.value = true
  try {
    let userDeleteFailed = false
    try {
      await deleteUser(teacherToDelete.value.id)
    } catch (userError) {
      userDeleteFailed = true
      console.error('Failed to delete user account:', userError)
    }

    await deleteTeacher(teacherToDelete.value.id)
    if (userDeleteFailed) {
      toast.warning('ลบบางส่วนสำเร็จ', {
        description: 'ลบข้อมูลคุณครูแล้ว แต่ลบบัญชีผู้ใช้ไม่สำเร็จ',
      })
    } else {
      toast.success('สำเร็จ', {
        description: 'ลบข้อมูลคุณครูและบัญชีผู้ใช้เรียบร้อยแล้ว',
      })
    }

    await fetchCurrentTabData()
  } catch (error: any) {
    console.error('Failed to delete teacher:', error)
    toast.error('เกิดข้อผิดพลาด', {
      description: error.message || 'ไม่สามารถลบข้อมูลคุณครูได้',
    })
  } finally {
    deleting.value = false
    showDeleteDialog.value = false
    teacherToDelete.value = null
  }
}

const cancelDelete = () => {
  showDeleteDialog.value = false
  teacherToDelete.value = null
}

const handleAddTeacher = () => {
  const teacherStore = useTeacherStore()
  teacherStore.clearCurrentTeacher()
  router.push({ name: ROUTE_NAMES.ADD_TEACHER_PERSONAL })
}

const handleAttendanceSuccess = async () => {
  await fetchCurrentTabData()
}

const handleReportTemplateSuccess = () => {
  showReportTemplateDialog.value = false
}

const getTeacherType = (teacher: PersonData) => {
  const isGov = (teacher.is_government as any) === true || (teacher.is_government as any) === 'true'
  return isGov ? 'ข้าราชการ' : 'ครูอัตราจ้าง'
}

const getAttendanceStatusLabel = (status: AttendanceStatus) => {
  const statusMap: Record<AttendanceStatus, string> = {
    present: 'มาปฏิบัติราชการปกติ',
    business_trip: 'ไปราชการ',
    sick_leave: 'ลาป่วย',
    personal_leave: 'ลากิจ',
    late: 'มาสาย',
    official_help: 'ไปช่วยราชการ',
    other: 'อื่นๆ',
  }

  return statusMap[status] || status
}

const formatAttendanceTime = (time?: string | null) => {
  if (!time) return '-'
  return time.slice(0, 5)
}

const getPersonDisplayName = (record: DailyAttendanceRecord) => {
  const person = record.person_data
  if (!person) return '-'

  return `${getPrefixName(person.prefix_id)}${person.first_name_th} ${person.last_name_th}`
}
</script>

<template>
  <MainLayout>
    <div class="flex h-full flex-col gap-3 py-3">
      <div class="shrink-0 space-y-2">
        <div class="bg-muted inline-flex items-center gap-1 rounded-lg p-1">
          <Button
            :variant="activeTab === 'all' ? 'default' : 'ghost'"
            size="sm"
            :class="activeTab !== 'all' && 'text-muted-foreground hover:bg-transparent'"
            @click="changeTab('all')"
          >
            ทั้งหมด
          </Button>
          <Button
            :variant="activeTab === 'government' ? 'default' : 'ghost'"
            size="sm"
            :class="activeTab !== 'government' && 'text-muted-foreground hover:bg-transparent'"
            @click="changeTab('government')"
          >
            ข้าราชการ
          </Button>
          <Button
            :variant="activeTab === 'contract' ? 'default' : 'ghost'"
            size="sm"
            :class="activeTab !== 'contract' && 'text-muted-foreground hover:bg-transparent'"
            @click="changeTab('contract')"
          >
            ครูอัตราจ้าง
          </Button>
          <Button
            :variant="activeTab === 'leave' ? 'default' : 'ghost'"
            size="sm"
            :class="activeTab !== 'leave' && 'text-muted-foreground hover:bg-transparent'"
            @click="changeTab('leave')"
          >
            ข้อมูลการลา
          </Button>
        </div>

        <div class="flex items-center justify-between gap-4">
          <div class="relative max-w-md flex-1">
            <Search
              class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
            />
            <Input
              v-model="searchQuery"
              type="text"
              :placeholder="searchPlaceholder"
              class="pl-10"
              :disabled="loading"
            />
          </div>

          <div class="flex items-center gap-2">
            <Button
              v-if="!isLeaveTab"
              class="bg-green-600 hover:bg-green-700"
              :disabled="loading"
              @click="handleAddTeacher"
            >
              <Plus class="mr-2 h-4 w-4" />
              เพิ่มรายชื่อ
            </Button>

            <template v-else>
              <Button variant="outline" :disabled="loading" @click="showExportReportDialog = true">
                ออกรายงานการลา
              </Button>
              <Button
                variant="outline"
                :disabled="loading"
                @click="showReportTemplateDialog = true"
              >
                กำหนด templates รายงาน
              </Button>
              <Button
                class="bg-green-600 hover:bg-green-700"
                :disabled="loading"
                @click="showAttendanceDialog = true"
              >
                <Plus class="mr-2 h-4 w-4" />
                เพิ่มข้อมูลการลา
              </Button>
            </template>
          </div>
        </div>
      </div>

      <div class="flex min-h-0 flex-1 flex-col">
        <div class="bg-primary text-primary-foreground mb-3 shrink-0 rounded-lg px-4 py-2">
          <h2 class="text-base font-semibold">{{ tableTitle }}</h2>
        </div>

        <div class="flex min-h-0 flex-1 flex-col rounded-lg border px-4">
          <table v-if="!isLeaveTab" class="w-full" style="table-layout: fixed">
            <thead class="bg-muted/50">
              <tr>
                <th class="py-2 text-left font-medium">ชื่อ</th>
                <th class="py-2 text-left font-medium">นามสกุล</th>
                <th class="py-2 text-center font-medium">ประเภท</th>
                <th class="py-2 text-center font-medium">การดำเนินการ</th>
              </tr>
            </thead>
          </table>

          <table v-else class="w-full" style="table-layout: fixed">
            <thead class="bg-muted/50">
              <tr>
                <th class="py-2 text-left font-medium">ชื่อ - นามสกุล</th>
                <th class="py-2 text-center font-medium">วันที่</th>
                <th class="py-2 text-center font-medium">สถานะ</th>
                <th class="py-2 text-center font-medium">เวลาเข้า</th>
                <th class="py-2 text-left font-medium">หมายเหตุ</th>
              </tr>
            </thead>
          </table>

          <div class="min-h-0 flex-1 overflow-auto">
            <table v-if="!isLeaveTab" class="w-full" style="table-layout: fixed">
              <tbody>
                <tr v-if="loading">
                  <td colspan="4" class="py-8 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <Loader2 class="h-5 w-5 animate-spin" />
                      <span class="text-muted-foreground">กำลังโหลดข้อมูล...</span>
                    </div>
                  </td>
                </tr>

                <tr v-else-if="teachers.length === 0">
                  <td colspan="4" class="text-muted-foreground py-8 text-center">
                    ไม่พบข้อมูลคุณครู
                  </td>
                </tr>

                <tr
                  v-for="teacher in teachers"
                  v-else
                  :key="teacher.id"
                  class="hover:bg-muted/30 border-t transition-colors"
                >
                  <td class="py-2 align-middle">
                    {{ teacher.prefixes?.prefixes_name_th || '' }}{{ teacher.first_name_th }}
                  </td>
                  <td class="py-2 align-middle">{{ teacher.last_name_th }}</td>
                  <td class="py-2 text-center align-middle">{{ getTeacherType(teacher) }}</td>
                  <td class="py-2 align-middle">
                    <div class="flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal class="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" class="flex flex-row gap-1 p-1">
                          <DropdownMenuItem class="cursor-pointer" @click="handleEdit(teacher)">
                            <Pencil class="mr-2 h-4 w-4" />
                            แก้ไข
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            class="cursor-pointer text-red-600"
                            @click="handleDelete(teacher)"
                          >
                            <Trash2 class="mr-2 h-4 w-4" />
                            ลบ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <table v-else class="w-full" style="table-layout: fixed">
              <tbody>
                <tr v-if="loading">
                  <td colspan="5" class="py-8 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <Loader2 class="h-5 w-5 animate-spin" />
                      <span class="text-muted-foreground">กำลังโหลดข้อมูล...</span>
                    </div>
                  </td>
                </tr>

                <tr v-else-if="leaveRecords.length === 0">
                  <td colspan="5" class="text-muted-foreground py-8 text-center">
                    ไม่พบข้อมูลการลา
                  </td>
                </tr>

                <tr
                  v-for="record in leaveRecords"
                  v-else
                  :key="record.id"
                  class="hover:bg-muted/30 border-t transition-colors"
                >
                  <td class="py-2 align-middle">{{ getPersonDisplayName(record) }}</td>
                  <td class="py-2 text-center align-middle">{{ formatDate(record.date) }}</td>
                  <td class="py-2 text-center align-middle">
                    {{ getAttendanceStatusLabel(record.status) }}
                  </td>
                  <td class="py-2 text-center align-middle">
                    {{ formatAttendanceTime(record.check_in_time) }}
                  </td>
                  <td class="py-2 align-middle">{{ record.remark || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="!loading && (isLeaveTab ? leaveRecords.length > 0 : teachers.length > 0)"
            class="flex shrink-0 items-center justify-end gap-2 border-t py-2"
          >
            <span class="text-muted-foreground mr-auto text-sm">
              แสดง {{ isLeaveTab ? leaveRecords.length : teachers.length }} รายการจาก
              {{ pagination.total_rows }} รายการทั้งหมด
            </span>

            <Button variant="ghost" size="sm" :disabled="!canPreviousPage" @click="previousPage">
              ← ก่อนหน้า
            </Button>

            <template v-for="(pageNum, index) in getVisiblePages" :key="index">
              <Button
                v-if="typeof pageNum === 'number'"
                :variant="pageNum === pagination.page ? 'default' : 'ghost'"
                size="sm"
                @click="goToPage(pageNum)"
              >
                {{ pageNum }}
              </Button>
              <span v-else class="px-2">...</span>
            </template>

            <Button variant="ghost" size="sm" :disabled="!canNextPage" @click="nextPage">
              ถัดไป →
            </Button>
          </div>
        </div>
      </div>
    </div>

    <AlertDialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
          <AlertDialogDescription>
            คุณต้องการลบคุณครู
            <span class="font-semibold">
              {{ teacherToDelete?.first_name_th }} {{ teacherToDelete?.last_name_th }}
            </span>
            ใช่หรือไม่?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="cancelDelete">ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            class="bg-red-600 hover:bg-red-700"
            :disabled="deleting"
            @click="confirmDelete"
          >
            {{ deleting ? 'กำลังลบ...' : 'ลบ' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <CreateAttendanceDialog
      :open="showAttendanceDialog"
      @close="showAttendanceDialog = false"
      @success="handleAttendanceSuccess"
    />
    <CreateAttendanceReportTemplateDialog
      :open="showReportTemplateDialog"
      @close="showReportTemplateDialog = false"
      @success="handleReportTemplateSuccess"
    />
    <ExportAttendanceReportDialog
      :open="showExportReportDialog"
      @close="showExportReportDialog = false"
    />
  </MainLayout>
</template>
