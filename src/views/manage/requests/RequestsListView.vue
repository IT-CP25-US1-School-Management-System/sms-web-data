<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Loader2, Pencil, Search, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import MainLayout from '@/layouts/manage/MainLayout.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import TableActions from '@/components/TableActions.vue'
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
import { usePagination, type PaginationData } from '@/composables/usePagination'
import { ROUTE_NAMES } from '@/lib/constants'
import { documentRequestFullName } from '@/lib/documentRequest'
import { formatThaiBuddhistDate } from '@/lib/helpers'
import { deleteDocumentRequest, getDocumentRequests } from '@/stores/document_request'
import type { DocumentRequest } from '@/types/document_request'

const router = useRouter()
const requests = ref<DocumentRequest[]>([])
const loading = ref(false)
const error = ref('')
const searchInput = ref('')
const search = ref('')
const perPageInput = ref(15)
const showDeleteDialog = ref(false)
const requestToDelete = ref<DocumentRequest | null>(null)
const deleting = ref(false)
const pagination = ref<PaginationData>({ page: 1, per_page: 15, total_rows: 0, total_pages: 1 })
const { canPreviousPage, canNextPage, getVisiblePages } = usePagination(pagination)
const columns = [
  { label: 'ชื่อ - สกุล', width: '25%' },
  { label: 'ประเภทเอกสาร', width: '26%' },
  { label: 'สถานะ', width: '17%' },
  { label: 'วันที่ส่งคำร้อง', width: '20%' },
  { label: 'การดำเนินการ', width: '12%' },
]

const rowActions = [
  { key: 'edit', label: 'แก้ไข', icon: Pencil },
  { key: 'delete', label: 'ลบ', icon: Trash2, destructive: true },
]

let generation = 0
let searchTimeout: ReturnType<typeof setTimeout> | undefined

async function load() {
  const current = ++generation
  loading.value = true
  error.value = ''
  requests.value = []
  try {
    const query = search.value.trim()
    const response = await getDocumentRequests({
      page: pagination.value.page,
      per_page: pagination.value.per_page,
      sort_by: 'created_at',
      sort_order: 'desc',
      where_logical_operator: 'AND',
      where: query
        ? [
            [
              {
                table_name: 'document_requests',
                field: 'document_type',
                operator: 'LIKE',
                value: `%${query}%`,
              },
              {
                table_name: 'document_requests',
                field: 'title',
                operator: 'LIKE',
                value: `%${query}%`,
              },
              {
                table_name: 'person_data',
                field: 'first_name_th',
                operator: 'LIKE',
                value: `%${query}%`,
              },
              {
                table_name: 'person_data',
                field: 'last_name_th',
                operator: 'LIKE',
                value: `%${query}%`,
              },
            ],
          ]
        : undefined,
    })
    if (current !== generation) return
    const rows = response.data.flat()
    const hasBrokenCount = rows.length > 0 && response.total_rows === 0
    requests.value = rows
    pagination.value.total_rows = hasBrokenCount
      ? (pagination.value.page - 1) * pagination.value.per_page + rows.length
      : response.total_rows
    pagination.value.total_pages = hasBrokenCount
      ? rows.length < pagination.value.per_page
        ? pagination.value.page
        : pagination.value.page + 1
      : Math.max(response.total_pages, 1)
  } catch (cause) {
    if (current !== generation) return
    const message = (cause as { response?: { data?: { message?: unknown } } })?.response?.data
      ?.message
    error.value = typeof message === 'string' ? message : 'ไม่สามารถโหลดข้อมูลคำร้องเอกสารได้'
    pagination.value.total_rows = 0
    pagination.value.total_pages = 1
  } finally {
    if (current === generation) loading.value = false
  }
}

function changePerPage(event: Event) {
  const input = event.target as HTMLInputElement
  const value = Number(input.value)
  const perPage = Number.isFinite(value) ? Math.max(1, Math.floor(value || 15)) : 15
  perPageInput.value = perPage
  input.value = String(perPage)
  pagination.value.page = 1
  pagination.value.per_page = perPage
}

watch(
  [search],
  () => {
    pagination.value.page = 1
  },
  { flush: 'sync' },
)
watch([search, () => pagination.value.page, () => pagination.value.per_page], load, {
  immediate: true,
})
watch(searchInput, () => {
  clearTimeout(searchTimeout)
  generation++
  loading.value = true
  searchTimeout = setTimeout(() => {
    if (search.value === searchInput.value.trim()) void load()
    else search.value = searchInput.value.trim()
  }, 500)
})
onBeforeUnmount(() => {
  generation++
  clearTimeout(searchTimeout)
})

function handleEdit(request: DocumentRequest) {
  void router.push({ name: ROUTE_NAMES.REQUEST_EDIT, params: { id: request.id } })
}

function handleRowAction(action: string, request: DocumentRequest) {
  if (action === 'edit') handleEdit(request)
  if (action === 'delete') handleDelete(request)
}

function handleDelete(request: DocumentRequest) {
  requestToDelete.value = request
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!requestToDelete.value) return
  deleting.value = true
  try {
    await deleteDocumentRequest(requestToDelete.value.id)
    toast.success('ลบคำร้องเอกสารเรียบร้อยแล้ว')
    showDeleteDialog.value = false
    requestToDelete.value = null
    if (requests.value.length === 1 && pagination.value.page > 1) pagination.value.page--
    else await load()
  } catch (cause) {
    const message = (cause as { response?: { data?: { message?: unknown } } })?.response?.data
      ?.message
    toast.error(typeof message === 'string' ? message : 'ไม่สามารถลบคำร้องเอกสารได้')
  } finally {
    deleting.value = false
  }
}

function cancelDelete() {
  showDeleteDialog.value = false
  requestToDelete.value = null
}
</script>

<template>
  <MainLayout>
    <div class="flex h-full flex-col gap-3 py-3">
      <div class="shrink-0 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="relative max-w-md min-w-48 flex-1">
            <Search
              class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
            />
            <Input
              v-model="searchInput"
              aria-label="ค้นหาคำร้องเอกสาร"
              type="text"
              placeholder="ค้นหาชื่อหรือประเภทเอกสาร"
              class="pl-10"
              :disabled="deleting"
            />
          </div>
        </div>
      </div>

      <div class="flex min-h-0 flex-1 flex-col">
        <div class="bg-primary text-primary-foreground mb-3 shrink-0 rounded-lg px-4 py-2">
          <h1 class="text-base font-semibold">คำร้องเอกสาร</h1>
        </div>
        <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
          <div class="flex min-h-0 flex-1 flex-col overflow-x-auto">
            <div class="flex min-h-0 min-w-200 flex-1 flex-col">
              <table class="w-full table-fixed [&_td]:px-4 [&_th]:px-4">
                <colgroup>
                  <col
                    v-for="column in columns"
                    :key="column.label"
                    :style="{ width: column.width }"
                  />
                </colgroup>
                <thead class="bg-muted/50">
                  <tr>
                    <th
                      v-for="(column, index) in columns"
                      :key="column.label"
                      :class="['py-2 font-medium', index < 2 ? 'text-left' : 'text-center']"
                    >
                      {{ column.label }}
                    </th>
                  </tr>
                </thead>
              </table>
              <div class="min-h-0 flex-1 overflow-y-auto">
                <table class="w-full table-fixed [&_td]:px-4 [&_th]:px-4">
                  <colgroup>
                    <col
                      v-for="column in columns"
                      :key="column.label"
                      :style="{ width: column.width }"
                    />
                  </colgroup>
                  <tbody>
                    <tr v-if="loading">
                      <td colspan="5" class="py-8 text-center">
                        <div class="flex items-center justify-center gap-2">
                          <Loader2 class="h-5 w-5 animate-spin" />
                          <span class="text-muted-foreground">กำลังโหลดข้อมูล...</span>
                        </div>
                      </td>
                    </tr>
                    <tr v-else-if="error">
                      <td colspan="5" class="py-8 text-center">
                        <p role="alert" class="text-destructive">{{ error }}</p>
                        <Button variant="outline" class="mt-3" @click="load">ลองใหม่</Button>
                      </td>
                    </tr>
                    <tr v-else-if="!requests.length">
                      <td colspan="5" class="text-muted-foreground py-8 text-center">
                        ไม่พบข้อมูลคำร้องเอกสาร
                      </td>
                    </tr>
                    <tr
                      v-for="request in requests"
                      v-else
                      :key="request.id"
                      class="hover:bg-muted/50 focus-visible:ring-ring cursor-pointer border-t transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset"
                      tabindex="0"
                      :aria-label="`แก้ไขคำร้องของ ${documentRequestFullName(request)}`"
                      @click="handleEdit(request)"
                      @keydown.enter="handleEdit(request)"
                      @keydown.space.prevent="handleEdit(request)"
                    >
                      <td class="py-2 align-middle">{{ documentRequestFullName(request) }}</td>
                      <td class="py-2 align-middle">{{ request.document_type || '-' }}</td>
                      <td class="py-2 text-center align-middle">
                        <Badge
                          :variant="
                            request.status === 'ไม่อนุมัติ'
                              ? 'destructive'
                              : request.status === 'อนุมัติ'
                                ? 'default'
                                : 'secondary'
                          "
                        >
                          {{ request.status || 'กำลังดำเนินการ' }}
                        </Badge>
                      </td>
                      <td class="py-2 text-center align-middle">
                        {{ formatThaiBuddhistDate(request.created_at) || '-' }}
                      </td>
                      <td class="py-2 align-middle">
                        <TableActions
                          :actions="rowActions"
                          :menu-label="`การดำเนินการ ${documentRequestFullName(request)}`"
                          @select="handleRowAction($event, request)"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t px-4 py-2">
            <span class="text-muted-foreground mr-auto text-sm">
              แสดง {{ loading ? 0 : requests.length }} รายการจาก
              {{ pagination.total_rows }} รายการทั้งหมด
            </span>
            <label class="flex items-center gap-2 text-sm">
              <span class="text-muted-foreground whitespace-nowrap">จำนวนต่อหน้า</span>
              <Input
                :model-value="perPageInput"
                type="number"
                min="1"
                class="h-8 w-20"
                :disabled="loading || deleting"
                @change="changePerPage"
              />
            </label>
            <Button
              variant="ghost"
              size="sm"
              :disabled="loading || deleting || !canPreviousPage"
              @click="pagination.page--"
            >
              ก่อนหน้า
            </Button>
            <template v-for="(pageNum, index) in getVisiblePages" :key="index">
              <Button
                v-if="typeof pageNum === 'number'"
                :variant="pageNum === pagination.page ? 'default' : 'ghost'"
                size="sm"
                :aria-label="`หน้า ${pageNum}`"
                :disabled="loading || deleting"
                @click="pagination.page = pageNum"
              >
                {{ pageNum }}
              </Button>
              <span v-else class="px-2">...</span>
            </template>
            <Button
              variant="ghost"
              size="sm"
              :disabled="loading || deleting || !canNextPage"
              @click="pagination.page++"
            >
              ถัดไป
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
            คุณต้องการลบคำร้องเอกสาร
            <span class="font-semibold">{{ requestToDelete?.document_type || '-' }}</span>
            ของ {{ documentRequestFullName(requestToDelete) }} ใช่หรือไม่?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deleting" @click="cancelDelete">ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            class="bg-red-600 hover:bg-red-700"
            :disabled="deleting"
            @click="confirmDelete"
          >
            <Loader2 v-if="deleting" class="mr-2 h-4 w-4 animate-spin" />
            {{ deleting ? 'กำลังลบ...' : 'ลบ' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </MainLayout>
</template>
