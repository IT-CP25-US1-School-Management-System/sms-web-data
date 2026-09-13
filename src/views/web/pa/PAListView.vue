<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Download, Eye, Loader2, MoreHorizontal, Search } from 'lucide-vue-next'
import MainLayout from '@/layouts/web/MainLayout.vue'
import PAExportDialog from '@/views/manage/pa/PAExportDialog.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePagination, type PaginationData } from '@/composables/usePagination'
import { ROUTE_NAMES } from '@/lib/constants'
import { formatThaiBuddhistDate } from '@/lib/helpers'
import { paAllowedSubjectGroups } from '@/lib/paAccess'
import { paLoadError, paYearOptions } from '@/lib/pa'
import { getWebPAList } from '@/stores/pa'
import { useAuthStore } from '@/stores/auth'
import type { PAListFilters, PAListItem } from '@/types/pa'

const router = useRouter()
const authStore = useAuthStore()
const allowedGroups = computed(() => paAllowedSubjectGroups(authStore.user?.roles))
const allowedDepartmentIds = computed(() => allowedGroups.value.map((group) => group.id))
const items = ref<PAListItem[]>([])
const loading = ref(false)
const exportDialogOpen = ref(false)
const error = ref('')
const years = paYearOptions()
const year = ref('all')
const department = ref('all')
const status = ref('all')
const searchInput = ref('')
const search = ref('')
const perPageInput = ref(15)
const pagination = ref<PaginationData>({ page: 1, per_page: 15, total_rows: 0, total_pages: 1 })
const { canPreviousPage, canNextPage, getVisiblePages } = usePagination(pagination)
const scopedDepartmentIds = computed(() => {
  const selected = Number(department.value)
  return department.value !== 'all' && allowedDepartmentIds.value.includes(selected)
    ? [selected]
    : allowedDepartmentIds.value
})
const filters = computed<PAListFilters>(() => ({
  year: year.value === 'all' ? undefined : Number(year.value),
  departmentIds: scopedDepartmentIds.value,
  status:
    status.value === 'all'
      ? undefined
      : (status.value as Exclude<PAListFilters['status'], undefined>),
  search: search.value,
}))
const columns = [
  { label: 'ชื่อ - สกุล', width: '25%' },
  { label: 'กลุ่มสาระการเรียนรู้', width: '29%' },
  { label: 'สถานะ', width: '15%' },
  { label: 'วันที่ส่งคำร้อง', width: '18%' },
  { label: 'การดำเนินการ', width: '13%' },
]

let generation = 0
let searchTimeout: ReturnType<typeof setTimeout> | undefined
async function load() {
  const current = ++generation
  loading.value = true
  error.value = ''
  items.value = []
  if (!allowedDepartmentIds.value.length) {
    error.value = 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลการประเมิน PA'
    loading.value = false
    return
  }
  try {
    const result = await getWebPAList({
      ...filters.value,
      page: pagination.value.page,
      per_page: pagination.value.per_page,
    })
    if (current !== generation) return
    items.value = result.data
    pagination.value.total_rows = result.total_rows
    pagination.value.total_pages = result.total_pages
  } catch (cause) {
    if (current !== generation) return
    error.value = paLoadError(cause)
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
  [year, department, status, search],
  () => {
    pagination.value.page = 1
  },
  { flush: 'sync' },
)
watch(
  [year, department, status, search, () => pagination.value.page, () => pagination.value.per_page],
  load,
  { immediate: true },
)
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

function openDetail(item: PAListItem) {
  void router.push({
    name: ROUTE_NAMES.WEB_PA_DETAIL,
    params: { id: item.request.id },
  })
}
</script>

<template>
  <MainLayout>
    <div class="flex h-full flex-col gap-3 px-6 py-3">
      <div class="shrink-0 overflow-x-auto pb-1">
        <div class="flex min-w-240 items-center gap-3">
          <div class="relative max-w-md min-w-72 flex-1">
            <Search
              class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
            />
            <Input
              v-model="searchInput"
              aria-label="ค้นหาชื่อคุณครู"
              type="text"
              placeholder="ค้นหาชื่อคุณครู"
              class="pl-10"
              :disabled="loading"
            />
          </div>
          <Select v-model="year" :disabled="loading">
            <SelectTrigger class="w-44 shrink-0" aria-label="ปีที่ส่งคำร้อง">
              <SelectValue placeholder="ทุกปี" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกปี</SelectItem>
              <SelectItem v-for="option in years" :key="option" :value="String(option)">
                {{ option }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select v-model="department" :disabled="loading">
            <SelectTrigger class="w-80 shrink-0" aria-label="กลุ่มสาระการเรียนรู้">
              <SelectValue placeholder="ทุกกลุ่มสาระการเรียนรู้" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกกลุ่มสาระการเรียนรู้</SelectItem>
              <SelectItem v-for="group in allowedGroups" :key="group.id" :value="String(group.id)">
                {{ group.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select v-model="status" :disabled="loading">
            <SelectTrigger class="w-48 shrink-0" aria-label="สถานะคำร้อง">
              <SelectValue placeholder="ทุกสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสถานะ</SelectItem>
              <SelectItem value="กำลังดำเนินการ">กำลังดำเนินการ</SelectItem>
              <SelectItem value="อนุมัติ">อนุมัติ</SelectItem>
              <SelectItem value="ไม่อนุมัติ">ไม่อนุมัติ</SelectItem>
            </SelectContent>
          </Select>
          <Button class="ml-auto shrink-0" variant="outline" @click="exportDialogOpen = true">
            <Download class="mr-2 h-4 w-4" />ดาวน์โหลด Excel
          </Button>
        </div>
      </div>
      <div class="flex min-h-0 flex-1 flex-col">
        <div class="bg-primary text-primary-foreground mb-3 shrink-0 rounded-lg px-4 py-2">
          <h1 class="text-base font-semibold">การประเมิน PA</h1>
        </div>
        <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
          <div class="flex min-h-0 flex-1 flex-col overflow-x-auto">
            <div class="flex min-h-0 min-w-240 flex-1 flex-col">
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
                    <tr v-else-if="!items.length">
                      <td colspan="5" class="text-muted-foreground py-8 text-center">
                        ไม่พบรายการประเมิน PA ตามตัวกรองที่เลือก
                      </td>
                    </tr>
                    <tr
                      v-for="item in items"
                      v-else
                      :key="item.request.id"
                      class="hover:bg-muted/50 focus-visible:ring-ring cursor-pointer border-t transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset"
                      tabindex="0"
                      :aria-label="`ดูรายละเอียดการประเมิน PA ของ ${item.fullName}`"
                      @click="openDetail(item)"
                      @keydown.enter="openDetail(item)"
                      @keydown.space.prevent="openDetail(item)"
                    >
                      <td class="py-2 align-middle">{{ item.fullName }}</td>
                      <td class="py-2 align-middle">{{ item.subjectGroup }}</td>
                      <td class="py-2 text-center align-middle">
                        <Badge
                          :variant="
                            item.request.status === 'ไม่อนุมัติ'
                              ? 'destructive'
                              : item.request.status === 'อนุมัติ'
                                ? 'default'
                                : 'secondary'
                          "
                        >
                          {{ item.request.status || 'กำลังดำเนินการ' }}
                        </Badge>
                      </td>
                      <td class="py-2 text-center align-middle">
                        {{ formatThaiBuddhistDate(item.request.created_at) || '-' }}
                      </td>
                      <td class="py-2 align-middle">
                        <div class="flex justify-center" @click.stop @keydown.stop>
                          <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                              <Button
                                variant="ghost"
                                size="sm"
                                :aria-label="`การดำเนินการ ${item.fullName}`"
                              >
                                <MoreHorizontal class="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" class="flex flex-row gap-1 p-1">
                              <DropdownMenuItem as-child class="cursor-pointer">
                                <RouterLink
                                  :to="{
                                    name: ROUTE_NAMES.WEB_PA_DETAIL,
                                    params: { id: item.request.id },
                                  }"
                                >
                                  <Eye class="mr-2 h-4 w-4" />ดูรายละเอียด
                                </RouterLink>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t px-4 py-2">
            <span class="text-muted-foreground mr-auto text-sm">
              แสดง {{ loading ? 0 : items.length }} รายการจาก
              {{ pagination.total_rows }} รายการทั้งหมด
            </span>
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
            <template v-for="(pageNum, index) in getVisiblePages" :key="index">
              <Button
                v-if="typeof pageNum === 'number'"
                :variant="pageNum === pagination.page ? 'default' : 'ghost'"
                size="sm"
                :aria-label="`หน้า ${pageNum}`"
                :disabled="loading"
                @click="pagination.page = pageNum"
              >
                {{ pageNum }}
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
      <PAExportDialog
        :open="exportDialogOpen"
        :initial-filters="filters"
        :allowed-departments="allowedGroups"
        :file-route-name="ROUTE_NAMES.WEB_PA_FILES"
        data-source="web"
        @close="exportDialogOpen = false"
      />
    </div>
  </MainLayout>
</template>
