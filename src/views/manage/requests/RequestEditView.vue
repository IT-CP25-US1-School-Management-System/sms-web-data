<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MainLayout from '@/layouts/manage/MainLayout.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, ExternalLink, Eye, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { DocumentRequest, ApprovalLog, DocumentLink } from '@/types/document_request'
import type { FileDocument } from '@/types/document'
import {
  getDocumentRequestById,
  updateDocumentRequest,
  createApprovalLog,
} from '@/stores/document_request'
import { getFileDocumentRows } from '@/stores/document'
import { toDateInputFormat, getPrefixName } from '@/lib/helpers'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()

// State
const request = ref<DocumentRequest | null>(null)
const loading = ref(false)
const saving = ref(false)
const initialFormSnapshot = ref('')
const loadingDocumentResources = ref(false)
const documentResources = ref<Record<string, FileDocument | null>>({})
const previewDialogOpen = ref(false)
const previewLoading = ref(false)
const previewError = ref('')
const previewUrl = ref('')
const previewOriginalUrl = ref('')
const previewFileName = ref('')
const previewContentType = ref('')

const staticFieldClass =
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40 disabled:text-foreground'

// Form data
const formData = ref({
  document_type: '',
  description: '',
  start_date: '',
  end_date: '',
  quantity: '',
  status: '',
})

const selectedDocumentType = computed(
  () => formData.value.document_type || request.value?.document_type || '',
)

const requestGeneralDetail = computed(() => request.value?.request_general_documents?.[0] || null)
const requestHistoryDetail = computed(() => request.value?.request_history_changes?.[0] || null)
const requestEducationDetail = computed(
  () => request.value?.request_education_records_changes?.[0] || null,
)
type DocumentLinkWithResource = DocumentLink & {
  resource: FileDocument | null
}

const requestDocumentLinks = computed<DocumentLink[]>(() => request.value?.document_links || [])
const groupedDocumentLinks = computed(() => {
  const grouped = new Map<string, DocumentLinkWithResource[]>()

  for (const link of requestDocumentLinks.value) {
    const purpose = link.purpose?.trim() || 'ไม่ระบุวัตถุประสงค์'
    const resolvedLink: DocumentLinkWithResource = {
      ...link,
      resource: documentResources.value[link.document_key] ?? null,
    }
    const existing = grouped.get(purpose)
    if (existing) {
      existing.push(resolvedLink)
      continue
    }
    grouped.set(purpose, [resolvedLink])
  }

  return Array.from(grouped.entries()).map(([purpose, links]) => ({ purpose, links }))
})

const isGeneralRequest = computed(
  () => Boolean(requestGeneralDetail.value) || selectedDocumentType.value === 'คำร้องขอเอกสาร',
)
const isHistoryRequest = computed(
  () =>
    Boolean(requestHistoryDetail.value) ||
    selectedDocumentType.value.includes('แบบรายงานเปลี่ยนแปลง'),
)
const isEducationRequest = computed(
  () => Boolean(requestEducationDetail.value) || selectedDocumentType.value.includes('เพิ่มวุ'),
)
const isPARequest = computed(() => selectedDocumentType.value.toLowerCase().includes('pa'))
const hasChanges = computed(() => {
  if (!initialFormSnapshot.value) return false

  return JSON.stringify(formData.value) !== initialFormSnapshot.value
})
const isSaveDisabled = computed(() => loading.value || saving.value || !hasChanges.value)
const previewFileKind = computed<'pdf' | 'image' | 'unsupported'>(() => {
  if (isPdfFile(previewContentType.value, previewFileName.value)) return 'pdf'
  if (isImageFile(previewContentType.value, previewFileName.value)) return 'image'
  return 'unsupported'
})

const formatBooleanLabel = (value: boolean | null | undefined) => {
  if (value === true) return 'ใช่'
  if (value === false) return 'ไม่ใช่'
  return '-'
}

function formatFileSize(bytes: number | null | undefined) {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isPdfFile(contentType?: string | null, fileName?: string | null) {
  const normalizedType = contentType?.toLowerCase() || ''
  const normalizedName = fileName?.toLowerCase() || ''

  return normalizedType.includes('pdf') || normalizedName.endsWith('.pdf')
}

function isImageFile(contentType?: string | null, fileName?: string | null) {
  const normalizedType = contentType?.toLowerCase() || ''
  const normalizedName = fileName?.toLowerCase() || ''

  return (
    normalizedType.startsWith('image/') || /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(normalizedName)
  )
}

function revokePreviewUrl() {
  if (!previewUrl.value) return

  window.URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

function resetPreviewState() {
  previewLoading.value = false
  previewError.value = ''
  previewOriginalUrl.value = ''
  previewFileName.value = ''
  previewContentType.value = ''
  revokePreviewUrl()
}

function handlePreviewOpenChange(open: boolean) {
  previewDialogOpen.value = open

  if (!open) {
    resetPreviewState()
  }
}

async function handlePreviewDocument(resource: FileDocument) {
  previewDialogOpen.value = true
  previewLoading.value = true
  previewError.value = ''
  previewOriginalUrl.value = resource.url
  previewFileName.value = resource.original_filename || 'document'
  previewContentType.value = resource.content_type || ''
  revokePreviewUrl()

  try {
    const response = await fetch(resource.url, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('ไม่สามารถโหลดไฟล์ตัวอย่างได้')
    }

    const blob = await response.blob()

    previewContentType.value = blob.type || resource.content_type || ''
    previewUrl.value = window.URL.createObjectURL(blob)

    if (previewFileKind.value === 'unsupported') {
      previewError.value = 'ไฟล์ประเภทนี้ยังไม่รองรับการแสดงตัวอย่างในหน้าเว็บ กรุณาเปิดในแท็บใหม่'
    }
  } catch (error: any) {
    previewError.value = error?.message || 'ไม่สามารถโหลดไฟล์ตัวอย่างได้'
  } finally {
    previewLoading.value = false
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
      uniqueKeys.map(async (key) => {
        const response = await getFileDocumentRows<FileDocument>(key)
        return {
          key,
          data: response.data ?? null,
        }
      }),
    )

    const nextResources: Record<string, FileDocument | null> = {}

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        nextResources[result.value.key] = result.value.data
      }
    })

    documentResources.value = nextResources
  } finally {
    loadingDocumentResources.value = false
  }
}

// Fetch request data
const fetchRequest = async () => {
  if (!route.params.id) return

  loading.value = true
  try {
    const response = await getDocumentRequestById(route.params.id as string)
    request.value = response.data
    await fetchDocumentResources(response.data.document_links || [])
    // Populate form
    formData.value = {
      document_type: response.data.document_type || '',
      description: response.data.description || '',
      start_date: toDateInputFormat(response.data.start_date) || '',
      end_date: toDateInputFormat(response.data.end_date) || '',
      quantity: String(response.data.quantity) || '',
      status: response.data.status || '',
    }
    initialFormSnapshot.value = JSON.stringify(formData.value)
  } catch (error: any) {
    console.error('Failed to fetch request:', error)
    toast.error('เกิดข้อผิดพลาด', {
      description: error.message || 'ไม่สามารถโหลดข้อมูลคำร้องเอกสารได้',
    })
  } finally {
    loading.value = false
  }
}

// Save changes
const handleSave = async () => {
  if (!request.value) return

  saving.value = true
  try {
    const updateData: Partial<DocumentRequest> = {
      id: request.value.id,
      title: request.value.title,
      person_id: request.value.person_id,
      document_type: formData.value.document_type,
      description: formData.value.description,
      start_date: formData.value.start_date || undefined,
      end_date: formData.value.end_date || undefined,
      quantity: parseFloat(formData.value.quantity) || 0,
      status: (formData.value.status as 'กำลังดำเนินการ' | 'อนุมัติ' | 'ไม่อนุมัติ') || undefined,
      created_at: request.value.created_at,
      updated_at: new Date().toISOString(),
    }
    await updateDocumentRequest(request.value.id, updateData)

    // Create approval log
    const authStore = useAuthStore()
    const approvalLogData: Omit<ApprovalLog, 'id' | 'created_at'> = {
      request_id: request.value.id,
      approver_id: authStore.user?.id || '', //9667f10f-12d2-4795-86a1-3e82deb6ac0e
      action: formData.value.status as 'อนุมัติ' | 'ไม่อนุมัติ' | 'กำลังดำเนินการ',
      comment: `แก้ไขคำร้อง: เปลี่ยนสถานะจาก ${request.value.status || ''} เป็น ${formData.value.status || ''}`,
    }
    await createApprovalLog(approvalLogData)

    toast.success('สำเร็จ', {
      description: 'บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว',
    })
    console.log(updateData)

    router.back()
  } catch (error: any) {
    console.error('Failed to update request:', error)
    toast.error('เกิดข้อผิดพลาด', {
      description: error.message || 'ไม่สามารถบันทึกการเปลี่ยนแปลง',
    })
  } finally {
    saving.value = false
  }
}

// Handle cancel
const handleCancel = () => {
  router.back()
}

// Load data on mount
onMounted(() => {
  fetchRequest()
})

onBeforeUnmount(() => {
  resetPreviewState()
})
</script>

<template>
  <MainLayout>
    <div class="flex h-full flex-col gap-3 py-3">
      <!-- Header -->
      <div class="shrink-0 space-y-2">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <Button variant="ghost" size="sm" @click="handleCancel">
              <ArrowLeft class="mr-2 h-4 w-4" />
              ย้อนกลับ
            </Button>
            <h1 class="text-lg font-semibold">แก้ไขคำร้องเอกสาร</h1>
          </div>
        </div>
      </div>

      <!-- Form Card Header -->
      <div class="bg-primary text-primary-foreground shrink-0 rounded-lg px-4 py-2">
        <h2 class="text-base font-semibold">
          ข้อมูลคำร้องเอกสาร {{ getPrefixName(request?.person_data?.[0]?.prefix_id)
          }}{{ request?.person_data?.[0]?.first_name_th }}
          {{ request?.person_data?.[0]?.last_name_th }}
        </h2>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex min-h-0 flex-1 items-center justify-center">
        <div class="flex flex-col items-center gap-2">
          <Loader2 class="text-primary h-8 w-8 animate-spin" />
          <span class="text-muted-foreground">กำลังโหลดข้อมูล...</span>
        </div>
      </div>

      <!-- Form -->
      <div v-else class="flex min-h-0 flex-1 flex-col gap-4 overflow-auto">
        <Card>
          <CardContent class="space-y-4 pt-6">
            <!-- Document Type -->
            <div class="space-y-2">
              <Label for="document_type">ประเภทเอกสาร</Label>
              <Input
                id="document_type"
                v-model="formData.document_type"
                placeholder="เช่น ใบการศึกษา"
                :disabled="true"
                :class="staticFieldClass"
              />
            </div>

            <!-- Description -->
            <div class="space-y-2">
              <Label for="description">รายละเอียด</Label>
              <Textarea
                id="description"
                v-model="formData.description"
                placeholder="รายละเอียดคำร้อง"
                rows="4"
                :disabled="true"
                :class="staticFieldClass"
              />
            </div>

            <!-- Dates -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="start_date">วันที่เริ่มต้น</Label>
                <Input
                  id="start_date"
                  v-model="formData.start_date"
                  type="date"
                  :disabled="true"
                  :class="staticFieldClass"
                />
              </div>
              <div class="space-y-2">
                <Label for="end_date">วันสิ้นสุด</Label>
                <Input
                  id="end_date"
                  v-model="formData.end_date"
                  type="date"
                  :disabled="true"
                  :class="staticFieldClass"
                />
              </div>
            </div>

            <!-- Quantity & Status -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="quantity">จำนวน</Label>
                <Input
                  id="quantity"
                  v-model="formData.quantity"
                  type="number"
                  placeholder="0"
                  :disabled="true"
                  :class="staticFieldClass"
                />
              </div>
              <div class="space-y-2">
                <Label for="status">สถานะ</Label>
                <select
                  id="status"
                  v-model="formData.status"
                  :class="[
                    'focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none',
                    formData.status === 'อนุมัติ'
                      ? 'border-green-600 bg-green-600 text-white'
                      : formData.status === 'ไม่อนุมัติ'
                        ? 'border-red-600 bg-red-400 text-white'
                        : formData.status === 'กำลังดำเนินการ'
                          ? 'border-yellow-300 bg-yellow-300 text-blue-800'
                          : 'border-input bg-transparent',
                  ]"
                >
                  <option value="">-- เลือกสถานะ --</option>
                  <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                  <option value="อนุมัติ">อนุมัติ</option>
                  <option value="ไม่อนุมัติ">ไม่อนุมัติ</option>
                </select>
              </div>
            </div>

            <div v-if="isGeneralRequest && requestGeneralDetail" class="space-y-3">
              <Label class="text-base font-semibold">รายละเอียดคำร้องขอเอกสาร</Label>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label>จำนวนใบรับรองเงินเดือน</Label>
                  <Input
                    :model-value="String(requestGeneralDetail.salary_cert_qty ?? '-')"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>จำนวนใบรับรองการทำงาน</Label>
                  <Input
                    :model-value="String(requestGeneralDetail.work_cert_qty ?? '-')"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>ธนาคารรับสิทธิ</Label>
                  <Input
                    :model-value="requestGeneralDetail.rights_auth_bank || '-'"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>จำนวนสิทธิ</Label>
                  <Input
                    :model-value="String(requestGeneralDetail.rights_auth_qty ?? '-')"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>ข้อมูลเงินเดือน</Label>
                  <Input
                    :model-value="requestGeneralDetail.salary_info || '-'"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>เงินวิทยฐานะ</Label>
                  <Input
                    :model-value="requestGeneralDetail.academic_allowance || '-'"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>เงินค่าตอบแทน</Label>
                  <Input
                    :model-value="requestGeneralDetail.compensation_allowance || '-'"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
              </div>
            </div>

            <div v-if="isHistoryRequest && requestHistoryDetail" class="space-y-3">
              <Label class="text-base font-semibold">รายละเอียดแบบรายงานเปลี่ยนแปลง</Label>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label>เพิ่มวุฒิการศึกษา</Label>
                  <Input
                    :model-value="formatBooleanLabel(requestHistoryDetail.is_qualification_added)"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>จดทะเบียนสมรส</Label>
                  <Input
                    :model-value="formatBooleanLabel(requestHistoryDetail.is_marriage_registered)"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>จดทะเบียนหย่า</Label>
                  <Input
                    :model-value="formatBooleanLabel(requestHistoryDetail.is_divorce_registered)"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>ธนาคารรับสิทธิ</Label>
                  <Input
                    :model-value="requestHistoryDetail.rights_auth_bank || '-'"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>จำนวนสิทธิ</Label>
                  <Input
                    :model-value="String(requestHistoryDetail.rights_auth_qty ?? '-')"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
              </div>
            </div>

            <div v-if="isEducationRequest && requestEducationDetail" class="space-y-3">
              <Label class="text-base font-semibold">รายละเอียดคำร้องขอเพิ่มวุฒิการศึกษา</Label>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label>ระดับการศึกษา</Label>
                  <Input
                    :model-value="requestEducationDetail.education_level || '-'"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>วุฒิการศึกษา</Label>
                  <Input
                    :model-value="requestEducationDetail.qualification || '-'"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>ชื่อวุฒิการศึกษา</Label>
                  <Input
                    :model-value="requestEducationDetail.qualification_name || '-'"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>สาขาเอก</Label>
                  <Input
                    :model-value="requestEducationDetail.major_group || '-'"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>สาขาโท</Label>
                  <Input
                    :model-value="requestEducationDetail.minor_group || '-'"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>สถาบัน</Label>
                  <Input
                    :model-value="requestEducationDetail.institution || '-'"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>ประเทศ</Label>
                  <Input
                    :model-value="requestEducationDetail.country || '-'"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>วันที่เริ่มศึกษา</Label>
                  <Input
                    :model-value="toDateInputFormat(requestEducationDetail.start_date) || '-'"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>วันที่สำเร็จการศึกษา</Label>
                  <Input
                    :model-value="toDateInputFormat(requestEducationDetail.graduation_date) || '-'"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>เกียรตินิยม</Label>
                  <Input
                    :model-value="requestEducationDetail.honor_type || '-'"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>ใช้บรรจุครั้งแรก</Label>
                  <Input
                    :model-value="
                      formatBooleanLabel(requestEducationDetail.is_used_for_first_appointment)
                    "
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
                <div class="space-y-2">
                  <Label>เป็นวุฒิสูงสุด</Label>
                  <Input
                    :model-value="formatBooleanLabel(requestEducationDetail.is_highest_degree)"
                    :disabled="true"
                    :class="staticFieldClass"
                  />
                </div>
              </div>
            </div>

            <div v-if="requestDocumentLinks.length" class="space-y-2">
              <Label class="text-base font-semibold">
                {{ isPARequest ? 'รายการเอกสารที่แนบ (PA)' : 'ไฟล์แนบคำร้อง' }}
              </Label>
              <div class="space-y-2 rounded-md border p-3 text-sm">
                <div v-if="loadingDocumentResources" class="text-muted-foreground">
                  กำลังโหลดเอกสาร...
                </div>
                <div
                  v-for="(group, groupIndex) in groupedDocumentLinks"
                  :key="`${group.purpose}-${groupIndex}`"
                  class="rounded-md border p-2"
                >
                  <div class="font-medium">{{ group.purpose }}</div>
                  <div class="text-muted-foreground mt-1 space-y-1">
                    <div
                      v-for="(link, index) in group.links"
                      :key="`${group.purpose}-${link.document_key}-${index}`"
                      class="bg-muted/30 rounded border px-3 py-2"
                    >
                      <div
                        class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div class="min-w-0">
                          <a
                            v-if="link.resource?.url"
                            :href="link.resource.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-primary cursor-pointer text-left font-medium underline underline-offset-2"
                          >
                            {{ index + 1 }}. {{ link.resource.original_filename }}
                          </a>
                          <div v-else>{{ index + 1 }}. {{ link.document_key }}</div>
                          <div class="text-muted-foreground text-xs">
                            <span v-if="link.resource">
                              {{ formatFileSize(link.resource.size) }} |
                              {{ link.resource.content_type }}
                            </span>
                            <span v-else>มีบางผิดพลาดใน document service</span>
                          </div>
                        </div>
                        <div v-if="link.resource?.url" class="flex shrink-0 gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            class="gap-2"
                            @click="handlePreviewDocument(link.resource)"
                          >
                            <Eye class="h-4 w-4" />
                            ดูตัวอย่าง
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Footer Actions -->
        <div
          class="sticky right-0 bottom-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3 dark:border-neutral-700 dark:bg-black"
        >
          <Button
            class="rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D] disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isSaveDisabled"
            @click="handleSave"
          >
            {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
          </Button>
        </div>
      </div>
    </div>

    <Dialog :open="previewDialogOpen" @update:open="handlePreviewOpenChange">
      <DialogContent class="w-[98vw] max-w-[98vw] sm:max-w-[96vw] 2xl:max-w-[1600px]">
        <DialogHeader class="pr-8">
          <DialogTitle>ดูตัวอย่างไฟล์</DialogTitle>
          <DialogDescription class="break-all">
            {{ previewFileName || '-' }}
          </DialogDescription>
        </DialogHeader>

        <div class="text-muted-foreground flex items-center justify-between gap-3 text-xs">
          <span>{{ previewContentType || 'ไม่พบประเภทไฟล์' }}</span>
          <a
            v-if="previewOriginalUrl"
            :href="previewOriginalUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary inline-flex items-center gap-1 underline underline-offset-2"
          >
            <ExternalLink class="h-4 w-4" />
            เปิดแท็บใหม่
          </a>
        </div>

        <div class="bg-muted/20 overflow-hidden rounded-md border">
          <div v-if="previewLoading" class="flex h-[82vh] items-center justify-center">
            <div class="text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 class="text-primary h-6 w-6 animate-spin" />
              <span>กำลังโหลดตัวอย่างไฟล์...</span>
            </div>
          </div>

          <div
            v-else-if="previewError"
            class="text-muted-foreground flex h-[82vh] items-center justify-center px-6 text-center text-sm"
          >
            {{ previewError }}
          </div>

          <iframe
            v-else-if="previewFileKind === 'pdf' && previewUrl"
            :src="previewUrl"
            class="h-[82vh] w-full"
            title="preview-document"
          />

          <div
            v-else-if="previewFileKind === 'image' && previewUrl"
            class="bg-background flex h-[82vh] items-center justify-center p-4"
          >
            <img
              :src="previewUrl"
              :alt="previewFileName || 'preview-document'"
              class="max-h-full max-w-full object-contain"
            />
          </div>

          <div
            v-else
            class="text-muted-foreground flex h-[82vh] items-center justify-center px-6 text-center text-sm"
          >
            ไฟล์ประเภทนี้ยังไม่รองรับการแสดงตัวอย่างในหน้าเว็บ กรุณาเปิดในแท็บใหม่
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </MainLayout>
</template>

<style scoped></style>
