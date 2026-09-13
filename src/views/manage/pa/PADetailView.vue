<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Loader2 } from 'lucide-vue-next'
import MainLayout from '@/layouts/manage/MainLayout.vue'
import DocumentPreviewDialog from '@/components/DocumentPreviewDialog.vue'
import DocumentFileRow from '@/components/DocumentFileRow.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROUTE_NAMES } from '@/lib/constants'
import { paFields, PA_FILE_GROUPS } from '@/lib/pa'
import { getPADetail } from '@/stores/pa'
import type { PADetail } from '@/types/pa'
import type { FileDocument } from '@/types/document'

const route = useRoute()
const router = useRouter()
const detail = ref<PADetail | null>(null)
const loading = ref(false)
const error = ref('')
const previewDialogOpen = ref(false)
const previewResource = ref<FileDocument | null>(null)
const fields = computed(() => (detail.value ? paFields(detail.value) : []))
let generation = 0

async function load() {
  const current = ++generation
  loading.value = true
  error.value = ''
  detail.value = null
  try {
    const result = await getPADetail(String(route.params.id))
    if (current === generation) detail.value = result
  } catch {
    if (current === generation)
      error.value =
        'ไม่สามารถโหลดรายละเอียดการประเมิน PA ได้ กรุณาลองใหม่ หรือตรวจสอบสิทธิ์เข้าถึงข้อมูล'
  } finally {
    if (current === generation) loading.value = false
  }
}

function goBack() {
  void router.push({ name: ROUTE_NAMES.MANAGE_PA })
}

function preview(resource: FileDocument) {
  previewResource.value = resource
  previewDialogOpen.value = true
}

watch(() => route.params.id, load, { immediate: true })
</script>

<template>
  <MainLayout>
    <div class="relative flex h-full flex-col gap-4 overflow-auto">
      <div class="shrink-0 pt-3">
        <button
          class="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
          @click="goBack"
        >
          <ChevronLeft class="h-4 w-4" />
          ย้อนกลับ
        </button>
      </div>

      <h1 class="mx-6 text-2xl font-bold">รายละเอียดการประเมิน PA</h1>

      <div
        v-if="detail"
        class="bg-primary text-primary-foreground mx-6 flex items-center justify-between gap-3 rounded-[10px] border p-3"
      >
        <div class="min-w-0">
          <h2 class="truncate text-xl font-bold">{{ detail.fullName }}</h2>
          <p class="mt-1 text-sm opacity-90">ปี {{ detail.year }} · {{ detail.subjectGroup }}</p>
        </div>
        <Badge
          :variant="detail.request.status === 'ไม่อนุมัติ' ? 'destructive' : 'secondary'"
          class="shrink-0"
        >
          {{ detail.request.status || 'กำลังดำเนินการ' }}
        </Badge>
      </div>

      <div v-if="loading" class="flex flex-1 items-center justify-center p-10">
        <Loader2 class="mr-2 size-5 animate-spin" />กำลังโหลดรายละเอียด...
      </div>
      <div v-else-if="error" role="alert" class="mx-6 space-y-3 rounded-lg border p-6">
        <p class="text-destructive">{{ error }}</p>
        <Button variant="outline" @click="load">ลองใหม่</Button>
      </div>
      <div v-else-if="detail" class="mx-6 space-y-4 pb-6">
        <p v-if="!detail.assessment" role="alert" class="rounded-lg border p-3 text-sm">
          ไม่พบรายละเอียด PA ที่ผูกกับคำร้องนี้
        </p>

        <section class="overflow-hidden rounded-lg border">
          <h2 class="bg-muted border-b px-4 py-3 font-semibold">ข้อมูลแบบส่งผลการประเมิน PA</h2>
          <dl class="grid md:grid-cols-2">
            <div
              v-for="field in fields"
              :key="field.label"
              class="border-b px-4 py-3 md:odd:border-r"
            >
              <dt class="text-muted-foreground text-sm">{{ field.label }}</dt>
              <dd class="mt-1 break-words whitespace-pre-wrap">{{ field.value }}</dd>
            </div>
          </dl>
        </section>

        <section class="overflow-hidden rounded-lg border">
          <h2 class="bg-muted border-b px-4 py-3 font-semibold">เอกสารประกอบการประเมิน</h2>
          <div class="divide-y">
            <div v-for="category in PA_FILE_GROUPS" :key="category.id" class="p-4">
              <h3 class="mb-3 text-sm font-semibold">{{ category.label }}</h3>
              <p
                v-if="!detail.files.some((file) => file.category === category.id)"
                class="text-muted-foreground text-sm"
              >
                ไม่มีไฟล์
              </p>
              <div v-else class="space-y-2">
                <DocumentFileRow
                  v-for="file in detail.files.filter((item) => item.category === category.id)"
                  :key="file.link.document_key"
                  :document-key="file.link.document_key"
                  :resource="file.resource"
                  @preview="preview"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
    <DocumentPreviewDialog v-model:open="previewDialogOpen" :resource="previewResource" />
  </MainLayout>
</template>
