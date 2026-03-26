<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import MainLayout from '@/layouts/manage/MainLayout.vue'
import CreateStudentModal from '@/views/manage/CreateStudentModal.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-vue-next'
import { usePagination } from '@/composables/usePagination'
import type { PaginationData } from '@/composables/usePagination'
import { toast } from 'vue-sonner'
import type { Student } from '@/types/student'
import { getStudents, deleteStudent } from '@/stores/students'

// State
const students = ref<Student[]>([])
const loading = ref(false)
const searchQuery = ref('')
const showCreateModal = ref(false)

// Pagination state
const pagination = ref<PaginationData>({
  page: 1,
  per_page: 15,
  total_pages: 1,
  total_rows: 0,
})

// Use pagination composable
const { canPreviousPage, canNextPage, getVisiblePages } = usePagination(pagination)

// Fetch students from API
const fetchStudents = async () => {
  loading.value = true
  try {
    // Build where array for API
    const where: any[][] = []

    // Example: filter by gender_id (replace as needed)
    // where.push([
    //   { table_name: 'person_data', field: 'gender_id', operator: '=', value: 'ชาย' }
    // ])

    // Add search filter if query exists (example: filter by name)
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim()
      where.push([
        { table_name: 'person_data', field: 'first_name_th', operator: 'like', value: `%${query}%` },
        { table_name: 'person_data', field: 'last_name_th', operator: 'like', value: `%${query}%` },
        { table_name: 'person_data', field: 'student_id', operator: 'like', value: `%${query}%` },
      ])
    }

    const response = await getStudents({
      page: pagination.value.page,
      per_page: pagination.value.per_page,
      where: where.length > 0 ? where : undefined,
    })

    students.value = response.data
    pagination.value.total_rows = response.total_rows
    pagination.value.total_pages = response.total_pages
  } catch (error: any) {
    console.error('Failed to fetch students:', error)
    toast.error('เกิดข้อผิดพลาด', {
      description: error.message || 'ไม่สามารถโหลดข้อมูลนักเรียนได้',
    })
  } finally {
    loading.value = false
  }
}

// Watch for pagination changes
watch(() => pagination.value.page, () => {
  fetchStudents()
})

// Watch for search query changes (debounced)
let searchTimeout: number
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1 // Reset to first page on search
    fetchStudents()
  }, 500) as unknown as number // 500ms debounce
})

// Load data on mount
onMounted(() => {
  fetchStudents()
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
const handleEdit = (student: Student) => {
  console.log('Edit student:', student)
  toast.info('ฟีเจอร์กำลังพัฒนา', {
    description: 'ระบบแก้ไขข้อมูลนักเรียนกำลังอยู่ระหว่างการพัฒนา',
  })
  // TODO: Implement edit functionality
}

const handleDelete = async (student: Student) => {
  if (!confirm(`คุณต้องการลบนักเรียน ${student.first_name_th} ${student.last_name_th} ใช่หรือไม่?`)) {
    return
  }

  try {
    await deleteStudent(student.id)
    toast.success('สำเร็จ', {
      description: 'ลบข้อมูลนักเรียนเรียบร้อยแล้ว',
    })
    fetchStudents() // Reload data
  } catch (error: any) {
    console.error('Failed to delete student:', error)
    toast.error('เกิดข้อผิดพลาด', {
      description: error.message || 'ไม่สามารถลบข้อมูลนักเรียนได้',
    })
  }
}

const handleAddStudent = () => {
  showCreateModal.value = true
}

const handleModalSuccess = () => {
  // Refetch students after successful creation
  fetchStudents()
}
</script>

<template>
  <MainLayout>
    <div class="flex h-full flex-col gap-3 py-3">
      <!-- Header with search and add button -->
      <div class="shrink-0 flex gap-4 justify-between items-center">
        <div class="relative flex-1 max-w-md">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหาชื่อนักเรียน"
            class="pl-10"
            :disabled="loading"
          />
        </div>
        <Button
          class="bg-green-600 hover:bg-green-700"
          @click="handleAddStudent"
          :disabled="loading"
        >
          <Plus class="h-4 w-4 mr-2" />
          เพิ่มรายชื่อ
        </Button>
      </div>

    <!-- Table Card -->
    <div class="flex min-h-0 flex-1 flex-col">
      <div class="shrink-0 bg-primary text-primary-foreground rounded-lg px-4 py-2 mb-3">
        <h2 class="text-base font-semibold">รายชื่อนักเรียน</h2>
      </div>

      <div class="flex min-h-0 flex-1 flex-col border rounded-lg px-4">
        <!-- Table header (fixed, not scrollable) -->
        <table class="w-full" style="table-layout: fixed">
          <thead class="bg-muted/50">
            <tr>
              <th class="text-left py-2 font-medium">ชื่อ</th>
              <th class="text-left py-2 font-medium">นามสกุล</th>
              <th class="text-center py-2 font-medium">เลขประจำตัว</th>
              <th class="text-center py-2 font-medium">ชั้น</th>
              <th class="text-center py-2 font-medium">ห้อง</th>
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
                <td colspan="6" class="py-8 text-center">
                  <div class="flex justify-center items-center gap-2">
                    <Loader2 class="h-5 w-5 animate-spin" />
                    <span class="text-muted-foreground">กำลังโหลดข้อมูล...</span>
                  </div>
                </td>
              </tr>
              <!-- Empty state -->
              <tr v-else-if="students.length === 0">
                <td colspan="6" class="py-8 text-center text-muted-foreground">
                  ไม่พบข้อมูลนักเรียน
                </td>
              </tr>
              <!-- Data rows -->
              <tr
                v-else
                v-for="student in students"
                :key="student.id"
                class="border-t hover:bg-muted/30 transition-colors"
              >
                <td class="py-2 align-middle">{{ student.first_name_th }}</td>
                <td class="py-2 align-middle">{{ student.last_name_th }}</td>
                <td class="py-2 text-center align-middle">{{ student.student_id }}</td>
                <td class="py-2 text-center align-middle">{{ student.grade_level }}</td>
                <td class="py-2 text-center align-middle">{{ student.class_section }}</td>
                <td class="py-2 align-middle">
                  <div class="flex justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal class="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" class="flex flex-row gap-1 p-1">
                        <DropdownMenuItem @click="handleEdit(student)" class="cursor-pointer">
                          <Pencil class="h-4 w-4 mr-2" />
                          แก้ไข
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          @click="handleDelete(student)"
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

        <!-- Pagination — always visible at bottom -->
        <div v-if="!loading && students.length > 0" class="shrink-0 flex items-center justify-end gap-2 border-t py-2">
          <span class="mr-auto text-sm text-muted-foreground">
            แสดง {{ students.length }} รายการจาก {{ pagination.total_rows }} รายการทั้งหมด
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
  </MainLayout>

  <!-- Create Student Modal -->
  <CreateStudentModal
    v-if="showCreateModal"
    @close="showCreateModal = false"
    @success="handleModalSuccess"
  />
</template>

<style scoped>
/* Add any custom styles here if needed */
</style>
