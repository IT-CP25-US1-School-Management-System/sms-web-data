<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, FileX2, Loader2 } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import TableActions from '@/components/TableActions.vue'
import { usePagination, type PaginationData } from '@/composables/usePagination'
import { DATASET_GET, ROUTE_NAMES } from '@/lib/constants'
import { formatThaiBuddhistDateTime, getDateTimestamp } from '@/lib/helpers'
import { getDatasetRows } from '@/stores/dataset'
import type { DocumentRequest } from '@/types/document_request'

type TrackDocumentsEnvelope = { document_requests?: DocumentRequest[] }

const router = useRouter()
const loading = ref(false)
const error = ref('')
const requests = ref<DocumentRequest[]>([])
const perPageInput = ref(15)
const pagination = ref<PaginationData>({ page: 1, per_page: 15, total_pages: 1, total_rows: 0 })
const { getVisiblePages, getPaginationInfo, canPreviousPage, canNextPage } =
  usePagination(pagination)

const columns = [
  { label: 'ประเภทคำร้อง', width: '38%' },
  { label: 'สถานะ', width: '22%' },
  { label: 'วันที่ส่งคำร้อง', width: '28%' },
  { label: 'การดำเนินการ', width: '12%' },
]

const rowActions = [{ key: 'detail', label: 'ดูรายละเอียด', icon: Eye }]

const paginatedRequests = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.per_page
  return requests.value.slice(start, start + pagination.value.per_page)
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const response = await getDatasetRows<DocumentRequest | TrackDocumentsEnvelope>(
      DATASET_GET.DATASET_ID,
      DATASET_GET.DATASET_VERSION,
      { view: 'track_documents', page: 1, per_page: 100 },
    )
    const first = response.data[0]
    const rows =
      first && 'document_requests' in first && Array.isArray(first.document_requests)
        ? first.document_requests
        : (response.data as DocumentRequest[])
    requests.value = [...rows].sort(
      (a, b) => getDateTimestamp(b.created_at) - getDateTimestamp(a.created_at),
    )
    pagination.value.total_rows = requests.value.length
    pagination.value.total_pages = Math.max(
      1,
      Math.ceil(requests.value.length / pagination.value.per_page),
    )
    if (pagination.value.page > pagination.value.total_pages)
      pagination.value.page = pagination.value.total_pages
  } catch (cause) {
    const message = (cause as { response?: { data?: { message?: unknown } } })?.response?.data
      ?.message
    error.value = typeof message === 'string' ? message : 'ไม่สามารถโหลดข้อมูลคำร้องได้'
    requests.value = []
    pagination.value.total_rows = 0
    pagination.value.total_pages = 1
  } finally {
    loading.value = false
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
  pagination.value.total_pages = Math.max(1, Math.ceil(requests.value.length / perPage))
}

function openDetail(request: DocumentRequest) {
  void router.push({ name: ROUTE_NAMES.TRACK_DOCUMENT_DETAIL, params: { id: request.id } })
}

function handleRowAction(action: string, request: DocumentRequest) {
  if (action === 'detail') openDetail(request)
}

onMounted(load)
</script>

<template>
  <div class="mx-4 flex min-h-[520px] flex-col pb-6 sm:mx-6">
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
      <div class="flex min-h-0 flex-1 flex-col overflow-x-auto">
        <div class="flex min-h-0 min-w-180 flex-1 flex-col">
          <table class="w-full table-fixed text-sm [&_td]:px-4 [&_th]:px-4">
            <colgroup>
              <col v-for="column in columns" :key="column.label" :style="{ width: column.width }" />
            </colgroup>
            <thead class="bg-muted/50">
              <tr>
                <th
                  v-for="column in columns"
                  :key="column.label"
                  class="py-3 text-center font-medium"
                >
                  {{ column.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="4" class="py-10 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <Loader2 class="h-5 w-5 animate-spin" />
                    <span class="text-muted-foreground">กำลังโหลดข้อมูล...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="error">
                <td colspan="4" class="py-10 text-center">
                  <p role="alert" class="text-destructive">{{ error }}</p>
                  <Button variant="outline" class="mt-3" @click="load">ลองใหม่</Button>
                </td>
              </tr>
              <tr v-else-if="!paginatedRequests.length">
                <td colspan="4" class="py-12 text-center">
                  <FileX2 class="text-muted-foreground mx-auto mb-3 h-10 w-10 opacity-50" />
                  <p class="text-muted-foreground">ไม่พบข้อมูลคำร้อง</p>
                </td>
              </tr>
              <tr
                v-for="request in paginatedRequests"
                v-else
                :key="request.id"
                class="hover:bg-muted/50 focus-visible:ring-ring cursor-pointer border-t transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset"
                tabindex="0"
                :aria-label="`ดูรายละเอียด ${request.document_type || 'คำร้อง'}`"
                @click="openDetail(request)"
                @keydown.enter="openDetail(request)"
                @keydown.space.prevent="openDetail(request)"
              >
                <td class="py-3 text-center align-middle">{{ request.document_type || '-' }}</td>
                <td class="py-3 text-center align-middle">
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
                <td class="py-3 text-center align-middle">
                  {{ formatThaiBuddhistDateTime(request.created_at) || '-' }}
                </td>
                <td class="py-3 text-center align-middle">
                  <TableActions
                    :actions="rowActions"
                    :menu-label="`การดำเนินการ ${request.document_type || 'คำร้อง'}`"
                    @select="handleRowAction($event, request)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t px-4 py-2">
        <span class="text-muted-foreground mr-auto text-sm">{{ getPaginationInfo.text }}</span>
        <label class="flex items-center gap-2 text-sm">
          <span class="text-muted-foreground whitespace-nowrap">จำนวนต่อหน้า</span>
          <Input
            :model-value="perPageInput"
            type="number"
            min="1"
            class="h-8 w-20"
            :disabled="loading"
            @change="changePerPage"
          />
        </label>
        <Button
          variant="ghost"
          size="sm"
          :disabled="loading || !canPreviousPage"
          @click="pagination.page--"
        >
          ก่อนหน้า
        </Button>
        <template v-for="(pageNumber, index) in getVisiblePages" :key="index">
          <Button
            v-if="typeof pageNumber === 'number'"
            :variant="pageNumber === pagination.page ? 'default' : 'ghost'"
            size="sm"
            :disabled="loading"
            @click="pagination.page = pageNumber"
          >
            {{ pageNumber }}
          </Button>
          <span v-else class="px-2">...</span>
        </template>
        <Button
          variant="ghost"
          size="sm"
          :disabled="loading || !canNextPage"
          @click="pagination.page++"
        >
          ถัดไป
        </Button>
      </div>
    </div>
  </div>
</template>
