<script setup lang="ts">
import ConfirmModal from '@/components/ConfirmModal.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import CreateForm from '@/components/form/CreateForm.vue'
import {
  DATASET_DELETE,
  DATASET_EDIT,
  DATASET_GET,
  DOCUMENT_DELETE,
  DOCUMENT_EDIT,
} from '@/lib/constants'
import { formatDateInput, generateUUID } from '@/lib/helpers'
import { useAuthStore } from '@/stores/auth'
import { createFileDocument, deleteFileDocument, getFileDocumentRows } from '@/stores/document'
import {
  createDatasetRow,
  deleteDatasetRow,
  getDatasetRows,
  updateDatasetRow,
} from '@/stores/dataset'
import type { CreateFileDocumentParams, FileDocument } from '@/types/document'
import type { DocumentLink } from '@/types/document_request'
import { useTeacherStore } from '@/stores/teachers'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'

type DocumentLinkRow = DocumentLink & { id?: string }
type ExistingAcademicFile = {
  name: string
  size: number
  type?: string
  resource_id: string
  url?: string
  existing: true
  document_link_id?: string
}
type AcademicFileItem = File | ExistingAcademicFile
type AcademicRankRow = Record<string, any> & {
  id?: string
  person_id?: string
  document_links?: DocumentLinkRow[]
}
type AcademicRankFormValue = AcademicRankRow & { 'order-file'?: AcademicFileItem[] }
type CreateFormField = {
  name: string
  label?: string
  type: 'text' | 'date' | 'date-range' | 'select' | 'number' | 'email' | 'textarea' | 'file'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  isShow?: boolean
  defaultValue?: any
  options?: { label: string; value: any }[]
  accept?: string
  multiple?: boolean
}
type CreateFormSection = { topic?: string; content: CreateFormField[] }

const GET_VIEW = 'academic_get'
const EDIT_VIEW = 'academic_update'
const ENTITY_TABLE = 'academic_rank'
const FILE_FIELD = 'order-file'

const DATASET_CONFIG = {
  DATASET_ID: DATASET_EDIT.DATASET_ID,
  DATASET_VERSION: DATASET_EDIT.DATASET_VERSION_ACADEMIC_RANK,
  VIEW_NAME: EDIT_VIEW,
} as const
const DELETE_CONFIG = {
  DATASET_ID: DATASET_DELETE.DATASET_ID,
  DATASET_VERSION: DATASET_DELETE.DATASET_VERSION_ACADEMIC_RANK,
} as const
const DOCUMENT_CREATE_CONFIG = {
  DATASET_ID: DOCUMENT_EDIT.DATASET_ID,
  DATASET_VERSION: DOCUMENT_EDIT.DATASET_VERSION_DOCUMENT_LINK,
  VIEW_NAME: 'file_view',
} as const
const DOCUMENT_DELETE_CONFIG = {
  DATASET_ID: DOCUMENT_DELETE.DATASET_ID,
  DATASET_VERSION: DOCUMENT_DELETE.DATASET_VERSION,
} as const

const authStore = useAuthStore()
const teacherStore = useTeacherStore()

const loading = ref(false)
const busyEntries = ref<Record<number, 'save' | 'delete'>>({})
const academicRankData = ref<AcademicRankFormValue[]>([])
const documentLinksByAcademic = ref<Record<string, DocumentLinkRow[]>>({})
const formRenderKey = ref(0)

const confirmModal = ref(false)
const action = ref('update')
const modalTopic = ref('ประวัติวิทยฐานะ')
const modalValue = ref('')
const pendingAction = ref<
  | { type: 'save'; index: number; values: AcademicRankFormValue }
  | { type: 'delete'; index: number; recordId?: string; values?: AcademicRankFormValue }
  | null
>(null)

const academicRankFields: CreateFormSection[][] = [
  [
    {
      topic: 'ประวัติการมีวิทยฐานะ',
      content: [
        {
          name: 'order_no',
          label: 'คำสั่ง',
          type: 'text',
          required: true,
          isShow: true,
          placeholder: '',
        },
        {
          name: 'criteria',
          label: 'หลักเกณฑ์การได้รับวิทยฐานะ ',
          type: 'select',
          required: true,
          isShow: true,
          placeholder: '',
          options: [
            { label: 'ว13', value: 'ว13' },
            { label: 'ว17', value: 'ว17' },
            { label: 'ว21', value: 'ว21' },
          ],
        },
        {
          name: 'position_rank',
          label: 'ตำแหน่งที่ได้รับวิทยฐานะ',
          type: 'select',
          required: true,
          isShow: true,
          placeholder: 'เลือกตำแหน่ง',
          options: [
            { label: 'ครู', value: 'ครู' },
            { label: 'รองผู้บริหาร', value: 'รองผู้บริหาร' },
            { label: 'ผู้บริหาร', value: 'ผู้บริหาร' },
          ],
        },
        {
          name: 'ranking_type',
          label: 'วิทยฐานะ',
          type: 'select',
          required: true,
          placeholder: 'เลือกวิทยฐานะ',
          options: [
            { label: 'ชำนาญการ', value: 'ชำนาญการ' },
            { label: 'ชำนาญการพิเศษ', value: 'ชำนาญการพิเศษ' },
            { label: 'เชี่ยวชาญ', value: 'เชี่ยวชาญ' },
            { label: 'เชี่ยวชาญพิเศษ', value: 'เชี่ยวชาญพิเศษ' },
            // { label: 'รองผู้อำนวยชำนาญการพิเศษ', value: 'รองผู้อำนวยชำนาญการพิเศษ' },
            // { label: 'รองผู้อำนวยเชี่ยวชาญ', value: 'รองผู้อำนวยเชี่ยวชาญ' },
            // { label: 'ผู้อำนวยชำนาญการ', value: 'ผู้อำนวยชำนาญการ' },
            // { label: 'ผู้อำนวยชำนาญการพิเศษ', value: 'ผู้อำนวยชำนาญการพิเศษ' },
            // { label: 'ผู้อำนวยเชี่ยวชาญ', value: 'ผู้อำนวยเชี่ยวชาญ' },
          ],
        },
        {
          name: 'awarded_date',
          label: 'วันที่ได้รับวิทยฐานะ',
          type: 'date',
          required: true,
          placeholder: 'วว / ดด / ปปปป',
        },
        {
          name: FILE_FIELD,
          label: 'แนบคำสั่ง',
          type: 'file',
          required: true,
          accept: '.pdf,.jpg,.png',
          multiple: true,
        },
      ],
    },
    {
      topic: 'เงินเดือน',
      content: [
        { name: 'reward', label: 'เงินค่าตอบแทน', type: 'number', placeholder: '' },
        {
          name: 'special_reward',
          label: 'เงินค่าตอบแทนพิเศษกรณีเต็มขั้น',
          type: 'number',
          placeholder: '',
          defaultValue: 0,
        },
        { name: 'position_reward', label: 'เงินประจำตำแหน่ง', type: 'number', placeholder: '' },
        {
          name: 'special-compensation',
          label: 'เงินค่าตอบแทนพิเศษ',
          type: 'number',
          placeholder: '',
        },
      ],
    },
  ],
]

function getCurrentUserName() {
  return (
    authStore.user?.name || authStore.user?.given_name || authStore.user?.email || 'current-user'
  )
}

function normalizeAcademicFiles(value: unknown): AcademicFileItem[] {
  if (!value) return []
  if (Array.isArray(value)) return value as AcademicFileItem[]
  return [value as AcademicFileItem]
}

function isExistingAcademicFile(file: AcademicFileItem): file is ExistingAcademicFile {
  return 'resource_id' in file && typeof file.resource_id === 'string'
}

function buildAcademicPurpose(values: Partial<AcademicRankRow>, fileField?: string) {
  const basePurpose = `${values.license_type || 'license'}_${values.license_no || 'unknown'}`
  return fileField ? `${basePurpose}_${fileField}` : basePurpose
}

function getPositionRewardByRankingType(positionRank: string, rankingType: string) {
  if (positionRank !== 'ครู') return 0
  if (!rankingType) return 0
  if (rankingType.includes('ชำนาญการพิเศษ')) return 5600
  if (rankingType.includes('เชี่ยวชาญพิเศษ')) return 13000
  if (rankingType.includes('เชี่ยวชาญ')) return 9900
  if (rankingType.includes('ชำนาญการ')) return 3500
  return 0
}

function getSpecialCompensationByRankingType(rankingType: string) {
  if (!rankingType) return 0
  if (rankingType.includes('ชำนาญการพิเศษ')) return 5600
  if (rankingType.includes('เชี่ยวชาญพิเศษ')) {
    if (rankingType.includes('ผู้อำนวย') || rankingType.includes('รองผู้อำนวย')) return 15600
    return 13000
  }
  if (rankingType.includes('เชี่ยวชาญ')) return 9900
  return 0
}

function applyAcademicDefaults(
  values: AcademicRankFormValue,
  previousValues?: AcademicRankFormValue,
): AcademicRankFormValue {
  const nextValues = { ...values }

  if (
    nextValues.special_reward === '' ||
    nextValues.special_reward === null ||
    nextValues.special_reward === undefined
  ) {
    nextValues.special_reward = 0
  }

  if (
    nextValues.ranking_type !== previousValues?.ranking_type ||
    nextValues.position_rank !== previousValues?.position_rank
  ) {
    const positionReward = getPositionRewardByRankingType(
      String(nextValues.position_rank || ''),
      String(nextValues.ranking_type || ''),
    )
    const specialCompensation = getSpecialCompensationByRankingType(
      String(nextValues.ranking_type || ''),
    )

    nextValues.position_reward = positionReward
    nextValues['special-compensation'] = specialCompensation
  }

  return nextValues
}

function formatAcademicRecord(record: AcademicRankRow) {
  return {
    ...record,
    awarded_date: record.awarded_date ? formatDateInput(record.awarded_date) : null,
    approval_date: record.approval_date ? formatDateInput(record.approval_date) : null,
    special_reward:
      record.special_reward === '' ||
      record.special_reward === null ||
      record.special_reward === undefined
        ? 0
        : record.special_reward,
  }
}

function buildAcademicPayload(
  values: AcademicRankFormValue,
  currentRecord?: AcademicRankRow,
  personId?: string,
) {
  const payload = { ...values }
  delete payload[FILE_FIELD]

  const toNullableNumber = (value: unknown) => {
    if (value === '' || value === null || value === undefined) return null
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  return {
    ...currentRecord,
    ...payload,
    id: currentRecord?.id || values.id || generateUUID(),
    person_id: teacherStore.personId || personId || '',
    awarded_date: values.awarded_date ? formatDateInput(values.awarded_date) : null,
    approval_date: values.approval_date ? formatDateInput(values.approval_date) : null,
    reward: toNullableNumber(values.reward),
    special_reward: toNullableNumber(values.special_reward),
    position_reward: toNullableNumber(values.position_reward),
    'special-compensation': toNullableNumber(values['special-compensation']),
    created_at: currentRecord?.created_at || new Date().toISOString(),
    updated_at: currentRecord?.id ? new Date().toISOString() : null,
  }
}

function resolveAcademicPersonId(values: AcademicRankFormValue, currentRecord?: AcademicRankRow) {
  return teacherStore.personId || currentRecord?.person_id || values.person_id || ''
}

function extractAcademicResponse(data: unknown) {
  if (!Array.isArray(data))
    return { records: [] as AcademicRankRow[], allDocumentLinks: [] as DocumentLinkRow[] }
  const source = Array.isArray(data[0]) ? data[0] : data
  const records = ((source as AcademicRankRow[]) || []).map(formatAcademicRecord)
  const allDocumentLinks = records.flatMap(
    (record) => (record.document_links || []) as DocumentLinkRow[],
  )
  return {
    records,
    allDocumentLinks: Array.from(
      new Map(
        allDocumentLinks.map((link) => [
          link.id || `${link.entity_id}-${link.document_key}-${link.created_at}`,
          link,
        ]),
      ).values(),
    ),
  }
}

function createExistingAcademicFile(
  file: FileDocument,
  link?: DocumentLinkRow,
): ExistingAcademicFile {
  return {
    name: file.original_filename,
    size: file.size,
    type: file.content_type,
    resource_id: file.resource_id,
    url: file.url,
    existing: true,
    document_link_id: link?.id,
  }
}

async function getAcademicFiles(record: AcademicRankRow, documentLinks: DocumentLinkRow[]) {
  const matchedLinks = documentLinks.filter(
    (link) => link.entity_id === record.id && Boolean(link.document_key),
  )
  if (!matchedLinks.length) return []
  const results = await Promise.allSettled(
    matchedLinks.map(async (link) => {
      const response = await getFileDocumentRows<FileDocument>(link.document_key)
      return createExistingAcademicFile(response.data, link)
    }),
  )
  return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
}

async function getAcademicRankData() {
  loading.value = true
  try {
    const response = await getDatasetRows<AcademicRankRow>(
      DATASET_GET.DATASET_ID,
      DATASET_GET.DATASET_VERSION_ACADEMIC_RANK,
      { view: GET_VIEW, page: 1, per_page: 50 },
    )
    const { records, allDocumentLinks } = extractAcademicResponse(response.data)

    documentLinksByAcademic.value = Object.fromEntries(
      records
        .filter((record) => Boolean(record.id))
        .map((record) => [
          record.id as string,
          allDocumentLinks.filter((link) => link.entity_id === record.id),
        ]),
    )

    academicRankData.value = await Promise.all(
      records.map(async (record) => ({
        ...record,
        'order-file': await getAcademicFiles(
          record,
          documentLinksByAcademic.value[record.id || ''] || [],
        ),
      })),
    )

    formRenderKey.value += 1
  } catch (error: any) {
    console.error('Academic Rank API Error:', error)
    toast.error(
      `โหลดข้อมูลประวัติวิทยฐานะไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      { position: 'bottom-right' },
    )
    academicRankData.value = []
    documentLinksByAcademic.value = {}
    formRenderKey.value += 1
  } finally {
    loading.value = false
  }
}

async function uploadAcademicFiles(files: File[]) {
  if (!files.length) return []
  const params: CreateFileDocumentParams = {
    path: 'file-req',
    folder: 'file',
    uploaded_by: getCurrentUserName(),
    description: 'ประวัติวิทยฐานะ',
  }
  const uploadedKeys: string[] = []
  for (const file of files) {
    const response = await createFileDocument<FileDocument>(file, params)
    if (!response.data?.resource_id) throw new Error('อัปโหลดไฟล์ไม่สำเร็จ')
    uploadedKeys.push(response.data.resource_id)
  }
  return uploadedKeys
}

async function deleteAcademicFiles(documentKeys: string[]) {
  for (const documentKey of documentKeys) {
    try {
      await deleteFileDocument<FileDocument>(documentKey)
    } catch (error: any) {
      if (error?.response?.status === 404) continue
      throw error
    }
  }
}

async function createAcademicRankData(payload: Record<string, any>) {
  return createDatasetRow<AcademicRankRow>(
    DATASET_CONFIG.DATASET_ID,
    DATASET_CONFIG.DATASET_VERSION,
    payload,
    DATASET_CONFIG.VIEW_NAME,
  )
}

async function updateAcademicRankData(recordId: string, payload: Record<string, any>) {
  return updateDatasetRow<AcademicRankRow>(
    DATASET_CONFIG.DATASET_ID,
    DATASET_CONFIG.DATASET_VERSION,
    recordId,
    payload,
    DATASET_CONFIG.VIEW_NAME,
  )
}

async function deleteAcademicRankData(recordId: string) {
  return deleteDatasetRow(DELETE_CONFIG.DATASET_ID, DELETE_CONFIG.DATASET_VERSION, recordId)
}

async function storeAcademicFiles(documentIds: string[], record: AcademicRankRow) {
  const createdLinks: DocumentLinkRow[] = []
  for (const documentId of documentIds) {
    const response = await createDatasetRow<DocumentLinkRow>(
      DOCUMENT_CREATE_CONFIG.DATASET_ID,
      DOCUMENT_CREATE_CONFIG.DATASET_VERSION,
      {
        document_key: documentId,
        entity_table: ENTITY_TABLE,
        entity_id: record.id || '',
        purpose: buildAcademicPurpose(record, FILE_FIELD),
        person_id: teacherStore.personId || record.person_id || '',
        created_at: new Date().toISOString(),
      },
      DOCUMENT_CREATE_CONFIG.VIEW_NAME,
    )
    createdLinks.push(response.data)
  }
  return createdLinks
}

async function deleteAcademicDocumentLinks(documentLinks: DocumentLinkRow[]) {
  for (const link of documentLinks) {
    const documentLinkKey = link.id || link.document_key
    if (!documentLinkKey) continue
    await deleteDatasetRow(
      DOCUMENT_DELETE_CONFIG.DATASET_ID,
      DOCUMENT_DELETE_CONFIG.DATASET_VERSION,
      documentLinkKey,
    )
  }
}

async function persistAcademicRank(index: number, values: AcademicRankFormValue) {
  const currentRecord = academicRankData.value[index]
  const personId = resolveAcademicPersonId(values, currentRecord)
  const payload = buildAcademicPayload(values, currentRecord, personId)
  const currentFiles = normalizeAcademicFiles(values[FILE_FIELD])
  const existingFiles = currentFiles.filter(isExistingAcademicFile)
  const newFiles = currentFiles.filter((file): file is File => file instanceof File)
  const currentLinks = currentRecord?.id
    ? documentLinksByAcademic.value[currentRecord.id] || []
    : []
  const keptDocumentKeys = new Set(existingFiles.map((file) => file.resource_id))
  const removedLinks = currentLinks.filter((link) => !keptDocumentKeys.has(link.document_key))
  const hasFileChanges = removedLinks.length > 0 || newFiles.length > 0

  let createdRecordId = ''
  let uploadedDocumentKeys: string[] = []
  let createdDocumentLinks: DocumentLinkRow[] = []

  try {
    if (!currentRecord?.id) {
      const createdRecord = await createAcademicRankData(payload)
      createdRecordId = createdRecord.data?.id || ''
      uploadedDocumentKeys = await uploadAcademicFiles(newFiles)
      if (uploadedDocumentKeys.length) {
        createdDocumentLinks = await storeAcademicFiles(uploadedDocumentKeys, {
          ...createdRecord.data,
          ...payload,
          id: createdRecordId,
        })
      }
      toast.success('บันทึกข้อมูลประวัติวิทยฐานะสำเร็จ', { position: 'bottom-right' })
      await getAcademicRankData()
      return
    }

    if (!hasFileChanges) {
      await updateAcademicRankData(currentRecord.id, payload)
      toast.success('บันทึกข้อมูลประวัติวิทยฐานะสำเร็จ', { position: 'bottom-right' })
      await getAcademicRankData()
      return
    }

    if (newFiles.length) {
      uploadedDocumentKeys = await uploadAcademicFiles(newFiles)
      createdDocumentLinks = await storeAcademicFiles(uploadedDocumentKeys, {
        ...currentRecord,
        ...payload,
        id: currentRecord.id,
      })
    }

    await updateAcademicRankData(currentRecord.id, payload)

    if (removedLinks.length) {
      await deleteAcademicDocumentLinks(removedLinks)
      await deleteAcademicFiles(removedLinks.map((link) => link.document_key))
    }

    toast.success('บันทึกข้อมูลประวัติวิทยฐานะสำเร็จ', { position: 'bottom-right' })
    await getAcademicRankData()
  } catch (error: any) {
    if (createdDocumentLinks.length) {
      try {
        await deleteAcademicDocumentLinks(createdDocumentLinks)
      } catch (rollbackError) {
        console.error('Academic link rollback error:', rollbackError)
      }
    }

    if (uploadedDocumentKeys.length) {
      try {
        await deleteAcademicFiles(uploadedDocumentKeys)
      } catch (rollbackError) {
        console.error('Academic file rollback error:', rollbackError)
      }
    }

    if (createdRecordId) {
      try {
        await deleteAcademicRankData(createdRecordId)
      } catch (rollbackError) {
        console.error('Academic dataset rollback error:', rollbackError)
      }
    }

    console.error('Academic Rank Save Error:', error)
    toast.error(
      `บันทึกข้อมูลประวัติวิทยฐานะไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      { position: 'bottom-right' },
    )
  }
}

function handleSave(index: number, values: Record<string, any>) {
  if (busyEntries.value[index]) return
  const nextValues = applyAcademicDefaults(
    values as AcademicRankFormValue,
    academicRankData.value[index],
  )
  const nextAcademicRankData = [...academicRankData.value]
  nextAcademicRankData[index] = nextValues
  academicRankData.value = nextAcademicRankData
  pendingAction.value = { type: 'save', index, values: nextValues }
  action.value = academicRankData.value[index]?.id ? 'update' : 'add'
  modalValue.value = `วิทยฐานะ ${values['academic-rank'] || ''}`
  confirmModal.value = true
}

function handleChange(index: number, values: Record<string, any>) {
  const currentRecord = academicRankData.value[index] || {}
  const shouldSyncDefaults =
    String(values.position_rank || '') !== String(currentRecord.position_rank || '') ||
    String(values.ranking_type || '') !== String(currentRecord.ranking_type || '')

  if (!shouldSyncDefaults) return

  const nextAcademicRankData = [...academicRankData.value]
  nextAcademicRankData[index] = applyAcademicDefaults(
    values as AcademicRankFormValue,
    academicRankData.value[index],
  )
  academicRankData.value = nextAcademicRankData
}

async function deleteAcademicRankWithFiles(
  recordId?: string,
  currentRecord?: AcademicRankFormValue,
) {
  try {
    if (!recordId || !currentRecord?.id) {
      toast.success('ลบข้อมูลประวัติวิทยฐานะสำเร็จ', { position: 'bottom-right' })
      await getAcademicRankData()
      return
    }

    const currentLinks = documentLinksByAcademic.value[currentRecord.id] || []
    if (currentLinks.length) {
      await deleteAcademicDocumentLinks(currentLinks)
      await deleteAcademicFiles(currentLinks.map((link) => link.document_key))
    }

    await deleteAcademicRankData(recordId)
    toast.success('ลบข้อมูลประวัติวิทยฐานะสำเร็จ', { position: 'bottom-right' })
    await getAcademicRankData()
  } catch (error: any) {
    console.error('Academic Rank Delete Error:', error)
    toast.error(
      `ลบข้อมูลประวัติวิทยฐานะไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      { position: 'bottom-right' },
    )
    await getAcademicRankData()
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
      await persistAcademicRank(currentAction.index, currentAction.values)
      return
    }
    await deleteAcademicRankWithFiles(currentAction.recordId, currentAction.values)
  } finally {
    const { [currentAction.index]: _busyEntry, ...restBusyEntries } = busyEntries.value
    busyEntries.value = restBusyEntries
  }
}

function handleDelete(index: number, recordId?: string) {
  if (busyEntries.value[index]) return
  pendingAction.value = { type: 'delete', index, recordId, values: academicRankData.value[index] }
  action.value = 'delete'
  modalValue.value = `วิทยฐานะ ${academicRankData.value[index]?.['academic-rank'] || ''}`
  confirmModal.value = true
}

onMounted(() => {
  getAcademicRankData()
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
      :values="academicRankData"
      :fields="academicRankFields"
      :deferCommitOnSave="true"
      :deferDeleteOnConfirm="true"
      @change="handleChange"
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
