<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Loader2 } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DocumentFileRow from '@/components/DocumentFileRow.vue'
import DocumentPreviewDialog from '@/components/DocumentPreviewDialog.vue'
import { ROUTE_NAMES } from '@/lib/constants'
import { documentRequestFullName } from '@/lib/documentRequest'
import { classifyPAFile, PA_FILE_GROUPS } from '@/lib/pa'
import {
  isRequestType,
  requestAttachmentTitle,
  requestDetailMessage,
  requestDetailSection,
  requestOverviewFields,
  sortedApprovalLogs,
} from '@/lib/requestDetail'
import { useAuthStore } from '@/stores/auth'
import { getFileDocumentRows } from '@/stores/document'
import { getTrackedDocumentRequestById } from '@/stores/document_request'
import type { FileDocument } from '@/types/document'
import type { DocumentLink, DocumentRequest } from '@/types/document_request'

type DocumentLinkWithResource = DocumentLink & { resource: FileDocument | null }

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const request = ref<DocumentRequest | null>(null)
const loading = ref(false)
const error = ref('')
const loadingFiles = ref(false)
const resources = ref<Record<string, FileDocument | null>>({})
const previewDialogOpen = ref(false)
const previewResource = ref<FileDocument | null>(null)
let generation = 0

const rejectionReason = computed(() => {
  if (request.value?.status !== 'ไม่อนุมัติ') return ''
  return (
    sortedApprovalLogs(request.value)
      .find((log) => log.action === 'ไม่อนุมัติ' && log.comment?.trim())
      ?.comment?.trim() || '-'
  )
})
const overviewFields = computed(() => {
  if (!request.value) return []
  const fields = requestOverviewFields(request.value)
  if (request.value.status === 'ไม่อนุมัติ') {
    fields.push({ label: 'เหตุผลที่ไม่อนุมัติ', value: rejectionReason.value })
  }
  return fields
})
const detailSection = computed(() => (request.value ? requestDetailSection(request.value) : null))
const detailMessage = computed(() =>
  request.value && !detailSection.value ? requestDetailMessage(request.value) : '',
)
const attachmentTitle = computed(() =>
  request.value ? requestAttachmentTitle(request.value) : 'ไฟล์แนบคำร้อง',
)
const groupedFiles = computed(() => {
  const groups = new Map<string, DocumentLinkWithResource[]>()
  for (const link of request.value?.document_links || []) {
    const resolved = { ...link, resource: resources.value[link.document_key] ?? null }
    const purpose = link.purpose?.trim() || 'ไฟล์แนบ'
    const groupId = isRequestType(request.value, 'การประเมินPA')
      ? classifyPAFile(resolved.resource?.original_filename || '', purpose)
      : purpose
    const current = groups.get(groupId)
    if (current) current.push(resolved)
    else groups.set(groupId, [resolved])
  }
  return Array.from(groups.entries()).map(([groupId, links]) => ({
    groupId,
    label: isRequestType(request.value, 'การประเมินPA')
      ? PA_FILE_GROUPS.find((group) => group.id === groupId)?.label || 'ไฟล์อื่น ๆ'
      : groupId,
    links,
  }))
})

async function loadResources(links: DocumentLink[], current: number) {
  const keys = [...new Set(links.map((link) => link.document_key).filter(Boolean))]
  if (!keys.length) {
    resources.value = {}
    return
  }
  loadingFiles.value = true
  try {
    const results = await Promise.allSettled(
      keys.map(async (key) => ({
        key,
        resource: (await getFileDocumentRows<FileDocument>(key)).data ?? null,
      })),
    )
    if (current !== generation) return
    resources.value = Object.fromEntries(
      results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => [result.value.key, result.value.resource]),
    )
  } finally {
    if (current === generation) loadingFiles.value = false
  }
}

async function load() {
  const id = String(route.params.id || '')
  if (!id) return
  const current = ++generation
  loading.value = true
  error.value = ''
  request.value = null
  resources.value = {}
  try {
    const response = await getTrackedDocumentRequestById(id)
    if (!response.data || response.data.id !== id) throw new Error('ไม่พบรายละเอียดคำร้อง')
    const userId = authStore.user?.id
    if (userId && response.data.person_id && response.data.person_id !== userId)
      throw new Error('ไม่มีสิทธิ์ดูคำร้องนี้')
    if (current !== generation) return
    request.value = response.data
    await loadResources(response.data.document_links || [], current)
  } catch (cause) {
    if (current === generation)
      error.value = cause instanceof Error ? cause.message : 'ไม่สามารถโหลดรายละเอียดคำร้องได้'
  } finally {
    if (current === generation) loading.value = false
  }
}

function goBack() {
  void router.push({ name: ROUTE_NAMES.TRACK_DOCUMENTS })
}

function preview(resource: FileDocument) {
  previewResource.value = resource
  previewDialogOpen.value = true
}

watch(() => route.params.id, load, { immediate: true })
</script>

<template>
  <div class="mx-4 space-y-4 pb-6 sm:mx-6">
    <button
      class="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
      @click="goBack"
    >
      <ChevronLeft class="h-4 w-4" />ย้อนกลับ
    </button>

    <div v-if="loading" class="flex min-h-80 items-center justify-center">
      <Loader2 class="mr-2 h-5 w-5 animate-spin" />กำลังโหลดข้อมูล...
    </div>
    <div v-else-if="error" role="alert" class="space-y-3 rounded-lg border p-6">
      <p class="text-destructive">{{ error }}</p>
      <Button variant="outline" @click="load">ลองใหม่</Button>
    </div>
    <template v-else-if="request">
      <div
        class="bg-primary text-primary-foreground flex items-center justify-between gap-3 rounded-[10px] border p-3"
      >
        <div class="min-w-0">
          <h2 class="truncate text-xl font-bold">{{ documentRequestFullName(request) }}</h2>
          <p class="mt-1 text-sm opacity-90">
            {{ request.document_type || 'ไม่ระบุประเภทเอกสาร' }}
          </p>
        </div>
        <Badge
          :variant="
            request.status === 'ไม่อนุมัติ'
              ? 'destructive'
              : request.status === 'อนุมัติ'
                ? 'default'
                : 'secondary'
          "
          class="shrink-0"
        >
          {{ request.status || 'กำลังดำเนินการ' }}
        </Badge>
      </div>

      <section class="overflow-hidden rounded-lg border">
        <h2 class="bg-muted border-b px-4 py-3 font-semibold">ข้อมูลคำร้องเอกสาร</h2>
        <dl class="grid md:grid-cols-2">
          <div
            v-for="field in overviewFields"
            :key="field.label"
            class="border-b px-4 py-3 md:odd:border-r"
          >
            <dt class="text-muted-foreground text-sm">{{ field.label }}</dt>
            <dd class="mt-1 break-words whitespace-pre-wrap">{{ field.value }}</dd>
          </div>
        </dl>
      </section>

      <section v-if="detailSection" class="overflow-hidden rounded-lg border">
        <h2 class="bg-muted border-b px-4 py-3 font-semibold">{{ detailSection.title }}</h2>
        <dl class="grid md:grid-cols-2">
          <div
            v-for="field in detailSection.fields"
            :key="field.label"
            class="border-b px-4 py-3 md:odd:border-r"
          >
            <dt class="text-muted-foreground text-sm">{{ field.label }}</dt>
            <dd class="mt-1 break-words whitespace-pre-wrap">{{ field.value }}</dd>
          </div>
        </dl>
      </section>
      <p
        v-else-if="detailMessage"
        class="text-muted-foreground rounded-lg border px-4 py-3 text-sm"
      >
        {{ detailMessage }}
      </p>

      <section class="overflow-hidden rounded-lg border">
        <h2 class="bg-muted border-b px-4 py-3 font-semibold">{{ attachmentTitle }}</h2>
        <div v-if="loadingFiles" class="text-muted-foreground p-4 text-sm">กำลังโหลดเอกสาร...</div>
        <div v-else-if="!groupedFiles.length" class="text-muted-foreground p-6 text-center">
          ไม่มีไฟล์แนบ
        </div>
        <div v-else class="divide-y">
          <div v-for="group in groupedFiles" :key="group.groupId" class="p-4">
            <h3 class="mb-3 text-sm font-semibold">{{ group.label }}</h3>
            <div class="space-y-2">
              <DocumentFileRow
                v-for="link in group.links"
                :key="link.document_key"
                :document-key="link.document_key"
                :resource="link.resource"
                @preview="preview"
              />
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>

  <DocumentPreviewDialog v-model:open="previewDialogOpen" :resource="previewResource" />
</template>
