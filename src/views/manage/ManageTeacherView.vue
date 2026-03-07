<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
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
import type { PersonData } from '@/types/teacher'
import { getTeachers, deleteTeacher } from '@/stores/teachers'

// Tab types
type TabType = 'all' | 'government' | 'contract'

// State
const teachers = ref<PersonData[]>([])
const loading = ref(false)
const activeTab = ref<TabType>('all')
const searchQuery = ref('')

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
        value: true,
      })
    } else if (activeTab.value === 'contract') {
      filterConditions.push({
        column: 'is_government',
        operator: 'eq',
        value: false,
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
  console.log('Edit teacher:', teacher)
  toast.info('ฟีเจอร์กำลังพัฒนา', {
    description: 'ระบบแก้ไขข้อมูลคุณครูกำลังอยู่ระหว่างการพัฒนา',
  })
  // TODO: Implement edit functionality
}

const handleDelete = async (teacher: PersonData) => {
  if (!confirm(`คุณต้องการลบคุณครู ${teacher.first_name_th} ${teacher.last_name_th} ใช่หรือไม่?`)) {
    return
  }

  try {
    await deleteTeacher(teacher.id)
    toast.success('สำเร็จ', {
      description: 'ลบข้อมูลคุณครูเรียบร้อยแล้ว',
    })
    fetchTeachers() // Reload data
  } catch (error: any) {
    console.error('Failed to delete teacher:', error)
    toast.error('เกิดข้อผิดพลาด', {
      description: error.message || 'ไม่สามารถลบข้อมูลคุณครูได้',
    })
  }
}

const handleAddTeacher = () => {
  toast.info('ฟีเจอร์กำลังพัฒนา', {
    description: 'ระบบเพิ่มคุณครูกำลังอยู่ระหว่างการพัฒนา',
  })
  // TODO: Implement add teacher functionality
}

// Get teacher type label - เช็คจาก governments array
const getTeacherType = (teacher: PersonData) => {
  return teacher.governments && teacher.governments.length > 0 ? 'ข้าราชการ' : 'ครูอัตราจ้าง'
}
</script>

<template>
  <MainLayout>
    <div class="container mx-auto py-6 space-y-6">
      <!-- Header with tabs, search, and add button -->
      <div class="space-y-4">
      <!-- Tabs -->
      <div class="flex gap-2">
        <Button
          :variant="activeTab === 'all' ? 'default' : 'outline'"
          @click="changeTab('all')"
        >
          ทั้งหมด
        </Button>
        <Button
          :variant="activeTab === 'government' ? 'default' : 'outline'"
          @click="changeTab('government')"
        >
          ข้าราชการ
        </Button>
        <Button
          :variant="activeTab === 'contract' ? 'default' : 'outline'"
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
    <div class="bg-blue-600 text-white rounded-t-lg p-4">
      <h2 class="text-lg font-semibold">รายชื่อคุณครู</h2>
    </div>
    
    <div class="border rounded-b-lg overflow-hidden">
      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-muted/50">
            <tr>
              <th class="text-left py-3 px-4 font-medium">ชื่อ</th>
              <th class="text-left py-3 px-4 font-medium">นามสกุล</th>
              <th class="text-center py-3 px-4 font-medium">ประเภท</th>
              <th class="text-center py-3 px-4 font-medium">การดำเนินการ</th>
            </tr>
          </thead>
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
              <td class="py-3 px-4 align-middle">{{ teacher.first_name_th }}</td>
              <td class="py-3 px-4 align-middle">{{ teacher.last_name_th }}</td>
              <td class="py-3 px-4 text-center align-middle">{{ getTeacherType(teacher) }}</td>
              <td class="py-3 px-4 align-middle">
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

      <!-- Pagination -->
      <div v-if="!loading && teachers.length > 0" class="flex justify-center items-center gap-2 py-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          :disabled="!canPreviousPage"
          @click="previousPage"
        >
          Previous
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
          Next
        </Button>
      </div>
    </div>

    <!-- Stats -->
    <div v-if="!loading" class="text-sm text-muted-foreground text-center">
      แสดง {{ teachers.length }} รายการจาก {{ pagination.total_rows }} รายการทั้งหมด
    </div>
  </div>
  </MainLayout>
</template>