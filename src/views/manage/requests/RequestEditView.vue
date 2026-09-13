<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import MainLayout from '@/layouts/manage/MainLayout.vue'
import DocumentPreviewDialog from '@/components/DocumentPreviewDialog.vue'
import DocumentFileRow from '@/components/DocumentFileRow.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROUTE_NAMES } from '@/lib/constants'
import { documentRequestFullName } from '@/lib/documentRequest'
import { formatThaiBuddhistDate, formatThaiBuddhistDateTime } from '@/lib/helpers'
import { useAuthStore } from '@/stores/auth'
import { getFileDocumentRows } from '@/stores/document'
import {
  createApprovalLog,
  getDocumentRequestById,
  updateDocumentRequest,
} from '@/stores/document_request'
import type { FileDocument } from '@/types/document'
import type { ApprovalLog, DocumentLink, DocumentRequest } from '@/types/document_request'

type DetailField = { label: string; value: string | number }
type DetailSection = { title: string; fields: DetailField[] }
type DocumentLinkWithResource = DocumentLink & { resource: FileDocument | null }

const route = useRoute()
const router = useRouter()
const request = ref<DocumentRequest | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const status = ref<DocumentRequest['status'] | ''>('')
const initialStatus = ref<DocumentRequest['status'] | ''>('')
const loadingDocumentResources = ref(false)
const documentResources = ref<Record<string, FileDocument | null>>({})
const previewDialogOpen = ref(false)
const previewResource = ref<FileDocument | null>(null)

const requestGeneralDetail = computed(
  () =>
    request.value?.request_general_documents?.[0] || request.value?.request_general?.[0] || null,
)
const requestHistoryDetail = computed(
  () => request.value?.request_history_changes?.[0] || request.value?.request_history?.[0] || null,
)
const requestEducationDetail = computed(
  () =>
    request.value?.request_education_records_changes?.[0] ||
    request.value?.request_education_records?.[0] ||
    null,
)
const overviewFields = computed<DetailField[]>(() => {
  const item = request.value
  if (!item) return []
  return [
    { label: 'ประเภทเอกสาร', value: display(item.document_type) },
    { label: 'หัวข้อคำร้อง', value: display(item.title) },
    { label: 'รายละเอียด', value: display(item.description) },
    { label: 'จำนวน', value: display(item.quantity) },
    { label: 'วันที่เริ่มต้น', value: formatThaiBuddhistDate(item.start_date) || '-' },
    { label: 'วันสิ้นสุด', value: formatThaiBuddhistDate(item.end_date) || '-' },
    { label: 'วันที่ส่งคำร้อง', value: formatThaiBuddhistDateTime(item.created_at) || '-' },
  ]
})
const detailSection = computed<DetailSection | null>(() => {
  const general = requestGeneralDetail.value
  if (general)
    return {
      title: 'รายละเอียดคำร้องขอเอกสาร',
      fields: [
        { label: 'จำนวนใบรับรองเงินเดือน', value: display(general.salary_cert_qty) },
        { label: 'จำนวนใบรับรองการทำงาน', value: display(general.work_cert_qty) },
        { label: 'ธนาคารรับสิทธิ', value: display(general.rights_auth_bank) },
        { label: 'จำนวนสิทธิ', value: display(general.rights_auth_qty) },
        { label: 'ข้อมูลเงินเดือน', value: display(general.salary_info) },
        { label: 'เงินวิทยฐานะ', value: display(general.academic_allowance) },
        { label: 'เงินค่าตอบแทน', value: display(general.compensation_allowance) },
      ],
    }
  const history = requestHistoryDetail.value
  if (history)
    return {
      title: 'รายละเอียดแบบรายงานเปลี่ยนแปลง',
      fields: [
        { label: 'เพิ่มวุฒิการศึกษา', value: booleanLabel(history.is_qualification_added) },
        { label: 'จดทะเบียนสมรส', value: booleanLabel(history.is_marriage_registered) },
        { label: 'จดทะเบียนหย่า', value: booleanLabel(history.is_divorce_registered) },
        { label: 'ธนาคารรับสิทธิ', value: display(history.rights_auth_bank) },
        { label: 'จำนวนสิทธิ', value: display(history.rights_auth_qty) },
      ],
    }
  const education = requestEducationDetail.value
  if (education)
    return {
      title: 'รายละเอียดคำร้องขอเพิ่มวุฒิการศึกษา',
      fields: [
        { label: 'ระดับการศึกษา', value: display(education.education_level) },
        { label: 'วุฒิการศึกษา', value: display(education.qualification) },
        { label: 'ชื่อวุฒิการศึกษา', value: display(education.qualification_name) },
        { label: 'สาขาเอก', value: display(education.major_group) },
        { label: 'สาขาโท', value: display(education.minor_group) },
        { label: 'สถาบัน', value: display(education.institution) },
        { label: 'ประเทศ', value: display(education.country) },
        { label: 'วันที่เริ่มศึกษา', value: formatThaiBuddhistDate(education.start_date) || '-' },
        {
          label: 'วันที่สำเร็จการศึกษา',
          value: formatThaiBuddhistDate(education.graduation_date) || '-',
        },
        { label: 'เกียรตินิยม', value: display(education.honor_type) },
        {
          label: 'ใช้บรรจุครั้งแรก',
          value: booleanLabel(education.is_used_for_first_appointment),
        },
        { label: 'เป็นวุฒิสูงสุด', value: booleanLabel(education.is_highest_degree) },
        {
          label: 'ตรงตามมาตรฐานตำแหน่ง',
          value: booleanLabel(education.is_meets_position_standard),
        },
        { label: 'ก.ค.ศ. รับรอง', value: booleanLabel(education.is_recognized_by_kksa) },
        { label: 'ก.พ. รับรอง', value: booleanLabel(education.is_recognized_by_ocsc) },
      ],
    }
  return null
})
const groupedDocumentLinks = computed(() => {
  const grouped = new Map<string, DocumentLinkWithResource[]>()
  for (const link of request.value?.document_links || []) {
    const purpose = link.purpose?.trim() || 'ไฟล์แนบ'
    const resolved = { ...link, resource: documentResources.value[link.document_key] ?? null }
    const current = grouped.get(purpose)
    if (current) current.push(resolved)
    else grouped.set(purpose, [resolved])
  }
  return Array.from(grouped.entries()).map(([purpose, links]) => ({ purpose, links }))
})
const isSaveDisabled = computed(
  () => loading.value || saving.value || !status.value || status.value === initialStatus.value,
)

function display(value: unknown): string | number {
  return value === null || value === undefined || value === '' ? '-' : String(value)
}

function booleanLabel(value: boolean | null | undefined) {
  if (value === true) return 'ใช่'
  if (value === false) return 'ไม่ใช่'
  return '-'
}

async function fetchDocumentResources(links: DocumentLink[]) {
  const uniqueKeys = [...new Set(links.map((link) => link.document_key).filter(Boolean))]
  if (!uniqueKeys.length) {
    documentResources.value = {}
    return
  }
  loadingDocumentResources.value = true
  try {
    const results = await Promise.allSettled(
      uniqueKeys.map(async (key) => ({
        key,
        data: (await getFileDocumentRows<FileDocument>(key)).data ?? null,
      })),
    )
    const resources: Record<string, FileDocument | null> = {}
    for (const result of results)
      if (result.status === 'fulfilled') resources[result.value.key] = result.value.data
    documentResources.value = resources
  } finally {
    loadingDocumentResources.value = false
  }
}

async function fetchRequest() {
  if (!route.params.id) return
  loading.value = true
  error.value = ''
  try {
    const response = await getDocumentRequestById(String(route.params.id))
    request.value = response.data
    status.value = response.data.status || 'กำลังดำเนินการ'
    initialStatus.value = status.value
    await fetchDocumentResources(response.data.document_links || [])
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'ไม่สามารถโหลดข้อมูลคำร้องเอกสารได้'
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  const item = request.value
  if (!item || !status.value || status.value === initialStatus.value) return
  saving.value = true
  try {
    await updateDocumentRequest(item.id, {
      id: item.id,
      title: item.title,
      person_id: item.person_id,
      document_type: item.document_type,
      description: item.description,
      start_date: item.start_date,
      end_date: item.end_date,
      quantity: item.quantity,
      status: status.value,
      created_at: item.created_at,
    })
    const authStore = useAuthStore()
    const approvalLog: Omit<ApprovalLog, 'id' | 'created_at'> = {
      request_id: item.id,
      approver_id: authStore.user?.id || '',
      action: status.value,
      comment: `แก้ไขคำร้อง: เปลี่ยนสถานะจาก ${initialStatus.value || 'ไม่ระบุ'} เป็น ${status.value}`,
    }
    await createApprovalLog(approvalLog)
    toast.success('บันทึกสถานะคำร้องเรียบร้อยแล้ว')
    void router.push({ name: ROUTE_NAMES.REQUEST_LIST })
  } catch (cause) {
    toast.error(cause instanceof Error ? cause.message : 'ไม่สามารถบันทึกการเปลี่ยนแปลงได้')
  } finally {
    saving.value = false
  }
}

function preview(resource: FileDocument) {
  previewResource.value = resource
  previewDialogOpen.value = true
}

function goBack() {
  void router.push({ name: ROUTE_NAMES.REQUEST_LIST })
}

onMounted(fetchRequest)
</script>

<template>
  <MainLayout>
    <div class="relative flex h-full flex-col gap-4 overflow-auto">
      <div class="shrink-0 pt-3">
        <button
          class="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
          @click="goBack"
        >
          <ChevronLeft class="h-4 w-4" />ย้อนกลับ
        </button>
      </div>

      <h1 class="mx-6 text-2xl font-bold">รายละเอียดและแก้ไขคำร้องเอกสาร</h1>

      <div
        v-if="request"
        class="bg-primary text-primary-foreground mx-6 flex shrink-0 items-center justify-between gap-3 rounded-[10px] border p-3"
      >
        <div class="min-w-0">
          <h2 class="truncate text-xl font-bold">{{ documentRequestFullName(request) }}</h2>
          <p class="mt-1 text-sm opacity-90">
            {{ request.document_type || 'ไม่ระบุประเภทเอกสาร' }}
          </p>
        </div>
        <Badge
          :variant="request.status === 'ไม่อนุมัติ' ? 'destructive' : 'secondary'"
          class="shrink-0"
        >
          {{ request.status || 'กำลังดำเนินการ' }}
        </Badge>
      </div>

      <div v-if="loading" class="flex flex-1 items-center justify-center p-10">
        <Loader2 class="mr-2 h-5 w-5 animate-spin" />กำลังโหลดข้อมูล...
      </div>
      <div v-else-if="error" role="alert" class="mx-6 space-y-3 rounded-lg border p-6">
        <p class="text-destructive">{{ error }}</p>
        <Button variant="outline" @click="fetchRequest">ลองใหม่</Button>
      </div>
      <div v-else-if="request" class="mx-6 space-y-4 pb-6">
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
            <div class="border-b px-4 py-3 md:odd:border-r">
              <dt class="text-muted-foreground mb-2 text-sm">สถานะคำร้อง</dt>
              <dd>
                <select
                  v-model="status"
                  class="border-input bg-background focus-visible:ring-ring h-9 w-full max-w-xs rounded-md border px-3 text-sm focus-visible:ring-1 focus-visible:outline-none"
                >
                  <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                  <option value="อนุมัติ">อนุมัติ</option>
                  <option value="ไม่อนุมัติ">ไม่อนุมัติ</option>
                </select>
              </dd>
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

        <section class="overflow-hidden rounded-lg border">
          <h2 class="bg-muted border-b px-4 py-3 font-semibold">ไฟล์แนบคำร้อง</h2>
          <div v-if="loadingDocumentResources" class="text-muted-foreground p-4 text-sm">
            กำลังโหลดเอกสาร...
          </div>
          <div
            v-else-if="!groupedDocumentLinks.length"
            class="text-muted-foreground p-6 text-center"
          >
            ไม่มีไฟล์แนบ
          </div>
          <div v-else class="divide-y">
            <div v-for="group in groupedDocumentLinks" :key="group.purpose" class="p-4">
              <h3 class="mb-3 text-sm font-semibold">{{ group.purpose }}</h3>
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

        <div class="bg-background/95 sticky bottom-0 flex justify-end border-t py-3 backdrop-blur">
          <Button :disabled="isSaveDisabled" @click="handleSave">
            <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
            {{ saving ? 'กำลังบันทึก...' : 'บันทึกสถานะ' }}
          </Button>
        </div>
      </div>
    </div>

    <DocumentPreviewDialog v-model:open="previewDialogOpen" :resource="previewResource" />
  </MainLayout>
</template>
