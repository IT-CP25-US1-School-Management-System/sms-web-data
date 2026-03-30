<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/layouts/manage/MainLayout.vue'
import { Button } from '@/components/ui/button'
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
import type { DocumentRequest } from '@/types/document_request'
import {
  getDocumentRequests,
  deleteDocumentRequest,
  createDocumentRequest,
} from '@/stores/document_request'
import { ROUTE_NAMES } from '@/lib/constants'
import { getPrefixName } from '@/lib/helpers'

const router = useRouter()

// State
const requests = ref<DocumentRequest[]>([])
const loading = ref(false)
const searchQuery = ref('')
const showDeleteDialog = ref(false)
const requestToDelete = ref<DocumentRequest | null>(null)
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

// Fetch document requests from API
const fetchRequests = async () => {
  loading.value = true
  try {
    const response = await getDocumentRequests()
    requests.value = response.data
    pagination.value.total_rows = response.total_rows || response.data.length
    pagination.value.total_pages = Math.ceil(
      pagination.value.total_rows / pagination.value.per_page,
    )
  } catch (error: any) {
    console.error('Failed to fetch requests:', error)
    toast.error('เกิดข้อผิดพลาด', {
      description: error.message || 'ไม่สามารถโหลดข้อมูลคำร้องเอกสารได้',
    })
  } finally {
    loading.value = false
  }
}

// Watch for pagination changes
watch(
  () => pagination.value.page,
  () => {
    fetchRequests()
  },
)

// Watch for search query changes (debounced)
let searchTimeout: number
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1 // Reset to first page on search
    fetchRequests()
  }, 500) as unknown as number
})

// Load data on mount
onMounted(() => {
  fetchRequests()
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
const handleEdit = (request: DocumentRequest) => {
  router.push({
    name: ROUTE_NAMES.REQUEST_EDIT,
    params: { id: request.id },
  })
}

const handleDelete = (request: DocumentRequest) => {
  requestToDelete.value = request
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!requestToDelete.value) return

  deleting.value = true
  try {
    await deleteDocumentRequest(requestToDelete.value.id)
    toast.success('สำเร็จ', {
      description: 'ลบคำร้องเอกสารเรียบร้อยแล้ว',
    })
    fetchRequests() // Reload data
  } catch (error: any) {
    console.error('Failed to delete request:', error)
    toast.error('เกิดข้อผิดพลาด', {
      description: error.message || 'ไม่สามารถลบคำร้องเอกสารได้',
    })
  } finally {
    deleting.value = false
    showDeleteDialog.value = false
    requestToDelete.value = null
  }
}

const cancelDelete = () => {
  showDeleteDialog.value = false
  requestToDelete.value = null
}

const handleAddRequest = async () => {
  // Create a simple new request and POST to API
  const startDate = new Date()
  const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days later

  const newRequestData: Omit<DocumentRequest, 'id' | 'created_at' | 'updated_at'> = {
    person_id: 'ea77ec78-1d48-4d76-b826-089c5cd8e764',
    document_type: 'ใบการศึกษา',
    title: 'คำร้องเอกสารใหม่',
    description: 'คำร้องใหม่',
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    quantity: 1,
    status: 'กำลังดำเนินการ',
  }

  try {
    await createDocumentRequest(newRequestData)
    toast.success('สำเร็จ', {
      description: 'เพิ่มคำร้องเอกสารใหม่',
    })
    fetchRequests() // Reload data
  } catch (error: any) {
    console.error('Failed to create request:', error)
    toast.error('เกิดข้อผิดพลาด', {
      description: error.message || 'ไม่สามารถเพิ่มคำร้องเอกสารได้',
    })
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusColor(
  status: 'กำลังดำเนินการ' | 'อนุมัติ' | 'ไม่อนุมัติ' | null | undefined,
): string {
  const normalizedStatus = status || 'กำลังดำเนินการ' // Treat null/undefined as "กำลังดำเนินการ"
  const colors: Record<'กำลังดำเนินการ' | 'อนุมัติ' | 'ไม่อนุมัติ', string> = {
    กำลังดำเนินการ: 'bg-yellow-300 text-blue-800',
    อนุมัติ: 'bg-green-600 text-white',
    ไม่อนุมัติ: 'bg-red-400 text-white',
  }
  return colors[normalizedStatus] || 'bg-gray-100 text-gray-800'
}
</script>

<template>
  <MainLayout>
    <div class="flex h-full flex-col gap-3 py-3">
      <!-- Header with search and add button -->
      <div class="shrink-0 space-y-2">
        <div class="flex items-center justify-between gap-4">
          <div class="relative max-w-md flex-1">
            <Search
              class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
            />
            <Input
              v-model="searchQuery"
              type="text"
              placeholder="ค้นหากำลังตรวจสอบ"
              class="pl-10"
              :disabled="loading"
            />
          </div>
          <Button
            class="bg-green-600 hover:bg-green-700"
            @click="handleAddRequest"
            :disabled="loading"
          >
            <Plus class="mr-2 h-4 w-4" />
            เพิ่มคำร้องใหม่
          </Button>
        </div>
      </div>

      <!-- Table Card -->
      <div class="flex min-h-0 flex-1 flex-col">
        <div class="bg-primary text-primary-foreground mb-3 shrink-0 rounded-lg px-4 py-2">
          <h2 class="text-base font-semibold">คำร้องเอกสาร</h2>
        </div>

        <div class="flex min-h-0 flex-1 flex-col rounded-lg border px-4">
          <!-- Table header (fixed, not scrollable) -->
          <table class="w-full" style="table-layout: fixed">
            <thead class="bg-muted/50">
              <tr>
                <th class="py-2 text-left font-medium">ผู้ยื่นคำร้อง</th>
                <th class="py-2 text-left font-medium">ประเภทเอกสาร</th>
                <th class="py-2 text-left font-medium">สถานะ</th>
                <th class="py-2 text-left font-medium">วันที่ยื่น</th>
                <th class="py-2 text-center font-medium">การดำเนินการ</th>
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
                    <div class="flex items-center justify-center gap-2">
                      <Loader2 class="h-5 w-5 animate-spin" />
                      <span class="text-muted-foreground">กำลังโหลดข้อมูล...</span>
                    </div>
                  </td>
                </tr>
                <!-- Empty state -->
                <tr v-else-if="requests.length === 0">
                  <td colspan="4" class="text-muted-foreground py-8 text-center">
                    ไม่พบข้อมูลคำร้องเอกสาร
                  </td>
                </tr>
                <!-- Data rows -->
                <tr
                  v-else
                  v-for="request in requests"
                  :key="request.id"
                  class="hover:bg-muted/30 border-t transition-colors"
                >
                  <td class="py-2 align-middle">
                    <div v-if="request.person_data?.length" class="text-sm">
                      {{ getPrefixName(request.person_data?.[0]?.prefix_id)
                      }}{{ request.person_data?.[0]?.first_name_th }}
                      {{ request.person_data?.[0]?.last_name_th }}
                    </div>
                    <div v-else class="text-muted-foreground text-sm">-</div>
                  </td>
                  <td class="py-2 align-middle">{{ request.document_type }}</td>
                  <td class="py-2 align-middle">
                    <span
                      :class="[
                        'rounded-full px-3 py-1 text-sm font-medium',
                        getStatusColor(request.status || undefined),
                      ]"
                    >
                      {{ request.status || 'กำลังดำเนินการ' }}
                    </span>
                  </td>
                  <td class="py-2 align-middle">{{ formatDate(request.created_at) }}</td>
                  <td class="py-2 align-middle">
                    <div class="flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal class="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" class="flex flex-row gap-1 p-1">
                          <DropdownMenuItem @click="handleEdit(request)" class="cursor-pointer">
                            <Pencil class="mr-2 h-4 w-4" />
                            แก้ไข
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            @click="handleDelete(request)"
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

          <!-- Pagination - fixed at bottom -->
          <div
            v-if="!loading && requests.length > 0"
            class="flex shrink-0 items-center justify-end gap-2 border-t py-2"
          >
            <span class="text-muted-foreground mr-auto text-sm">
              แสดง {{ requests.length }} รายการจาก {{ pagination.total_rows }} รายการทั้งหมด
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

    <!-- Delete Confirmation Dialog -->
    <AlertDialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
          <AlertDialogDescription>
            คุณต้องการลบคำร้องเอกสาร
            <span class="font-semibold">{{ requestToDelete?.document_type }}</span>
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

<style scoped></style>
