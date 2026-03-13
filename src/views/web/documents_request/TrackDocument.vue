<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePagination } from '@/composables/usePagination'
import { ChevronLeft, ChevronRight, FileX2 } from 'lucide-vue-next'
import { computed, reactive } from 'vue'

/* ──────────────────── Types ──────────────────── */
type DocumentStatus = 'กำลังดำเนินการ' | 'เสร็จสิ้น' | 'ไม่ผ่าน'

interface DocumentRequest {
  title: string
  type: string
  status: DocumentStatus
  datetime: string
}

/* ──────────────────── Mock data ──────────────────── */
const mockData: DocumentRequest[] = [
  {
    title: 'ยื่นคำร้องขอใบรับรองเงินเดือน',
    type: 'ใบรับรองเงินเดือน',
    status: 'กำลังดำเนินการ',
    datetime: '8/2/2026 19:28',
  },
  {
    title: 'ยื่นคำร้องขอใบรับรองการปฏิบัติงาน',
    type: 'ใบรับรองการปฏิบัติงาน',
    status: 'กำลังดำเนินการ',
    datetime: '10/2/2026 19:00',
  },
  {
    title: 'ยื่นคำร้องขอเอกสารหนังสือผ่านสิทธิ์',
    type: 'เอกสารหนังสือผ่านสิทธิ์',
    status: 'ไม่ผ่าน',
    datetime: '18/2/2026 19:45',
  },
  {
    title: 'ยื่นคำร้องขอใบรับรองการปฏิบัติงาน',
    type: 'ใบรับรองการปฏิบัติงาน',
    status: 'เสร็จสิ้น',
    datetime: '3/1/2026 9:00',
  },
]

/* ──────────────────── Status badge config ──────────────────── */
const statusConfig: Record<DocumentStatus, { bg: string; text: string }> = {
  กำลังดำเนินการ: { bg: 'bg-amber-400 hover:bg-amber-400', text: 'text-white' },
  เสร็จสิ้น: { bg: 'bg-green-500 hover:bg-green-500', text: 'text-white' },
  ไม่ผ่าน: { bg: 'bg-red-500 hover:bg-red-500', text: 'text-white' },
}

/* ──────────────────── Pagination ──────────────────── */
const paginationData = reactive({
  page: 1,
  per_page: 10,
  total_pages: Math.ceil(mockData.length / 10) || 1,
  total_rows: mockData.length,
})

const { getVisiblePages, canPreviousPage, canNextPage } = usePagination(paginationData)

const paginatedData = computed(() => {
  const start = (paginationData.page - 1) * paginationData.per_page
  return mockData.slice(start, start + paginationData.per_page)
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
                <th class="px-6 py-4 text-center font-semibold text-muted-foreground">หัวข้อ</th>
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
                <td class="px-6 py-4 text-center">{{ item.title }}</td>
                <td class="px-6 py-4 text-center">{{ item.type }}</td>
                <td class="px-6 py-4 text-center">
                  <Badge
                    class="border-0 px-3 py-1 text-xs font-semibold"
                    :class="[statusConfig[item.status].bg, statusConfig[item.status].text]"
                  >
                    {{ item.status }}
                  </Badge>
                </td>
                <td class="px-6 py-4 text-center">{{ item.datetime }}</td>
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
