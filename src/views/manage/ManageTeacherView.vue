<script setup lang="ts">
import { ref, computed } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-vue-next'
import { usePagination } from '@/composables/usePagination'
import type { PaginationData } from '@/composables/usePagination'

// Teacher type definition
interface Teacher {
  id: number
  firstName: string
  lastName: string
  is_government: boolean
  status: 'active' | 'resigned'
}

// Tab types
type TabType = 'all' | 'government' | 'contract'

// Current active tab
const activeTab = ref<TabType>('all')

// Search query
const searchQuery = ref('')

// Mock teacher data (100+ teachers for pagination demonstration)
const mockTeachers = ref<Teacher[]>([
  { id: 1, firstName: 'นายก', lastName: 'ข้าว', is_government: true, status: 'active' },
  { id: 2, firstName: 'นายA', lastName: 'B', is_government: true, status: 'active' },
  { id: 3, firstName: 'นายB', lastName: 'A', is_government: true, status: 'active' },
  { id: 4, firstName: 'นายC', lastName: 'A', is_government: true, status: 'active' },
  { id: 5, firstName: 'นายC', lastName: 'B', is_government: true, status: 'active' },
  { id: 6, firstName: 'นายAB', lastName: 'CD', is_government: true, status: 'active' },
  { id: 7, firstName: 'นายABCD', lastName: 'ADC', is_government: true, status: 'active' },
  { id: 8, firstName: 'นายMID', lastName: 'LANE', is_government: false, status: 'active' },
  { id: 9, firstName: 'นายROV', lastName: 'MLBB', is_government: false, status: 'active' },
  { id: 10, firstName: 'นายAO', lastName: 'ค่าวOA', is_government: false, status: 'active' },
  { id: 11, firstName: 'นายPB', lastName: 'AUG', is_government: false, status: 'active' },
  { id: 12, firstName: 'นายVa', lastName: 'Lo', is_government: false, status: 'active' },
  { id: 13, firstName: 'นายVo', lastName: 'LA', is_government: true, status: 'active' },
  { id: 14, firstName: 'นายกองอยู่', lastName: 'ใช้', is_government: true, status: 'active' },
])

// Generate more mock data for pagination demonstration (total 1000 teachers)
for (let i = 15; i <= 1000; i++) {
  const statuses = ['active', 'resigned'] as const
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)] as 'active' | 'resigned'
  mockTeachers.value.push({
    id: i,
    firstName: `ครู${i}`,
    lastName: `สกุล${i}`,
    is_government: Math.random() > 0.5,
    status: randomStatus,
  })
}

// Pagination state
const pagination = ref<PaginationData>({
  page: 1,
  per_page: 15,
  total_pages: 1,
  total_rows: 0,
})

// Filtered teachers based on tab and search
const filteredTeachers = computed(() => {
  let teachers = mockTeachers.value

  // Filter by tab
  if (activeTab.value === 'government') {
    teachers = teachers.filter(t => t.is_government === true)
  } else if (activeTab.value === 'contract') {
    teachers = teachers.filter(t => t.is_government === false)
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    teachers = teachers.filter(
      t =>
        t.firstName.toLowerCase().includes(query) ||
        t.lastName.toLowerCase().includes(query)
    )
  }

  return teachers
})

// Paginated teachers for current page
const paginatedTeachers = computed(() => {
  const totalRows = filteredTeachers.value.length
  const totalPages = Math.ceil(totalRows / pagination.value.per_page)
  
  pagination.value.total_rows = totalRows
  pagination.value.total_pages = totalPages

  const start = (pagination.value.page - 1) * pagination.value.per_page
  const end = start + pagination.value.per_page
  
  return filteredTeachers.value.slice(start, end)
})

// Use pagination composable
const { canPreviousPage, canNextPage, getVisiblePages } = usePagination(pagination)

// Tab change handler
const changeTab = (tab: TabType) => {
  activeTab.value = tab
  pagination.value.page = 1 // Reset to first page when changing tab
}

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
const handleEdit = (teacher: Teacher) => {
  console.log('Edit teacher:', teacher)
  // TODO: Implement edit functionality
}

const handleDelete = (teacher: Teacher) => {
  console.log('Delete teacher:', teacher)
  // TODO: Implement delete functionality
}

const handleAddTeacher = () => {
  console.log('Add new teacher')
  // TODO: Implement add teacher functionality
}

// Get teacher type label
const getTeacherType = (teacher: Teacher) => {
  return teacher.is_government ? 'ข้าราชการ' : 'ครูอัตราจ้าง'
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
          />
        </div>
        <Button
          class="bg-green-600 hover:bg-green-700"
          @click="handleAddTeacher"
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
            <tr
              v-for="teacher in paginatedTeachers"
              :key="teacher.id"
              class="border-t hover:bg-muted/30 transition-colors"
            >
              <td class="py-3 px-4 align-middle">{{ teacher.firstName }}</td>
              <td class="py-3 px-4 align-middle">{{ teacher.lastName }}</td>
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
      <div class="flex justify-center items-center gap-2 py-4 border-t">
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
    <div class="text-sm text-muted-foreground text-center">
      แสดง {{ paginatedTeachers.length }} รายการจาก {{ pagination.total_rows }} รายการทั้งหมด
    </div>
  </div>
  </MainLayout>
</template>

<style scoped>
/* Add any custom styles here if needed */
</style>
