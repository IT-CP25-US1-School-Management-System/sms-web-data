<script setup lang="ts">
import ConfirmModal from '@/components/ConfirmModal.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import CreateForm from '@/components/form/CreateForm.vue'
import { DATASET_DELETE, DATASET_EDIT, DATASET_GET, DOCUMENT_DELETE, DOCUMENT_EDIT } from '@/lib/constants'
import { formatDateInput, generateUUID } from '@/lib/helpers'
import { useAuthStore } from '@/stores/auth'
import { createFileDocument, deleteFileDocument, getFileDocumentRows } from '@/stores/document'
import { createDatasetRow, deleteDatasetRow, getDatasetRows, updateDatasetRow } from '@/stores/dataset'
import type { CreateFileDocumentParams, FileDocument } from '@/types/document'
import type { DocumentLink } from '@/types/document_request'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'

type DocumentLinkRow = DocumentLink & { id?: string }
type ExistingInnovationFile = { name: string; size: number; type?: string; resource_id: string; url?: string; existing: true; document_link_id?: string }
type InnovationFileItem = File | ExistingInnovationFile
type InnovationRow = Record<string, any> & { id?: string; person_id?: string; document_links?: DocumentLinkRow[] }
type InnovationFormValue = InnovationRow & { 'photo-file'?: InnovationFileItem[]; 'certificate-file'?: InnovationFileItem[] }
type CreateFormField = { name: string; label?: string; type: 'text' | 'date' | 'date-range' | 'select' | 'number' | 'email' | 'textarea' | 'file'; placeholder?: string; required?: boolean; disabled?: boolean; isShow?: boolean; options?: { label: string; value: any }[]; accept?: string; multiple?: boolean }
type CreateFormSection = { topic?: string; content: CreateFormField[]; subFields?: CreateFormField[] }

const INNOVATION_GET_VIEW = 'innovations_get'
const INNOVATION_EDIT_VIEW = 'innovations_update'
const INNOVATION_ENTITY_TABLE = 'profession-license'
const INNOVATION_FILE_FIELDS = ['photo-file', 'certificate-file'] as const
const INNOVATION_DATE_FIELDS = ['start_date', 'end_date'] as const

const DATASET_CONFIG = { DATASET_ID: DATASET_EDIT.DATASET_ID, DATASET_VERSION: DATASET_EDIT.DATASET_VERSION_INNOVATIONS, VIEW_NAME: INNOVATION_EDIT_VIEW } as const
const DELETE_CONFIG = { DATASET_ID: DATASET_DELETE.DATASET_ID, DATASET_VERSION: DATASET_DELETE.DATASET_VERSION_INNOVATIONS } as const
const DOCUMENT_CREATE_CONFIG = { DATASET_ID: DOCUMENT_EDIT.DATASET_ID, DATASET_VERSION: DOCUMENT_EDIT.DATASET_VERSION_DOCUMENT_LINK, VIEW_NAME: 'file_view' } as const
const DOCUMENT_DELETE_CONFIG = { DATASET_ID: DOCUMENT_DELETE.DATASET_ID, DATASET_VERSION: DOCUMENT_DELETE.DATASET_VERSION } as const

const authStore = useAuthStore()

const loading = ref(false)
const busyEntries = ref<Record<number, 'save' | 'delete'>>({})
const innovationData = ref<InnovationFormValue[]>([])
const documentLinksByInnovation = ref<Record<string, DocumentLinkRow[]>>({})
const formRenderKey = ref(0)

const confirmModal = ref(false)
const action = ref('update')
const modalTopic = ref('ผลงานและนวัตกรรม')
const modalValue = ref('')
const pendingAction = ref<
  | { type: 'save'; index: number; values: InnovationFormValue }
  | { type: 'delete'; index: number; recordId?: string; values?: InnovationFormValue }
  | null
>(null)

const innovationFields: CreateFormSection[][] = [[
  {
    topic: 'ข้อมูลพื้นฐาน',
    content: [
      { name: 'academic-year', label: 'ปีการศึกษา', type: 'text', required: true, isShow: true, placeholder: '' },
      { name: 'course-title', label: 'หลักสูตร / เรื่อง / หัวข้อ', type: 'text', required: true, isShow: true, placeholder: '' },
      { name: 'start_date', label: 'วันเริ่มต้น', type: 'date', required: true, placeholder: 'วว / ดด / ปปปป' },
      { name: 'end_date', label: 'วันสิ้นสุด', type: 'date', required: true, placeholder: 'วว / ดด / ปปปป' },
      { name: 'organizer', label: 'หน่วยงานที่จัด', type: 'text', required: true, placeholder: '' },
      { name: 'location', label: 'สถานที่จัด', type: 'text', placeholder: '' },
    ],
  },
  {
    topic: 'ข้อมูลผลงาน',
    content: [
      { name: 'award', label: 'รางวัล', type: 'text', required: true, placeholder: '' },
      { name: 'achievement-level', label: 'ผลงานระดับ', type: 'text', required: true, placeholder: '' },
    ],
  },
  {
    topic: 'ข้อมูลนักเรียนผู้เข้าร่วม',
    content: [],
    subFields: [
      { name: 'student-name', label: 'ชื่อนักเรียน', type: 'text', required: true, placeholder: '' },
      { name: 'class-level', label: 'ชั้น', type: 'text', required: true, placeholder: '' },
      { name: 'room', label: 'ห้อง', type: 'text', required: true, placeholder: '' },
    ],
  },
  {
    topic: 'ข้อมูลผู้ครูที่ดูแล',
    content: [
      { name: 'teacher-name', label: 'ครูผู้ดูแล', type: 'text', required: true, placeholder: '' },
      { name: 'learning-group', label: 'กลุ่มสาระการเรียนรู้', type: 'text', required: true, placeholder: '' },
      { name: 'photo-file', label: 'แนบภาพ', type: 'file', accept: '.jpg,.jpeg,.png', multiple: true ,required: true},
      { name: 'certificate-file', label: 'แนบเกียรติบัตร', type: 'file', accept: '.pdf,.jpg,.png', multiple: true ,required: true },
    ],
  },
]]

function getCurrentUserName() {
  return authStore.user?.name || authStore.user?.given_name || authStore.user?.email || 'current-user'
}

function normalizeInnovationFiles(value: unknown): InnovationFileItem[] {
  if (!value) return []
  if (Array.isArray(value)) return value as InnovationFileItem[]
  return [value as InnovationFileItem]
}

function isExistingInnovationFile(file: InnovationFileItem): file is ExistingInnovationFile {
  return 'resource_id' in file && typeof file.resource_id === 'string'
}

function buildInnovationPurpose(values: Partial<InnovationRow>, fileField?: string) {
  const basePurpose = `${values.license_type || 'license'}_${values.license_no || 'unknown'}`
  return fileField ? `${basePurpose}_${fileField}` : basePurpose
}

function matchesInnovationFileField(link: DocumentLinkRow, fileField: string) {
  if (!link.purpose) return fileField === INNOVATION_FILE_FIELDS[0]
  if (link.purpose.endsWith(`_${fileField}`)) return true
  return false
}

function formatInnovationRecord(record: InnovationRow) {
  return {
    ...record,
    ...Object.fromEntries(
      INNOVATION_DATE_FIELDS.map((field) => [field, record[field] ? formatDateInput(record[field]) : null]),
    ),
  }
}

function buildInnovationPayload(values: InnovationFormValue, currentRecord?: InnovationRow, personId?: string) {
  const payload = { ...values }
  for (const fileField of INNOVATION_FILE_FIELDS) delete payload[fileField]
  return {
    ...currentRecord,
    ...payload,
    id: currentRecord?.id || values.id || generateUUID(),
    person_id: personId || currentRecord?.person_id || values.person_id || '',
    start_date: values.start_date ? formatDateInput(values.start_date) : null,
    end_date: values.end_date ? formatDateInput(values.end_date) : null,
    created_at: currentRecord?.created_at || new Date().toISOString(),
    updated_at: currentRecord?.id ? new Date().toISOString() : null,
  }
}

function resolveInnovationPersonId(values: InnovationFormValue, currentRecord?: InnovationRow) {
  return (
    currentRecord?.person_id ||
    values.person_id ||
    innovationData.value.find((record) => record.person_id)?.person_id ||
    ''
  )
}

function extractInnovationResponse(data: unknown) {
  if (!Array.isArray(data)) return { records: [] as InnovationRow[], allDocumentLinks: [] as DocumentLinkRow[] }
  const source = Array.isArray(data[0]) ? data[0] : data
  const records = (source as InnovationRow[]) || []
  const allDocumentLinks = records.flatMap((record) => (record.document_links || []) as DocumentLinkRow[])
  return {
    records,
    allDocumentLinks: Array.from(
      new Map(allDocumentLinks.map((link) => [link.id || `${link.entity_id}-${link.document_key}-${link.created_at}`, link])).values(),
    ),
  }
}

function createExistingInnovationFile(file: FileDocument, link?: DocumentLinkRow): ExistingInnovationFile {
  return { name: file.original_filename, size: file.size, type: file.content_type, resource_id: file.resource_id, url: file.url, existing: true, document_link_id: link?.id }
}

async function getInnovationFiles(record: InnovationRow, documentLinks: DocumentLinkRow[], fileField: string) {
  const matchedLinks = documentLinks.filter((link) => link.entity_id === record.id && Boolean(link.document_key) && matchesInnovationFileField(link, fileField))
  if (!matchedLinks.length) return []

  const results = await Promise.allSettled(
    matchedLinks.map(async (link) => {
      const response = await getFileDocumentRows<FileDocument>(link.document_key)
      return createExistingInnovationFile(response.data, link)
    }),
  )

  return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
}

async function getInnovationData() {
  loading.value = true
  try {
    const response = await getDatasetRows<InnovationRow>(DATASET_GET.DATASET_ID, DATASET_GET.DATASET_VERSION, {
      view: INNOVATION_GET_VIEW,
      page: 1,
      per_page: 50,
    })

    const { records, allDocumentLinks } = extractInnovationResponse(response.data)

    documentLinksByInnovation.value = Object.fromEntries(
      records.filter((record) => Boolean(record.id)).map((record) => [
        record.id as string,
        allDocumentLinks.filter((link) => link.entity_id === record.id),
      ]),
    )

    innovationData.value = await Promise.all(
      records.map(async (record) => ({
        ...formatInnovationRecord(record),
        'photo-file': await getInnovationFiles(record, documentLinksByInnovation.value[record.id || ''] || [], 'photo-file'),
        'certificate-file': await getInnovationFiles(record, documentLinksByInnovation.value[record.id || ''] || [], 'certificate-file'),
      })),
    )

    formRenderKey.value += 1
  } catch (error: any) {
    console.error('Innovation API Error:', error)
    toast.error(`โหลดข้อมูลผลงานและนวัตกรรมไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, { position: 'bottom-right' })
    innovationData.value = []
    documentLinksByInnovation.value = {}
    formRenderKey.value += 1
  } finally {
    loading.value = false
  }
}

async function uploadInnovationFiles(files: File[]) {
  if (!files.length) return []
  const params: CreateFileDocumentParams = { path: 'file-req', folder: 'file', uploaded_by: getCurrentUserName(), description: 'ผลงานและนวัตกรรม' }
  const uploadedKeys: string[] = []
  for (const file of files) {
    const response = await createFileDocument<FileDocument>(file, params)
    if (!response.data?.resource_id) throw new Error('อัปโหลดไฟล์ไม่สำเร็จ')
    uploadedKeys.push(response.data.resource_id)
  }
  return uploadedKeys
}

async function deleteInnovationFiles(documentKeys: string[]) {
  for (const documentKey of documentKeys) {
    try {
      await deleteFileDocument<FileDocument>(documentKey)
    } catch (error: any) {
      if (error?.response?.status === 404) continue
      throw error
    }
  }
}

async function createInnovationData(payload: Record<string, any>) {
  return createDatasetRow<InnovationRow>(DATASET_CONFIG.DATASET_ID, DATASET_CONFIG.DATASET_VERSION, payload, DATASET_CONFIG.VIEW_NAME)
}

async function updateInnovationData(recordId: string, payload: Record<string, any>) {
  return updateDatasetRow<InnovationRow>(DATASET_CONFIG.DATASET_ID, DATASET_CONFIG.DATASET_VERSION, recordId, payload, DATASET_CONFIG.VIEW_NAME)
}

async function deleteInnovationData(recordId: string) {
  return deleteDatasetRow(DELETE_CONFIG.DATASET_ID, DELETE_CONFIG.DATASET_VERSION, recordId)
}

async function storeInnovationFiles(documentIds: string[], record: InnovationRow, fileField: string) {
  const createdLinks: DocumentLinkRow[] = []
  for (const documentId of documentIds) {
    const response = await createDatasetRow<DocumentLinkRow>(
      DOCUMENT_CREATE_CONFIG.DATASET_ID,
      DOCUMENT_CREATE_CONFIG.DATASET_VERSION,
      {
        document_key: documentId,
        entity_table: INNOVATION_ENTITY_TABLE,
        entity_id: record.id || '',
        purpose: buildInnovationPurpose(record, fileField),
        person_id: record.person_id || '',
        created_at: new Date().toISOString(),
      },
      DOCUMENT_CREATE_CONFIG.VIEW_NAME,
    )
    createdLinks.push(response.data)
  }
  return createdLinks
}

async function deleteInnovationDocumentLinks(documentLinks: DocumentLinkRow[]) {
  for (const link of documentLinks) {
    const documentLinkKey = link.id || link.document_key
    if (!documentLinkKey) continue
    await deleteDatasetRow(DOCUMENT_DELETE_CONFIG.DATASET_ID, DOCUMENT_DELETE_CONFIG.DATASET_VERSION, documentLinkKey)
  }
}

async function persistInnovation(index: number, values: InnovationFormValue) {
  const currentRecord = innovationData.value[index]
  const personId = resolveInnovationPersonId(values, currentRecord)
  const payload = buildInnovationPayload(values, currentRecord, personId)
  const currentLinks = currentRecord?.id ? documentLinksByInnovation.value[currentRecord.id] || [] : []

  const removedLinks = INNOVATION_FILE_FIELDS.flatMap((fileField) => {
    const currentFiles = normalizeInnovationFiles(values[fileField])
    const existingFiles = currentFiles.filter(isExistingInnovationFile)
    const keptDocumentKeys = new Set(existingFiles.map((file) => file.resource_id))
    return currentLinks
      .filter((link) => matchesInnovationFileField(link, fileField))
      .filter((link) => !keptDocumentKeys.has(link.document_key))
  })

  const newFilesByField = Object.fromEntries(
    INNOVATION_FILE_FIELDS.map((fileField) => [fileField, normalizeInnovationFiles(values[fileField]).filter((file): file is File => file instanceof File)]),
  ) as Record<(typeof INNOVATION_FILE_FIELDS)[number], File[]>

  const hasFileChanges = removedLinks.length > 0 || INNOVATION_FILE_FIELDS.some((fileField) => newFilesByField[fileField].length > 0)

  let createdRecordId = ''
  let uploadedDocumentKeys: string[] = []
  let createdDocumentLinks: DocumentLinkRow[] = []

  try {
    if (!currentRecord?.id) {
      const createdRecord = await createInnovationData(payload)
      createdRecordId = createdRecord.data?.id || ''

      for (const fileField of INNOVATION_FILE_FIELDS) {
        const uploadedKeys = await uploadInnovationFiles(newFilesByField[fileField])
        uploadedDocumentKeys.push(...uploadedKeys)
        if (uploadedKeys.length) {
          createdDocumentLinks.push(...(await storeInnovationFiles(uploadedKeys, { ...createdRecord.data, ...payload, id: createdRecordId }, fileField)))
        }
      }

      toast.success('บันทึกข้อมูลผลงานและนวัตกรรมสำเร็จ', { position: 'bottom-right' })
      await getInnovationData()
      return
    }

    if (!hasFileChanges) {
      await updateInnovationData(currentRecord.id, payload)
      toast.success('บันทึกข้อมูลผลงานและนวัตกรรมสำเร็จ', { position: 'bottom-right' })
      await getInnovationData()
      return
    }

    for (const fileField of INNOVATION_FILE_FIELDS) {
      const uploadedKeys = await uploadInnovationFiles(newFilesByField[fileField])
      uploadedDocumentKeys.push(...uploadedKeys)
      if (uploadedKeys.length) {
        createdDocumentLinks.push(...(await storeInnovationFiles(uploadedKeys, { ...currentRecord, ...payload, id: currentRecord.id }, fileField)))
      }
    }

    await updateInnovationData(currentRecord.id, payload)

    if (removedLinks.length) {
      await deleteInnovationDocumentLinks(removedLinks)
      await deleteInnovationFiles(removedLinks.map((link) => link.document_key))
    }

    toast.success('บันทึกข้อมูลผลงานและนวัตกรรมสำเร็จ', { position: 'bottom-right' })
    await getInnovationData()
  } catch (error: any) {
    if (createdDocumentLinks.length) {
      try {
        await deleteInnovationDocumentLinks(createdDocumentLinks)
      } catch (rollbackError) {
        console.error('Innovation link rollback error:', rollbackError)
      }
    }

    if (uploadedDocumentKeys.length) {
      try {
        await deleteInnovationFiles(uploadedDocumentKeys)
      } catch (rollbackError) {
        console.error('Innovation file rollback error:', rollbackError)
      }
    }

    if (createdRecordId) {
      try {
        await deleteInnovationData(createdRecordId)
      } catch (rollbackError) {
        console.error('Innovation dataset rollback error:', rollbackError)
      }
    }

    console.error('Innovation Save Error:', error)
    toast.error(`บันทึกข้อมูลผลงานและนวัตกรรมไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, { position: 'bottom-right' })
  }
}

function handleSave(index: number, values: Record<string, any>) {
  if (busyEntries.value[index]) return
  pendingAction.value = { type: 'save', index, values: values as InnovationFormValue }
  action.value = innovationData.value[index]?.id ? 'update' : 'add'
  modalValue.value = `ผลงานและนวัตกรรม ${values['course-title'] || ''}`
  confirmModal.value = true
}

async function deleteInnovationWithFiles(recordId?: string, currentRecord?: InnovationFormValue) {
  try {
    if (!recordId || !currentRecord?.id) {
      toast.success('ลบข้อมูลผลงานและนวัตกรรมสำเร็จ', { position: 'bottom-right' })
      await getInnovationData()
      return
    }

    const currentLinks = documentLinksByInnovation.value[currentRecord.id] || []
    if (currentLinks.length) {
      await deleteInnovationDocumentLinks(currentLinks)
      await deleteInnovationFiles(currentLinks.map((link) => link.document_key))
    }

    await deleteInnovationData(recordId)
    toast.success('ลบข้อมูลผลงานและนวัตกรรมสำเร็จ', { position: 'bottom-right' })
    await getInnovationData()
  } catch (error: any) {
    console.error('Innovation Delete Error:', error)
    toast.error(`ลบข้อมูลผลงานและนวัตกรรมไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, { position: 'bottom-right' })
    await getInnovationData()
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
      await persistInnovation(currentAction.index, currentAction.values)
      return
    }

    await deleteInnovationWithFiles(currentAction.recordId, currentAction.values)
  } finally {
    const { [currentAction.index]: _busyEntry, ...restBusyEntries } = busyEntries.value
    busyEntries.value = restBusyEntries
  }
}

function handleDelete(index: number, recordId?: string) {
  if (busyEntries.value[index]) return
  pendingAction.value = { type: 'delete', index, recordId, values: innovationData.value[index] }
  action.value = 'delete'
  modalValue.value = `ผลงานและนวัตกรรม ${innovationData.value[index]?.['course-title'] || ''}`
  confirmModal.value = true
}

onMounted(() => {
  getInnovationData()
})
</script>

<template>
  <div v-if="loading" class="flex-1 space-y-4 overflow-y-auto px-4 sm:px-6">
    <SkeletonCard />
  </div>

  <div v-else class="mx-6 flex flex-col gap-4 pb-6">
    <CreateForm
      :key="formRenderKey"
      :busyEntries="busyEntries"
      :isDropdown="true"
      :canDelete="true"
      :values="innovationData"
      :fields="innovationFields"
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
