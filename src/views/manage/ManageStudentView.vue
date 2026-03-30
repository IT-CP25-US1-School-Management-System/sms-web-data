<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import CreateStudentModal from '@/views/manage/CreateStudentModal.vue'
import { usePagination } from '@/composables/usePagination'
import type { PaginationData } from '@/composables/usePagination'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import MainLayout from '@/layouts/manage/MainLayout.vue'
import { deleteStudent, getStudents } from '@/stores/students'
import type { Student } from '@/types/student'

const students = ref<Student[]>([])
const loading = ref(false)
const searchQuery = ref('')
const showCreateModal = ref(false)
const selectedStudentId = ref<string | null>(null)
const selectedStudent = ref<Student | null>(null)

const pagination = ref<PaginationData>({
  page: 1,
  per_page: 15,
  total_pages: 1,
  total_rows: 0,
})

const { canNextPage, canPreviousPage, getVisiblePages } = usePagination(pagination)

const fetchStudents = async () => {
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
        {
          table_name: 'person_data',
          field: 'last_name_th',
          operator: 'like',
          value: `%${query}%`,
        },
        {
          table_name: 'person_data',
          field: 'student_id',
          operator: 'like',
          value: `%${query}%`,
        },
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

watch(
  () => pagination.value.page,
  () => {
    fetchStudents()
  },
)

let searchTimeout: number
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1
    fetchStudents()
  }, 500) as unknown as number
})

onMounted(() => {
  fetchStudents()
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

const handleEdit = (student: Student) => {
  selectedStudentId.value = student.id
  selectedStudent.value = student
  showCreateModal.value = true
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
    fetchStudents()
  } catch (error: any) {
    console.error('Failed to delete student:', error)
    toast.error('เกิดข้อผิดพลาด', {
      description: error.message || 'ไม่สามารถลบข้อมูลนักเรียนได้',
    })
  }
}

const handleAddStudent = () => {
  selectedStudentId.value = null
  selectedStudent.value = null
  showCreateModal.value = true
}

const handleModalSuccess = () => {
  fetchStudents()
}

const handleModalClose = () => {
  showCreateModal.value = false
  selectedStudentId.value = null
  selectedStudent.value = null
}
</script>

<template>
  <MainLayout>
    <div class="flex h-full flex-col gap-3 py-3">
      <div class="flex shrink-0 items-center justify-between gap-4">
        <div class="relative max-w-md flex-1">
          <Search
            class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
          />
          <Input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหาชื่อนักเรียน"
            class="pl-10"
            :disabled="loading"
          />
        </div>
        <Button class="bg-green-600 hover:bg-green-700" @click="handleAddStudent" :disabled="loading">
          <Plus class="mr-2 h-4 w-4" />
          เพิ่มรายชื่อ
        </Button>
      </div>

      <div class="flex min-h-0 flex-1 flex-col">
        <div class="bg-primary text-primary-foreground mb-3 shrink-0 rounded-lg px-4 py-2">
          <h2 class="text-base font-semibold">รายชื่อนักเรียน</h2>
        </div>

        <div class="flex min-h-0 flex-1 flex-col rounded-lg border px-4">
          <table class="w-full" style="table-layout: fixed">
            <thead class="bg-muted/50">
              <tr>
                <th class="py-2 text-left font-medium">ชื่อ</th>
                <th class="py-2 text-left font-medium">นามสกุล</th>
                <th class="py-2 text-center font-medium">เลขประจำตัว</th>
                <th class="py-2 text-center font-medium">ชั้น</th>
                <th class="py-2 text-center font-medium">ห้อง</th>
                <th class="py-2 text-center font-medium">การดำเนินการ</th>
              </tr>
            </thead>
          </table>

          <div class="min-h-0 flex-1 overflow-auto">
            <table class="w-full" style="table-layout: fixed">
              <tbody>
                <tr v-if="loading">
                  <td colspan="6" class="py-8 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <Loader2 class="h-5 w-5 animate-spin" />
                      <span class="text-muted-foreground">กำลังโหลดข้อมูล...</span>
                    </div>
                  </td>
                </tr>

                <tr v-else-if="students.length === 0">
                  <td colspan="6" class="text-muted-foreground py-8 text-center">
                    ไม่พบข้อมูลนักเรียน
                  </td>
                </tr>

                <tr
                  v-else
                  v-for="student in students"
                  :key="student.id"
                  class="hover:bg-muted/30 border-t transition-colors"
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
                            <Pencil class="mr-2 h-4 w-4" />
                            แก้ไข
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            @click="handleDelete(student)"
                            class="cursor-pointer text-red-600"
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
          </div>

          <div
            v-if="!loading && students.length > 0"
            class="flex shrink-0 items-center justify-end gap-2 border-t py-2"
          >
            <span class="text-muted-foreground mr-auto text-sm">
              แสดง {{ students.length }} รายการจาก {{ pagination.total_rows }} รายการทั้งหมด
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
  </MainLayout>

  <CreateStudentModal
    v-if="showCreateModal"
    :mode="selectedStudentId ? 'edit' : 'create'"
    :student-id="selectedStudentId"
    :student-data="selectedStudent"
    @close="handleModalClose"
    @success="handleModalSuccess"
  />
</template>

<style scoped>
</style>
