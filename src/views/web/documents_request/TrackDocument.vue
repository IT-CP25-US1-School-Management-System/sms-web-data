<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePagination } from '@/composables/usePagination'
import { DATASET_GET } from '@/lib/constants'
import { ChevronLeft, ChevronRight, FileX2 } from 'lucide-vue-next'
import { computed, reactive } from 'vue'

import { onMounted, ref, watch } from 'vue'
import { getDatasetRows } from '@/stores/dataset'
import { formatDateThaiInput ,formatTime } from '@/lib/helpers'

const loading = ref(false)
const statusData = ref<Record<string, any>[]>([])
async function trackStatusData() {
  loading.value = true
  try {
    const response = await getDatasetRows(DATASET_GET.DATASET_ID, DATASET_GET.DATASET_VERSION, {
      view: 'track_documents',
      page: 1,
      per_page: 50,
    })
    // response.data may be an array of items, or an array where the first element
    // contains a `document_requests` property. Support both shapes and fallback
    // to an empty array to avoid runtime errors.
    statusData.value = response?.data?.[0]?.document_requests ?? response?.data ?? []
  } catch (error: any) {
    throw error
  } 
  loading.value = false
}

onMounted(() => {
  console.log("statusData");
  trackStatusData()
})

/* ──────────────────── Types ──────────────────── */
type DocumentStatus = 'กำลังดำเนินการ' | 'อนุมัติ' | 'ไม่อนุมัติ'

/* ──────────────────── (example/mock data removed) ──────────────────── */

/* ──────────────────── Status badge config ──────────────────── */
const statusConfig: Record<DocumentStatus, { bg: string; text: string }> = {
  กำลังดำเนินการ: { bg: 'bg-amber-400 hover:bg-amber-400', text: 'text-white' },
  อนุมัติ: { bg: 'bg-green-500 hover:bg-green-500', text: 'text-white' },
  ไม่อนุมัติ: { bg: 'bg-red-500 hover:bg-red-500', text: 'text-white' },
}

function getStatusClass(status: unknown) {
  const cfg = statusConfig[status as DocumentStatus]
  return [cfg?.bg ?? 'bg-gray-200', cfg?.text ?? 'text-black']
}

/* ──────────────────── Pagination ──────────────────── */
const paginationData = reactive({
  page: 1,
  per_page: 10,
  total_pages: 1,
  total_rows: 0,
})

// keep pagination totals in sync when statusData changes
watch(
  statusData,
  (val) => {
    const total = Array.isArray(val) ? val.length : 0
    paginationData.total_rows = total
    paginationData.total_pages = Math.max(1, Math.ceil(total / paginationData.per_page))
    // reset to first page when data changes
    paginationData.page = 1
  },
  { immediate: true },
)

const { getVisiblePages, canPreviousPage, canNextPage } = usePagination(paginationData)

const paginatedData = computed(() => {
  const start = (paginationData.page - 1) * paginationData.per_page
  return statusData.value.slice(start, start + paginationData.per_page)
})

function goToPage(page: number | string) {
  if (typeof page === 'number') {
    paginationData.page = page
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 mx-6 pb-6">
    <Card class="w-full gap-0 pb-0 overflow-hidden">
      <CardContent class="p-0">
        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b bg-muted/40">
                <th class="px-6 py-4 text-center font-semibold text-muted-foreground">
                  ประเภทคำร้อง
                </th>
                <th class="px-6 py-4 text-center font-semibold text-muted-foreground">สถานะ</th>
                <th class="px-6 py-4 text-center font-semibold text-muted-foreground">เวลา</th>
              </tr>
            </thead>
            <tbody v-if="paginatedData.length">
              <tr
                v-for="(item, idx) in paginatedData"
                :key="idx"
                class="border-b last:border-b-0 hover:bg-muted/20 transition-colors"
              >
                <td class="px-6 py-4 text-center">{{ item.document_type }}</td>
                <td class="px-6 py-4 text-center">
                  <Badge
                    class="border-0 px-3 py-1 text-xs font-semibold"
                    :class="getStatusClass(item.status)"
                  >
                    {{ item.status }}
                  </Badge>
                </td>
                <td class="px-6 py-4 text-center"> {{ formatDateThaiInput(item.created_at) }} : {{ formatTime(item.created_at) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Empty state -->
          <div
            v-if="!paginatedData.length"
            class="flex flex-col items-center justify-center py-16 text-muted-foreground"
          >
            <FileX2 class="w-12 h-12 mb-3 opacity-40" />
            <p class="text-base font-medium">ไม่พบข้อมูลคำร้อง</p>
            <p class="text-sm mt-1">ยังไม่มีรายการคำร้องในขณะนี้</p>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="paginationData.total_rows > 0"
          class="flex items-center justify-end gap-2 px-6 py-4 border-t"
        >
          <Button
            variant="ghost"
            size="sm"
            :disabled="!canPreviousPage"
            class="gap-1"
            @click="goToPage(paginationData.page - 1)"
          >
            <ChevronLeft class="w-4 h-4" />
            Previous
          </Button>

          <template v-for="(page, pIdx) in getVisiblePages" :key="pIdx">
            <span v-if="page === '...'" class="px-1 text-muted-foreground">...</span>
            <Button
              v-else
              size="sm"
              :variant="page === paginationData.page ? 'default' : 'outline'"
              class="min-w-8 h-8"
              @click="goToPage(page)"
            >
              {{ page }}
            </Button>
          </template>

          <Button
            variant="ghost"
            size="sm"
            :disabled="!canNextPage"
            class="gap-1"
            @click="goToPage(paginationData.page + 1)"
          >
            Next
            <ChevronRight class="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
