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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ROUTE_NAMES } from '@/lib/constants'
import { documentRequestFullName } from '@/lib/documentRequest'
import { formatThaiBuddhistDate, formatThaiBuddhistDateTime } from '@/lib/helpers'
import { classifyPAFile, PA_FILE_GROUPS } from '@/lib/pa'
import { getSubjectGroupName } from '@/lib/subjectGroups'
import { useAuthStore } from '@/stores/auth'
import { getFileDocumentRows } from '@/stores/document'
import {
  createApprovalLog,
  getDocumentRequestById,
  updateDocumentRequest,
} from '@/stores/document_request'
import { getPAData } from '@/stores/pa'
import type { FileDocument } from '@/types/document'
import type {
  ApprovalLog,
  DocumentLink,
  DocumentRequest,
  RequestCommitteePA,
} from '@/types/document_request'

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
const rejectionComment = ref('')
const initialRejectionComment = ref('')
const loadingDocumentResources = ref(false)
const documentResources = ref<Record<string, FileDocument | null>>({})
const previewDialogOpen = ref(false)
const previewResource = ref<FileDocument | null>(null)
const DEFAULT_REJECTION_COMMENT = 'เอกสารไม่สมบูรณ์'

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] || null : value || null
}

function relationArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

const requestGeneralDetail = computed(
  () =>
    firstRelation(request.value?.request_general_documents) ||
    firstRelation(request.value?.request_general),
)
const requestHistoryDetail = computed(
  () =>
    firstRelation(request.value?.request_history_changes) ||
    firstRelation(request.value?.request_history),
)
const requestEducationDetail = computed(
  () =>
    firstRelation(request.value?.request_education_records_changes) ||
    firstRelation(request.value?.request_education_records),
)
const requestPADetail = computed(
  () =>
    firstRelation(request.value?.request_committee_pa) ||
    firstRelation(request.value?.req_committee_pa),
)

function isDocumentType(fragment: string) {
  return request.value?.document_type?.includes(fragment) ?? false
}

function quantityLabel(value: number | null | undefined) {
  return value && value > 0 ? `${value} ฉบับ` : 'ไม่ได้ขอ'
}

function bankLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    krungthai: 'ธนาคารกรุงไทย',
    bangkok: 'ธนาคารกรุงเทพ',
    kasikorn: 'ธนาคารกสิกรไทย',
    scb: 'ธนาคารไทยพาณิชย์',
    gsb: 'ธนาคารออมสิน',
  }
  return value ? labels[value] || value : '-'
}
const overviewFields = computed<DetailField[]>(() => {
  const item = request.value
  if (!item) return []
  const fields: DetailField[] = [
    { label: 'ประเภทเอกสาร', value: display(item.document_type) },
    { label: 'วันที่ส่งคำร้อง', value: formatThaiBuddhistDateTime(item.created_at) || '-' },
  ]
  if (item.title) fields.splice(1, 0, { label: 'หัวข้อคำร้อง', value: item.title })
  if (item.description) fields.splice(-1, 0, { label: 'รายละเอียด', value: item.description })
  if (item.quantity !== null && item.quantity !== undefined)
    fields.splice(-1, 0, { label: 'จำนวน', value: item.quantity })
  if (item.start_date)
    fields.splice(-1, 0, {
      label: 'วันที่เริ่มต้น',
      value: formatThaiBuddhistDate(item.start_date) || '-',
    })
  if (item.end_date)
    fields.splice(-1, 0, {
      label: 'วันสิ้นสุด',
      value: formatThaiBuddhistDate(item.end_date) || '-',
    })
  return fields
})
const detailSection = computed<DetailSection | null>(() => {
  if (isDocumentType('คำร้องขอเอกสาร')) {
    const general = requestGeneralDetail.value
    if (!general) return null
    return {
      title: 'รายละเอียดคำร้องขอเอกสาร',
      fields: [
        { label: 'ใบรับรองเงินเดือน', value: quantityLabel(general.salary_cert_qty) },
        { label: 'ใบรับรองการปฏิบัติงาน', value: quantityLabel(general.work_cert_qty) },
        { label: 'ธนาคารรับสิทธิ', value: bankLabel(general.rights_auth_bank) },
        { label: 'เอกสารหนังสือผ่านสิทธิ์', value: quantityLabel(general.rights_auth_qty) },
        { label: 'ข้อมูลเงินเดือน', value: display(general.salary_info) },
        { label: 'เงินวิทยฐานะ', value: display(general.academic_allowance) },
        { label: 'เงินค่าตอบแทน', value: display(general.compensation_allowance) },
      ],
    }
  }
  if (isDocumentType('เปลี่ยนแปลง')) {
    const history = requestHistoryDetail.value
    if (!history) return null
    return {
      title: 'รายละเอียดแบบรายงานเปลี่ยนแปลง',
      fields: [
        { label: 'เพิ่มวุฒิการศึกษา', value: booleanLabel(history.is_qualification_added) },
        { label: 'จดทะเบียนสมรส', value: booleanLabel(history.is_marriage_registered) },
        { label: 'จดทะเบียนหย่า', value: booleanLabel(history.is_divorce_registered) },
        { label: 'ธนาคารรับสิทธิ', value: bankLabel(history.rights_auth_bank) },
        { label: 'เอกสารหนังสือผ่านสิทธิ์', value: quantityLabel(history.rights_auth_qty) },
      ],
    }
  }
  if (isDocumentType('เพิ่มวุ')) {
    const education = requestEducationDetail.value
    if (!education) return null
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
  }
  if (isDocumentType('การประเมินPA')) {
    const pa = requestPADetail.value
    if (!pa) return null
    return paDetailSection(pa)
  }
  return null
})

function paDetailSection(pa: RequestCommitteePA): DetailSection {
  return {
    title: 'รายละเอียดการประเมิน PA',
    fields: [
      {
        label: 'กลุ่มสาระการเรียนรู้',
        value: getSubjectGroupName(pa.subject_group) || 'ไม่ระบุกลุ่มสาระการเรียนรู้',
      },
      { label: 'ปฏิบัติการสอนชั้น/ระดับ', value: display(pa.teaching_level_1) },
      { label: 'รายวิชา', value: display(pa.subject_name) },
      { label: 'เงินเดือนปัจจุบัน', value: display(pa.salary) },
      { label: 'การสอนตามตารางสอน', value: display(pa.teaching_hours_per_week) },
      {
        label: 'งานส่งเสริมและสนับสนุนการจัดการเรียนรู้',
        value: display(pa.support_hours_per_week),
      },
      { label: 'งานพัฒนาคุณภาพการศึกษา', value: display(pa.dev_quality_hours_per_week) },
      { label: 'งานตอบสนองนโยบายและจุดเน้น', value: display(pa.policy_hours_per_week) },
      { label: 'กรรมการคนที่ 1', value: display(pa.committee_name_1) },
      { label: 'กรรมการคนที่ 2', value: display(pa.committee_name_2) },
      { label: 'กรรมการคนที่ 3', value: display(pa.committee_name_3) },
    ],
  }
}

const detailUnavailableMessage = computed(() => {
  if (detailSection.value) return ''
  if (isDocumentType('บัตรประจำตัว') || isDocumentType('ต่างประเทศ'))
    return 'รายละเอียดของคำร้องประเภทนี้อยู่ในไฟล์แนบด้านล่าง'
  if (isDocumentType('การส่งเอกสารPA')) return 'รายละเอียดการส่งเอกสารอยู่ในไฟล์แนบด้านล่าง'
  return 'ไม่พบข้อมูลรายละเอียดที่ผูกกับคำร้องนี้'
})

const attachmentTitle = computed(() => {
  if (isDocumentType('บัตรประจำตัว')) return 'เอกสารคำขอบัตรประจำตัว'
  if (isDocumentType('ต่างประเทศ')) return 'เอกสารคำร้องขออนุญาตไปต่างประเทศ'
  if (isDocumentType('เปลี่ยนแปลง')) return 'เอกสารประกอบแบบรายงานเปลี่ยนแปลง'
  if (isDocumentType('เพิ่มวุ')) return 'เอกสารประกอบคำร้องขอเพิ่มวุฒิการศึกษา'
  if (isDocumentType('การประเมินPA') || isDocumentType('การส่งเอกสารPA'))
    return 'เอกสารประกอบการประเมิน PA'
  return 'ไฟล์แนบคำร้อง'
})
const groupedDocumentLinks = computed(() => {
  const grouped = new Map<string, DocumentLinkWithResource[]>()
  for (const link of request.value?.document_links || []) {
    const resolved = { ...link, resource: documentResources.value[link.document_key] ?? null }
    const purpose = link.purpose?.trim() || 'ไฟล์แนบ'
    const groupId = isDocumentType('การประเมินPA')
      ? classifyPAFile(resolved.resource?.original_filename || '', purpose)
      : purpose
    const current = grouped.get(groupId)
    if (current) current.push(resolved)
    else grouped.set(groupId, [resolved])
  }
  return Array.from(grouped.entries()).map(([groupId, links]) => ({
    groupId,
    label: isDocumentType('การประเมินPA')
      ? PA_FILE_GROUPS.find((group) => group.id === groupId)?.label || 'ไฟล์อื่น ๆ'
      : groupId,
    links,
  }))
})
const approvalLogs = computed(() =>
  relationArray(request.value?.approval_logs).sort((a, b) =>
    (b.created_at || '').localeCompare(a.created_at || ''),
  ),
)
const isSaveDisabled = computed(
  () =>
    loading.value ||
    saving.value ||
    !status.value ||
    (status.value === 'ไม่อนุมัติ' && !rejectionComment.value.trim()) ||
    (status.value === initialStatus.value &&
      (status.value !== 'ไม่อนุมัติ' ||
        rejectionComment.value.trim() === initialRejectionComment.value.trim())),
)

function display(value: unknown): string | number {
  return value === null || value === undefined || value === '' ? '-' : String(value)
}

function booleanLabel(value: boolean | null | undefined) {
  if (value === true) return 'ใช่'
  if (value === false) return 'ไม่ใช่'
  return '-'
}

function handleStatusChange(value: unknown) {
  const previousStatus = status.value
  status.value = String(value ?? '') as DocumentRequest['status'] | ''
  if (
    status.value === 'ไม่อนุมัติ' &&
    previousStatus !== 'ไม่อนุมัติ' &&
    !rejectionComment.value.trim()
  ) {
    rejectionComment.value = DEFAULT_REJECTION_COMMENT
  }
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
    const id = String(route.params.id)
    const response = await getDocumentRequestById(id)
    const manageData = response.data
    let data = manageData
    if (manageData.document_type?.includes('การประเมินPA')) {
      try {
        const paData = await getPAData(id)
        data = {
          ...manageData,
          ...paData,
          status: manageData.status,
          approval_logs: manageData.approval_logs,
          document_links: manageData.document_links?.length
            ? manageData.document_links
            : paData.document_links,
        } as DocumentRequest
      } catch {
        // ใช้ข้อมูลคำร้องจากชุดข้อมูล Manage ต่อได้ หากชุดข้อมูล PA ยังไม่มีรายการนี้
      }
    }
    request.value = data
    status.value = data.status || 'กำลังดำเนินการ'
    initialStatus.value = status.value
    const logsWithComments = relationArray(data.approval_logs)
      .filter((log) => log.comment?.trim())
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))[0]
    const latestRejection = relationArray(data.approval_logs)
      .filter((log) => log.action?.trim() === 'ไม่อนุมัติ' && log.comment?.trim())
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))[0]
    const existingComment =
      latestRejection?.comment?.trim() ||
      (status.value === 'ไม่อนุมัติ' ? logsWithComments?.comment?.trim() : '') ||
      ''
    rejectionComment.value = existingComment
    initialRejectionComment.value = existingComment
    await fetchDocumentResources(data.document_links || [])
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'ไม่สามารถโหลดข้อมูลคำร้องเอกสารได้'
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  const item = request.value
  if (!item || !status.value) return
  const commentChanged =
    status.value === 'ไม่อนุมัติ' &&
    rejectionComment.value.trim() !== initialRejectionComment.value.trim()
  if (status.value === initialStatus.value && !commentChanged) return
  if (status.value === 'ไม่อนุมัติ' && !rejectionComment.value.trim()) {
    toast.error('กรุณาระบุเหตุผลที่ไม่อนุมัติ')
    return
  }
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
      comment:
        status.value === 'ไม่อนุมัติ'
          ? rejectionComment.value.trim()
          : `เปลี่ยนสถานะจาก ${initialStatus.value || 'ไม่ระบุ'} เป็น ${status.value}`,
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
          :variant="
            status === 'ไม่อนุมัติ' ? 'destructive' : status === 'อนุมัติ' ? 'default' : 'secondary'
          "
          class="shrink-0"
        >
          {{ status || 'กำลังดำเนินการ' }}
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
                <Select :model-value="status || undefined" @update:model-value="handleStatusChange">
                  <SelectTrigger class="w-full max-w-xs" aria-label="สถานะคำร้อง">
                    <SelectValue placeholder="เลือกสถานะคำร้อง" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="กำลังดำเนินการ">กำลังดำเนินการ</SelectItem>
                    <SelectItem value="อนุมัติ">อนุมัติ</SelectItem>
                    <SelectItem value="ไม่อนุมัติ">ไม่อนุมัติ</SelectItem>
                  </SelectContent>
                </Select>
              </dd>
            </div>
            <div v-if="status === 'ไม่อนุมัติ'" class="border-b px-4 py-3">
              <dt class="text-muted-foreground mb-2 text-sm">
                เหตุผลที่ไม่อนุมัติ <span class="text-destructive">*</span>
              </dt>
              <dd>
                <Textarea
                  v-model="rejectionComment"
                  rows="3"
                  maxlength="1000"
                  placeholder="ระบุเหตุผลที่ไม่อนุมัติ"
                  aria-label="เหตุผลที่ไม่อนุมัติ"
                  class="max-w-2xl resize-y"
                />
                <p class="text-muted-foreground mt-1 text-xs">
                  ข้อความนี้จะบันทึกในประวัติการดำเนินการของคำร้อง
                </p>
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

        <p
          v-else-if="detailUnavailableMessage"
          class="text-muted-foreground rounded-lg border px-4 py-3 text-sm"
        >
          {{ detailUnavailableMessage }}
        </p>

        <section v-if="approvalLogs.length" class="overflow-hidden rounded-lg border">
          <h2 class="bg-muted border-b px-4 py-3 font-semibold">ประวัติการดำเนินการ</h2>
          <div class="divide-y">
            <div
              v-for="log in approvalLogs"
              :key="log.id"
              class="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div class="min-w-0">
                <Badge
                  :variant="
                    log.action === 'ไม่อนุมัติ'
                      ? 'destructive'
                      : log.action === 'อนุมัติ'
                        ? 'default'
                        : 'secondary'
                  "
                >
                  {{ log.action }}
                </Badge>
                <p v-if="log.comment" class="mt-2 break-words whitespace-pre-wrap">
                  {{ log.comment }}
                </p>
              </div>
              <time class="text-muted-foreground shrink-0 text-sm">
                {{ formatThaiBuddhistDateTime(log.created_at) || '-' }}
              </time>
            </div>
          </div>
        </section>

        <section class="overflow-hidden rounded-lg border">
          <h2 class="bg-muted border-b px-4 py-3 font-semibold">{{ attachmentTitle }}</h2>
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
            <div v-for="group in groupedDocumentLinks" :key="group.groupId" class="p-4">
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
