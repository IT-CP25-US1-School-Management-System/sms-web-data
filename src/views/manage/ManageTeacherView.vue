<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/layouts/manage/MainLayout.vue'
import { Button } from '@/components/ui/button'
import { ROUTE_NAMES } from '@/lib/constants'
import { Input } from '@/components/ui/input'
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
import { getTeachers, deleteTeacher, useTeacherStore } from '@/stores/teachers'

// Tab types
type TabType = 'all' | 'government' | 'contract'

const router = useRouter()

// State
const teachers = ref<PersonData[]>([])
const loading = ref(false)
const activeTab = ref<TabType>('all')
const searchQuery = ref('')
const showDeleteDialog = ref(false)
const teacherToDelete = ref<PersonData | null>(null)
const deleting = ref(false)

// Pagination state
const pagination = ref<PaginationData>({
  page: 1,
  per_page: 15,
  total_pages: 1,
  total_rows: 0,
})

// Use pagination composable
const { canPreviousPage, canNextPage, getVisiblePages } = usePagination(pagination)

// Fetch teachers from API
const fetchTeachers = async () => {
  loading.value = true
  try {
    // Build filter object
    const filterConditions: any[] = []

    // Add tab filter for is_government (server-side)
    if (activeTab.value === 'government') {
      filterConditions.push({
        column: 'is_government',
        operator: 'eq',
        value: 'true',
      })
    } else if (activeTab.value === 'contract') {
      filterConditions.push({
        column: 'is_government',
        operator: 'eq',
        value: 'false',
      })
    }

    // Add search filter if query exists
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim()
      filterConditions.push({
        logic: 'OR',
        conditions: [
          { column: 'first_name_th', operator: 'like', value: `%${query}%` },
          { column: 'last_name_th', operator: 'like', value: `%${query}%` },
        ],
      })
    }

    const response = await getTeachers({
      page: pagination.value.page,
      per_page: pagination.value.per_page,
      filter: filterConditions.length > 0 ? filterConditions : undefined,
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

// Tab change handler
const changeTab = (tab: TabType) => {
  activeTab.value = tab
  pagination.value.page = 1 // Reset to first page when changing tab
}

// Watch for tab and pagination changes
watch([() => activeTab.value, () => pagination.value.page], () => {
  fetchTeachers()
})

// Watch for search query changes (debounced)
let searchTimeout: number
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1 // Reset to first page on search
    fetchTeachers()
  }, 500) as unknown as number // 500ms debounce
})

// Load data on mount
onMounted(() => {
  fetchTeachers()
})

// Page change handler
const goToPage = (page: number) => {
  pagination.value.page = page
}

// Previous page handler
const previousPage = () => {
  if (canPreviousPage.value) {
    pagination.value.page--
  }
}

// Next page handler
const nextPage = () => {
  if (canNextPage.value) {
    pagination.value.page++
  }
}

// Action handlers
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
    await deleteTeacher(teacherToDelete.value.id)
    toast.success('สำเร็จ', {
      description: 'ลบข้อมูลคุณครูเรียบร้อยแล้ว',
    })
    fetchTeachers() // Reload data
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

// Get teacher type label - เช็คจาก is_government field (handle boolean or string "true"/"false")
const getTeacherType = (teacher: PersonData) => {
  const isGov = (teacher.is_government as any) === true || (teacher.is_government as any) === 'true'
  return isGov ? 'ข้าราชการ' : 'ครูอัตราจ้าง'
}
</script>

<template>
  <MainLayout>
    <div class="flex h-full flex-col gap-3 py-3">
      <!-- Header with tabs, search, and add button -->
      <div class="shrink-0 space-y-2">
      <!-- Tabs -->
      <div class="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
        <Button
          :variant="activeTab === 'all' ? 'default' : 'ghost'"
          size="sm"
          :class="activeTab !== 'all' && 'hover:bg-transparent text-muted-foreground'"
          @click="changeTab('all')"
        >
          ทั้งหมด
        </Button>
        <Button
          :variant="activeTab === 'government' ? 'default' : 'ghost'"
          size="sm"
          :class="activeTab !== 'government' && 'hover:bg-transparent text-muted-foreground'"
          @click="changeTab('government')"
        >
          ข้าราชการ
        </Button>
        <Button
          :variant="activeTab === 'contract' ? 'default' : 'ghost'"
          size="sm"
          :class="activeTab !== 'contract' && 'hover:bg-transparent text-muted-foreground'"
          @click="changeTab('contract')"
        >
          ครูอัตราจ้าง
        </Button>
      </div>

      <!-- Search and Add button -->
      <div class="flex gap-4 justify-between items-center">
        <div class="relative flex-1 max-w-md">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหาชื่อคุณครู"
            class="pl-10"
            :disabled="loading"
          />
        </div>
        <Button
          class="bg-green-600 hover:bg-green-700"
          @click="handleAddTeacher"
          :disabled="loading"
        >
          <Plus class="h-4 w-4 mr-2" />
          เพิ่มรายชื่อ
        </Button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="flex min-h-0 flex-1 flex-col">
      <div class="shrink-0 bg-primary text-primary-foreground rounded-lg px-4 py-2 mb-3">
        <h2 class="text-base font-semibold">รายชื่อคุณครู</h2>
      </div>

      <div class="flex min-h-0 flex-1 flex-col border rounded-lg px-4">
        <!-- Table header (fixed, not scrollable) -->
        <table class="w-full" style="table-layout: fixed">
          <thead class="bg-muted/50">
            <tr>
              <th class="text-left py-2 font-medium">ชื่อ</th>
              <th class="text-left py-2 font-medium">นามสกุล</th>
              <th class="text-center py-2 font-medium">ประเภท</th>
              <th class="text-center py-2 font-medium">การดำเนินการ</th>
            </tr>
          </thead>
        </table>

        <!-- Table body (scrollable) -->
        <div class="min-h-0 flex-1 overflow-auto">
          <table class="w-full" style="table-layout: fixed">
            <tbody>
              <!-- Loading state -->
              <tr v-if="loading">
                <td colspan="4" class="py-8 text-center">
                  <div class="flex justify-center items-center gap-2">
                    <Loader2 class="h-5 w-5 animate-spin" />
                    <span class="text-muted-foreground">กำลังโหลดข้อมูล...</span>
                  </div>
                </td>
              </tr>
              <!-- Empty state -->
              <tr v-else-if="teachers.length === 0">
                <td colspan="4" class="py-8 text-center text-muted-foreground">
                  ไม่พบข้อมูลคุณครู
                </td>
              </tr>
              <!-- Data rows -->
              <tr
                v-else
                v-for="teacher in teachers"
                :key="teacher.id"
                class="border-t hover:bg-muted/30 transition-colors"
              >
                <td class="py-2 align-middle">{{teacher.prefixes?.prefixes_name_th || ''}}{{ teacher.first_name_th }}</td>

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
                        <DropdownMenuItem @click="handleEdit(teacher)" class="cursor-pointer">
                          <Pencil class="h-4 w-4 mr-2" />
                          แก้ไข
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          @click="handleDelete(teacher)"
                          class="text-red-600 cursor-pointer"
                        >
                          <Trash2 class="h-4 w-4 mr-2" />
                          ลบ
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination - fixed at bottom -->
        <div v-if="!loading && teachers.length > 0" class="shrink-0 flex items-center justify-end gap-2 border-t py-2">
          <span class="mr-auto text-sm text-muted-foreground">
            แสดง {{ teachers.length }} รายการจาก {{ pagination.total_rows }} รายการทั้งหมด
          </span>

          <Button
            variant="ghost"
            size="sm"
            :disabled="!canPreviousPage"
            @click="previousPage"
          >
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

          <Button
            variant="ghost"
            size="sm"
            :disabled="!canNextPage"
            @click="nextPage"
          >
            ถัดไป →
          </Button>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Dialog -->
  <AlertDialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
        <AlertDialogDescription>
          คุณต้องการลบคุณครู
          <span class="font-semibold">{{ teacherToDelete?.first_name_th }} {{ teacherToDelete?.last_name_th }}</span>
          ใช่หรือไม่?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="cancelDelete">ยกเลิก</AlertDialogCancel>
        <AlertDialogAction
          @click="confirmDelete"
          :disabled="deleting"
          class="bg-red-600 hover:bg-red-700"
        >
          {{ deleting ? 'กำลังลบ...' : 'ลบ' }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  </MainLayout>
</template>