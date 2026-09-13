<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Download, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import MainLayout from '@/layouts/web/MainLayout.vue'
import DocumentFileRow from '@/components/DocumentFileRow.vue'
import DocumentPreviewDialog from '@/components/DocumentPreviewDialog.vue'
import { Button } from '@/components/ui/button'
import { ROUTE_NAMES } from '@/lib/constants'
import { assertPADepartmentAccess, PAAccessError, paAllowedDepartmentIds } from '@/lib/paAccess'
import { PA_FILE_GROUPS, paRequestPerson } from '@/lib/pa'
import { getPAData, getPAFiles } from '@/stores/pa'
import { useAuthStore } from '@/stores/auth'
import { downloadDocumentFile } from '@/stores/api'
import type { PAFile, PARequest } from '@/types/pa'
import type { FileDocument } from '@/types/document'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const allowedDepartmentIds = computed(() => paAllowedDepartmentIds(authStore.user?.roles))
const request = ref<PARequest | null>(null)
const files = ref<PAFile[]>([])
const loading = ref(false)
const error = ref('')
const downloadingAll = ref(false)
const downloadedCount = ref(0)
const previewDialogOpen = ref(false)
const previewResource = ref<FileDocument | null>(null)
const category = computed(() => PA_FILE_GROUPS.find((item) => item.id === route.query.category))
const visible = computed(() =>
  category.value ? files.value.filter((file) => file.category === category.value?.id) : files.value,
)
const fullName = computed(() => {
  const person = request.value ? paRequestPerson(request.value) : undefined
  return [person?.first_name_th, person?.last_name_th].filter(Boolean).join(' ')
})
let generation = 0

async function load() {
  const current = ++generation
  loading.value = true
  error.value = ''
  files.value = []
  request.value = null
  if (!allowedDepartmentIds.value.length) {
    error.value = 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลการประเมิน PA'
    loading.value = false
    return
  }
  try {
    const result = await getPAData(String(route.params.id))
    assertPADepartmentAccess(result, allowedDepartmentIds.value)
    const attachments = await getPAFiles(result)
    if (current === generation) {
      request.value = result
      files.value = attachments
    }
  } catch (cause) {
    if (current === generation) {
      error.value =
        cause instanceof PAAccessError ? cause.message : 'ไม่สามารถโหลดไฟล์แนบได้ กรุณาลองใหม่'
    }
  } finally {
    if (current === generation) loading.value = false
  }
}

function saveBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}

async function downloadAll() {
  if (downloadingAll.value || !visible.value.length) return
  downloadingAll.value = true
  downloadedCount.value = 0
  try {
    for (const file of visible.value) {
      const { blob, filename } = await downloadDocumentFile(file.link.document_key)
      saveBlob(blob, filename)
      downloadedCount.value++
    }
  } catch {
    toast.error(
      `ดาวน์โหลดไฟล์ไม่ครบ ดาวน์โหลดสำเร็จ ${downloadedCount.value} จาก ${visible.value.length} ไฟล์`,
    )
  } finally {
    downloadingAll.value = false
  }
}

function preview(resource: FileDocument) {
  previewResource.value = resource
  previewDialogOpen.value = true
}

function goBack() {
  void router.push({
    name: ROUTE_NAMES.WEB_PA_DETAIL,
    params: { id: String(route.params.id) },
  })
}

watch(() => route.params.id, load, { immediate: true })
</script>

<template>
  <MainLayout>
    <div class="relative flex h-full flex-col gap-4 overflow-auto px-6">
      <div class="shrink-0 pt-3">
        <button
          class="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
          @click="goBack"
        >
          <ChevronLeft class="h-4 w-4" />
          ย้อนกลับ
        </button>
      </div>
      <h1 class="text-2xl font-bold">ดาวน์โหลดเอกสารการประเมิน PA</h1>
      <div class="bg-primary text-primary-foreground rounded-[10px] border p-3">
        <h2 class="text-xl font-bold">{{ fullName || 'ไม่ระบุชื่อ' }}</h2>
        <p class="mt-1 text-sm opacity-90">{{ category?.label || 'ไฟล์แนบทั้งหมด' }}</p>
      </div>
      <div v-if="loading" class="p-10 text-center">
        <Loader2 class="mr-2 inline size-4 animate-spin" />กำลังโหลดรายการไฟล์...
      </div>
      <div v-else-if="error" role="alert" class="space-y-3 rounded-lg border p-6">
        <p class="text-destructive">{{ error }}</p>
        <Button variant="outline" @click="load">ลองใหม่</Button>
      </div>
      <div v-else class="space-y-3 pb-6">
        <p v-if="category?.id === 'other'" class="rounded-lg border p-3 text-sm">
          ไฟล์เดิมไม่ได้ระบุประเภทชัดเจน กรุณาตรวจสอบเนื้อหาไฟล์ก่อนนำไปใช้
        </p>
        <p v-if="!visible.length" class="text-muted-foreground rounded-lg border p-8 text-center">
          ไม่พบไฟล์แนบในประเภทนี้
        </p>
        <DocumentFileRow
          v-for="file in visible"
          :key="file.link.document_key"
          :document-key="file.link.document_key"
          :resource="file.resource"
          @preview="preview"
        />
        <div v-if="visible.length" class="flex flex-wrap items-center gap-2 pt-1">
          <Button v-if="category" as-child variant="outline">
            <RouterLink
              :to="{ name: ROUTE_NAMES.WEB_PA_FILES, params: { id: String(route.params.id) } }"
            >
              ดูไฟล์แนบทั้งหมดของคำร้องนี้
            </RouterLink>
          </Button>
          <Button v-else :disabled="downloadingAll" @click="downloadAll">
            <Loader2 v-if="downloadingAll" class="size-4 animate-spin" />
            <Download v-else class="size-4" />
            {{
              downloadingAll
                ? `กำลังดาวน์โหลด ${downloadedCount}/${visible.length}`
                : 'ดาวน์โหลดทั้งหมด'
            }}
          </Button>
        </div>
      </div>
    </div>
    <DocumentPreviewDialog v-model:open="previewDialogOpen" :resource="previewResource" />
  </MainLayout>
</template>
