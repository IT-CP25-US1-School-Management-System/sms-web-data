<script setup lang="ts">
import ConfirmModal from '@/components/ConfirmModal.vue'
import CreateForm from '@/components/form/CreateForm.vue'
import { DATASET_DELETE, DATASET_EDIT, DATASET_GET, DOCUMENT_DELETE, DOCUMENT_EDIT } from '@/lib/constants'
import { formatDateInput, generateUUID } from '@/lib/helpers'
import { useAuthStore } from '@/stores/auth'
import { useTeacherStore } from '@/stores/teachers'
import { createFileDocument, deleteFileDocument, getFileDocumentRows } from '@/stores/document'
import { createDatasetRow, deleteDatasetRow, getDatasetRows, updateDatasetRow } from '@/stores/dataset'
import type { CreateFileDocumentParams, FileDocument } from '@/types/document'
import type { DocumentLink } from '@/types/document_request'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'

type DocumentLinkRow = DocumentLink & { id?: string }
type ExistingRoyalFile = { name: string; size: number; type?: string; resource_id: string; url?: string; existing: true; document_link_id?: string }
type RoyalFileItem = File | ExistingRoyalFile
type RoyalDecorationRow = Record<string, any> & { id?: string; person_id?: string; document_links?: DocumentLinkRow[] }
type RoyalDecorationFormValue = RoyalDecorationRow & { 'announcement-file'?: RoyalFileItem[] }
type CreateFormField = { name: string; label?: string; type: 'text' | 'date' | 'date-range' | 'select' | 'number' | 'email' | 'textarea' | 'file'; placeholder?: string; required?: boolean; disabled?: boolean; isShow?: boolean; options?: { label: string; value: any }[]; accept?: string; multiple?: boolean }
type CreateFormSection = { topic?: string; content: CreateFormField[] }

const GET_VIEW = 'decorations_get'
const EDIT_VIEW = 'decorations_update'
const ENTITY_TABLE = 'decorations'
const FILE_FIELD = 'announcement-file'

const DATASET_CONFIG = { DATASET_ID: DATASET_EDIT.DATASET_ID, DATASET_VERSION: DATASET_EDIT.DATASET_VERSION_LICENSE, VIEW_NAME: EDIT_VIEW } as const
const DELETE_CONFIG = { DATASET_ID: DATASET_DELETE.DATASET_ID, DATASET_VERSION: DATASET_DELETE.DATASET_VERSION_LICENSE } as const
const DOCUMENT_CREATE_CONFIG = { DATASET_ID: DOCUMENT_EDIT.DATASET_ID, DATASET_VERSION: DOCUMENT_EDIT.DATASET_VERSION_DOCUMENT_LINK, VIEW_NAME: 'file_view' } as const
const DOCUMENT_DELETE_CONFIG = { DATASET_ID: DOCUMENT_DELETE.DATASET_ID, DATASET_VERSION: DOCUMENT_DELETE.DATASET_VERSION } as const

const route = useRoute()
const teacherStore = useTeacherStore()
const authStore = useAuthStore()

const loading = ref(false)
const busyEntries = ref<Record<number, 'save' | 'delete'>>({})
const royalDecorationData = ref<RoyalDecorationFormValue[]>([])
const documentLinksByDecoration = ref<Record<string, DocumentLinkRow[]>>({})
const formRenderKey = ref(0)

const confirmModal = ref(false)
const action = ref('update')
const modalTopic = ref('เครื่องราชอิสริยาภรณ์')
const modalValue = ref('')
const pendingAction = ref<
  | { type: 'save'; index: number; values: RoyalDecorationFormValue }
  | { type: 'delete'; index: number; recordId?: string; values?: RoyalDecorationFormValue }
  | null
>(null)

function getPersonId() {
  const idFromUrl = route.query.id as string | undefined
  const personId = idFromUrl || teacherStore.personId

  if (idFromUrl && teacherStore.personId !== idFromUrl) {
    teacherStore.setPersonId(idFromUrl)
  }

  return personId
}

const royalDecorationFields: CreateFormSection[][] = [[
  {
    content: [
      { name: 'gazette_publish_date', label: 'วันที่ประกาศในราชกิจจา', type: 'date', required: true, isShow: true, placeholder: 'วว / ดด / ปปปป' },
      { name: 'year', label: 'ประจำปี', type: 'text', required: true, isShow: true, placeholder: '' },
      { name: 'class', label: 'ชั้นตรา', type: 'text', required: true, placeholder: '' },
      { name: 'gazette_book_no', label: 'เล่มที่', type: 'text', required: true, placeholder: '' },
      { name: 'gazette_section', label: 'ตอนที่', type: 'text', placeholder: '' },
      { name: 'announce_date', label: 'ลงวันที่', type: 'date', required: true, placeholder: 'วว / ดด / ปปปป' },
      { name: 'gazette_page', label: 'หน้า', type: 'text', required: true, placeholder: 'กรอกหน้า' },
      { name: 'gazette_order_no', label: 'ลำดับที่', type: 'text', required: true, placeholder: 'กรอกลำดับที่' },
      { name: 'announcement-file', label: 'แนบประกาศ', type: 'file', required: true, accept: '.pdf,.jpg,.png', multiple: true },
    ],
  },
]]

function getCurrentUserName() {
  return authStore.user?.name || authStore.user?.given_name || authStore.user?.email || 'current-user'
}

function normalizeRoyalFiles(value: unknown): RoyalFileItem[] {
  if (!value) return []
  if (Array.isArray(value)) return value as RoyalFileItem[]
  return [value as RoyalFileItem]
}

function isExistingRoyalFile(file: RoyalFileItem): file is ExistingRoyalFile {
  return 'resource_id' in file && typeof file.resource_id === 'string'
}

function buildRoyalPurpose(values: Partial<RoyalDecorationRow>, fileField?: string) {
  const basePurpose = `${values.license_type || 'license'}_${values.license_no || 'unknown'}`
  return fileField ? `${basePurpose}_${fileField}` : basePurpose
}

function formatRoyalRecord(record: RoyalDecorationRow) {
  return {
    ...record,
    year: record.year != null ? String(record.year) : '',
    gazette_publish_date: record.gazette_publish_date ? formatDateInput(record.gazette_publish_date) : null,
    announce_date: record.announce_date ? formatDateInput(record.announce_date) : null,
  }
}

function buildRoyalPayload(values: RoyalDecorationFormValue, currentRecord?: RoyalDecorationRow, personId?: string) {
  const payload = { ...values }
  delete payload[FILE_FIELD]
  return {
    ...currentRecord,
    ...payload,
    id: currentRecord?.id || values.id || generateUUID(),
    person_id: personId || currentRecord?.person_id || values.person_id || '',
    year: values.year || '',
    gazette_publish_date: values.gazette_publish_date ? formatDateInput(values.gazette_publish_date) : null,
    announce_date: values.announce_date ? formatDateInput(values.announce_date) : null,
    created_at: currentRecord?.created_at || new Date().toISOString(),
    updated_at: currentRecord?.id ? new Date().toISOString() : null,
  }
}

function resolveRoyalPersonId(values: RoyalDecorationFormValue, currentRecord?: RoyalDecorationRow) {
  return getPersonId() || currentRecord?.person_id || values.person_id || royalDecorationData.value.find((record) => record.person_id)?.person_id || ''
}

function extractRoyalResponse(data: unknown) {
  if (!Array.isArray(data)) return { records: [] as RoyalDecorationRow[], allDocumentLinks: [] as DocumentLinkRow[] }
  const source = Array.isArray(data[0]) ? data[0] : data
  const records = ((source as RoyalDecorationRow[]) || []).map(formatRoyalRecord)
  const allDocumentLinks = records.flatMap((record) => (record.document_links || []) as DocumentLinkRow[])
  return {
    records,
    allDocumentLinks: Array.from(new Map(allDocumentLinks.map((link) => [link.id || `${link.entity_id}-${link.document_key}-${link.created_at}`, link])).values()),
  }
}

function createExistingRoyalFile(file: FileDocument, link?: DocumentLinkRow): ExistingRoyalFile {
  return { name: file.original_filename, size: file.size, type: file.content_type, resource_id: file.resource_id, url: file.url, existing: true, document_link_id: link?.id }
}

async function getRoyalFiles(record: RoyalDecorationRow, documentLinks: DocumentLinkRow[]) {
  const matchedLinks = documentLinks.filter((link) => link.entity_id === record.id && Boolean(link.document_key))
  if (!matchedLinks.length) return []
  const results = await Promise.allSettled(
    matchedLinks.map(async (link) => {
      const response = await getFileDocumentRows<FileDocument>(link.document_key)
      return createExistingRoyalFile(response.data, link)
    }),
  )
  return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
}

async function getRoyalDecorationData() {
  loading.value = true
  try {
    const personId = getPersonId()
    if (!personId) {
      royalDecorationData.value = []
      documentLinksByDecoration.value = {}
      formRenderKey.value += 1
      toast.error('ไม่พบข้อมูลครู กรุณาบันทึกข้อมูลส่วนบุคคลก่อน', { position: 'bottom-right' })
      return
    }

    const response = await getDatasetRows<RoyalDecorationRow>(DATASET_GET.DATASET_ID, DATASET_GET.DATASET_VERSION, {
      view: GET_VIEW,
      page: 1,
      per_page: 50,
      where: [[{
        table_name: 'decorations',
        field: 'person_id',
        operator: '=',
        value: personId,
      }]],
    })
    const { records, allDocumentLinks } = extractRoyalResponse(response.data)
    documentLinksByDecoration.value = Object.fromEntries(
      records.filter((record) => Boolean(record.id)).map((record) => [record.id as string, allDocumentLinks.filter((link) => link.entity_id === record.id)]),
    )
    royalDecorationData.value = await Promise.all(
      records.map(async (record) => ({ ...record, person_id: record.person_id || personId, 'announcement-file': await getRoyalFiles(record, documentLinksByDecoration.value[record.id || ''] || []) })),
    )
    formRenderKey.value += 1
  } catch (error: any) {
    console.error('Royal Decoration API Error:', error)
    toast.error(`โหลดข้อมูลเครื่องราชอิสริยาภรณ์ไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, { position: 'bottom-right' })
    royalDecorationData.value = []
    documentLinksByDecoration.value = {}
    formRenderKey.value += 1
  } finally {
    loading.value = false
  }
}

async function uploadRoyalFiles(files: File[]) {
  if (!files.length) return []
  const params: CreateFileDocumentParams = { path: 'file-req', folder: 'file', uploaded_by: getCurrentUserName(), description: 'เครื่องราชอิสริยาภรณ์' }
  const uploadedKeys: string[] = []
  for (const file of files) {
    const response = await createFileDocument<FileDocument>(file, params)
    if (!response.data?.resource_id) throw new Error('อัปโหลดไฟล์ไม่สำเร็จ')
    uploadedKeys.push(response.data.resource_id)
  }
  return uploadedKeys
}

async function deleteRoyalFiles(documentKeys: string[]) {
  for (const documentKey of documentKeys) {
    try {
      await deleteFileDocument<FileDocument>(documentKey)
    } catch (error: any) {
      if (error?.response?.status === 404) continue
      throw error
    }
  }
}

async function createRoyalDecorationData(payload: Record<string, any>) {
  return createDatasetRow<RoyalDecorationRow>(DATASET_CONFIG.DATASET_ID, DATASET_CONFIG.DATASET_VERSION, payload, DATASET_CONFIG.VIEW_NAME)
}

async function updateRoyalDecorationData(recordId: string, payload: Record<string, any>) {
  return updateDatasetRow<RoyalDecorationRow>(DATASET_CONFIG.DATASET_ID, DATASET_CONFIG.DATASET_VERSION, recordId, payload, DATASET_CONFIG.VIEW_NAME)
}

async function deleteRoyalDecorationData(recordId: string) {
  return deleteDatasetRow(DELETE_CONFIG.DATASET_ID, DELETE_CONFIG.DATASET_VERSION, recordId)
}

async function storeRoyalFiles(documentIds: string[], record: RoyalDecorationRow) {
  const createdLinks: DocumentLinkRow[] = []
  for (const documentId of documentIds) {
    const response = await createDatasetRow<DocumentLinkRow>(
      DOCUMENT_CREATE_CONFIG.DATASET_ID,
      DOCUMENT_CREATE_CONFIG.DATASET_VERSION,
      {
        document_key: documentId,
        entity_table: ENTITY_TABLE,
        entity_id: record.id || '',
        purpose: buildRoyalPurpose(record, FILE_FIELD),
        person_id: record.person_id || '',
        created_at: new Date().toISOString(),
      },
      DOCUMENT_CREATE_CONFIG.VIEW_NAME,
    )
    createdLinks.push(response.data)
  }
  return createdLinks
}

async function deleteRoyalDocumentLinks(documentLinks: DocumentLinkRow[]) {
  for (const link of documentLinks) {
    const documentLinkKey = link.id || link.document_key
    if (!documentLinkKey) continue
    await deleteDatasetRow(DOCUMENT_DELETE_CONFIG.DATASET_ID, DOCUMENT_DELETE_CONFIG.DATASET_VERSION, documentLinkKey)
  }
}

async function persistRoyalDecoration(index: number, values: RoyalDecorationFormValue) {
  const currentRecord = royalDecorationData.value[index]
  const personId = getPersonId() || resolveRoyalPersonId(values, currentRecord)
  if (!personId) {
    toast.error('ไม่พบข้อมูลครู กรุณาบันทึกข้อมูลส่วนบุคคลก่อน', { position: 'bottom-right' })
    return
  }
  const payload = buildRoyalPayload(values, currentRecord, personId)
  const currentFiles = normalizeRoyalFiles(values[FILE_FIELD])
  const existingFiles = currentFiles.filter(isExistingRoyalFile)
  const newFiles = currentFiles.filter((file): file is File => file instanceof File)
  const currentLinks = currentRecord?.id ? documentLinksByDecoration.value[currentRecord.id] || [] : []
  const keptDocumentKeys = new Set(existingFiles.map((file) => file.resource_id))
  const removedLinks = currentLinks.filter((link) => !keptDocumentKeys.has(link.document_key))
  const hasFileChanges = removedLinks.length > 0 || newFiles.length > 0

  let createdRecordId = ''
  let uploadedDocumentKeys: string[] = []
  let createdDocumentLinks: DocumentLinkRow[] = []

  try {
    if (!currentRecord?.id) {
      const createdRecord = await createRoyalDecorationData(payload)
      createdRecordId = createdRecord.data?.id || ''
      uploadedDocumentKeys = await uploadRoyalFiles(newFiles)
      if (uploadedDocumentKeys.length) {
        createdDocumentLinks = await storeRoyalFiles(uploadedDocumentKeys, { ...createdRecord.data, ...payload, id: createdRecordId })
      }
      toast.success('บันทึกข้อมูลเครื่องราชอิสริยาภรณ์สำเร็จ', { position: 'bottom-right' })
      await getRoyalDecorationData()
      return
    }

    if (!hasFileChanges) {
      await updateRoyalDecorationData(currentRecord.id, payload)
      toast.success('บันทึกข้อมูลเครื่องราชอิสริยาภรณ์สำเร็จ', { position: 'bottom-right' })
      await getRoyalDecorationData()
      return
    }

    if (newFiles.length) {
      uploadedDocumentKeys = await uploadRoyalFiles(newFiles)
      createdDocumentLinks = await storeRoyalFiles(uploadedDocumentKeys, { ...currentRecord, ...payload, id: currentRecord.id })
    }

    await updateRoyalDecorationData(currentRecord.id, payload)
    if (removedLinks.length) {
      await deleteRoyalDocumentLinks(removedLinks)
      await deleteRoyalFiles(removedLinks.map((link) => link.document_key))
    }

    toast.success('บันทึกข้อมูลเครื่องราชอิสริยาภรณ์สำเร็จ', { position: 'bottom-right' })
    await getRoyalDecorationData()
  } catch (error: any) {
    if (createdDocumentLinks.length) {
      try {
        await deleteRoyalDocumentLinks(createdDocumentLinks)
      } catch (rollbackError) {
        console.error('Royal link rollback error:', rollbackError)
      }
    }
    if (uploadedDocumentKeys.length) {
      try {
        await deleteRoyalFiles(uploadedDocumentKeys)
      } catch (rollbackError) {
        console.error('Royal file rollback error:', rollbackError)
      }
    }
    if (createdRecordId) {
      try {
        await deleteRoyalDecorationData(createdRecordId)
      } catch (rollbackError) {
        console.error('Royal dataset rollback error:', rollbackError)
      }
    }
    console.error('Royal Decoration Save Error:', error)
    toast.error(`บันทึกข้อมูลเครื่องราชอิสริยาภรณ์ไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, { position: 'bottom-right' })
  }
}

function handleSave(index: number, values: Record<string, any>) {
  if (busyEntries.value[index]) return
  pendingAction.value = { type: 'save', index, values: values as RoyalDecorationFormValue }
  action.value = royalDecorationData.value[index]?.id ? 'update' : 'add'
  modalValue.value = `เครื่องราชฯ ${values.class || ''} ปี ${values.year || ''}`
  confirmModal.value = true
}

async function deleteRoyalDecorationWithFiles(recordId?: string, currentRecord?: RoyalDecorationFormValue) {
  try {
    if (!recordId || !currentRecord?.id) {
      toast.success('ลบข้อมูลเครื่องราชอิสริยาภรณ์สำเร็จ', { position: 'bottom-right' })
      await getRoyalDecorationData()
      return
    }
    const currentLinks = documentLinksByDecoration.value[currentRecord.id] || []
    if (currentLinks.length) {
      await deleteRoyalDocumentLinks(currentLinks)
      await deleteRoyalFiles(currentLinks.map((link) => link.document_key))
    }
    await deleteRoyalDecorationData(recordId)
    toast.success('ลบข้อมูลเครื่องราชอิสริยาภรณ์สำเร็จ', { position: 'bottom-right' })
    await getRoyalDecorationData()
  } catch (error: any) {
    console.error('Royal Decoration Delete Error:', error)
    toast.error(`ลบข้อมูลเครื่องราชอิสริยาภรณ์ไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, { position: 'bottom-right' })
    await getRoyalDecorationData()
  }
}

async function updateData(confirmed: boolean) {
  if (!confirmed) {
    confirmModal.value = false
    pendingAction.value = null
    return
  }
  confirmModal.value = false
  if (!pendingAction.value) return
  const currentAction = pendingAction.value
  pendingAction.value = null
  busyEntries.value = { ...busyEntries.value, [currentAction.index]: currentAction.type }
  try {
    if (currentAction.type === 'save') {
      await persistRoyalDecoration(currentAction.index, currentAction.values)
      return
    }
    await deleteRoyalDecorationWithFiles(currentAction.recordId, currentAction.values)
  } finally {
    const { [currentAction.index]: _busyEntry, ...restBusyEntries } = busyEntries.value
    busyEntries.value = restBusyEntries
  }
}

function handleDelete(index: number, recordId?: string) {
  if (busyEntries.value[index]) return
  pendingAction.value = { type: 'delete', index, recordId, values: royalDecorationData.value[index] }
  action.value = 'delete'
  modalValue.value = `เครื่องราชฯ ${royalDecorationData.value[index]?.class || ''} ปี ${royalDecorationData.value[index]?.year || ''}`
  confirmModal.value = true
}

onMounted(() => {
  const idFromUrl = route.query.id as string | undefined
  if (idFromUrl && !teacherStore.personId) {
    teacherStore.setPersonId(idFromUrl)
  }

  getRoyalDecorationData()
})
</script>

<template>
  <div class="mx-6 flex flex-col gap-4 pb-6">
    <CreateForm
      :key="formRenderKey"
      :busyEntries="busyEntries"
      :canDelete="true"
      :values="royalDecorationData"
      :fields="royalDecorationFields"
      :deferCommitOnSave="true"
      :deferDeleteOnConfirm="true"
      @save="handleSave"
      @delete="handleDelete"
    />
  </div>

  <ConfirmModal
    v-if="confirmModal"
    :action="action"
    :topic="modalTopic"
    :value="modalValue"
    @confirm="updateData"
  />
</template>
