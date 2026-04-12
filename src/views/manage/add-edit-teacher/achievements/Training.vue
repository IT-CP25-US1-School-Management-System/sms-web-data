<script setup lang="ts">
import ConfirmModal from '@/components/ConfirmModal.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import CreateForm from '@/components/form/CreateForm.vue'
import { MANAGE_DATASETS } from '@/lib/constants'
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
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { useTeacherStore } from '@/stores/teachers'

type DocumentLinkRow = DocumentLink & { id?: string }

type ExistingTrainingFile = {
  name: string
  size: number
  type?: string
  resource_id: string
  url?: string
  existing: true
  document_link_id?: string
}

type TrainingFileItem = File | ExistingTrainingFile

type TrainingRow = Record<string, any> & {
  id?: string
  person_id?: string
  document_links?: DocumentLinkRow[]
}

type TrainingFormValue = TrainingRow & {
  'photo-file'?: TrainingFileItem[]
  'certificate-file'?: TrainingFileItem[]
}

type CreateFormField = {
  name: string
  label?: string
  type: 'text' | 'date' | 'date-range' | 'select' | 'number' | 'email' | 'textarea' | 'file'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  isShow?: boolean
  options?: { label: string; value: any }[]
  accept?: string
  multiple?: boolean
}

type CreateFormSection = {
  topic?: string
  content: CreateFormField[]
}

const TRAINING_GET_VIEW = MANAGE_DATASETS.VIEW_TRAINING
const TRAINING_EDIT_VIEW = MANAGE_DATASETS.VIEW_TRAINING
const TRAINING_ENTITY_TABLE = 'trainings'
const TRAINING_FILE_FIELDS = ['photo-file', 'certificate-file'] as const
const teacherStore = useTeacherStore()

const TRAINING_DATASET = {
  DATASET_ID: MANAGE_DATASETS.DATASET_ID,
  DATASET_VERSION: MANAGE_DATASETS.DATASET_VERSION_TRAINING,
  VIEW_NAME: TRAINING_EDIT_VIEW,
} as const

const TRAINING_DATASET_DELETE = {
  DATASET_ID: MANAGE_DATASETS.DATASET_ID,
  DATASET_VERSION: MANAGE_DATASETS.DATASET_VERSION_TRAINING,
} as const

const DOCUMENT_LINK_CREATE_DATASET = {
  DATASET_ID: MANAGE_DATASETS.DATASET_ID,
  DATASET_VERSION: MANAGE_DATASETS.DATASET_VERSION_DOCUMENT_LINK,
  VIEW_NAME: 'file_view',
} as const

const DOCUMENT_LINK_DELETE_DATASET = {
  DATASET_ID: MANAGE_DATASETS.DATASET_ID,
  DATASET_VERSION: MANAGE_DATASETS.DATASET_VERSION_DOCUMENT_LINK,
} as const

const authStore = useAuthStore()

const loading = ref(false)
const busyEntries = ref<Record<number, 'save' | 'delete'>>({})
const trainingData = ref<TrainingFormValue[]>([])
const documentLinksByTraining = ref<Record<string, DocumentLinkRow[]>>({})
const formRenderKey = ref(0)

const confirmModal = ref(false)
const action = ref('update')
const modalTopic = ref('ผลงานการอบรม')
const modalValue = ref('')
const pendingAction = ref<
  | { type: 'save'; index: number; values: TrainingFormValue }
  | { type: 'delete'; index: number; recordId?: string; values?: TrainingFormValue }
  | null
>(null)

const trainingFields: CreateFormSection[][] = [
  [
    {
      content: [
        // {
        //   name: 'work-type',
        //   label: 'เลือกประเภทผลงาน',
        //   type: 'select',
        //   required: true,
        //   isShow: true,
        //   placeholder: 'เลือกประเภทผลงาน',
        //   options: [],
        // },
        {
          name: 'course_title',
          label: 'หลักสูตร/เรื่อง/หัวข้อ',
          type: 'text',
          required: true,
          isShow: true,
          placeholder: '',
        },
        {
          name: 'start_date',
          label: 'วันเริ่มต้น',
          type: 'date',
          required: true,
          placeholder: 'วว / ดด / ปปปป',
        },
        {
          name: 'end_date',
          label: 'วันสิ้นสุด',
          type: 'date',
          required: true,
          placeholder: 'วว / ดด / ปปปป',
        },
        {
          name: 'hours',
          label: 'จำนวนชั่วโมง',
          type: 'number',
          required: true,
          placeholder: '',
        },
        {
          name: 'academic_year',
          label: 'ปีการศึกษา',
          type: 'text',
          required: true,
          placeholder: '',
        },
        {
          name: 'organizer',
          label: 'หน่วยงานที่จัด',
          type: 'text',
          required: true,
          placeholder: '',
        },
        {
          name: 'location',
          label: 'สถานที่จัด',
          type: 'text',
          required: true,
          placeholder: '',
        },
        {
          name: 'outcomes',
          label: 'สิ่งที่ได้รับจากการอบรม',
          type: 'textarea',
          required: false,
          placeholder: 'Value',
        },
        {
          name: 'photo-file',
          label: 'แนบภาพ',
          type: 'file',
          accept: '.jpg,.jpeg,.png',
          multiple: true,
          required: false,
        },
        {
          name: 'certificate-file',
          label: 'แนบเกียรติบัตร',
          type: 'file',
          accept: '.pdf,.jpg,.png',
          multiple: true,
          required: false,
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

function normalizeTrainingFiles(value: unknown): TrainingFileItem[] {
  if (!value) return []
  if (Array.isArray(value)) return value as TrainingFileItem[]
  return [value as TrainingFileItem]
}

function isExistingTrainingFile(file: TrainingFileItem): file is ExistingTrainingFile {
  return 'resource_id' in file && typeof file.resource_id === 'string'
}

function buildTrainingPurpose(values: Partial<TrainingRow>, fileField?: string) {
  const topic = values.project_title || 'ไม่ระบุหัวข้อ'

  if (fileField === 'photo-file') {
    return `ภาพข้อมูลผลงาน/นวัตกรรมสำหรับ ${topic}_${fileField}`
  }

  if (fileField === 'certificate-file') {
    return `ใบประกาศนียบัตรของ ${topic}_${fileField}`
  }

  return String(topic)
}

function matchesTrainingFileField(
  link: DocumentLinkRow,
  fileField: (typeof TRAINING_FILE_FIELDS)[number],
) {
  if (!link.purpose) return fileField === TRAINING_FILE_FIELDS[0]
  if (link.purpose.endsWith(`_${fileField}`)) return true
  return false
}

function formatTrainingDate(value?: string | null) {
  if (!value) return null
  return formatDateInput(value)
}

function formatTrainingRecord(record: TrainingRow) {
  return {
    ...record,
    start_date: formatTrainingDate(record.start_date),
    end_date: formatTrainingDate(record.end_date),
  }
}

function buildTrainingPayload(
  values: TrainingFormValue,
  currentRecord?: TrainingRow,
  personId?: string,
) {
  const payload = { ...values }
  for (const fileField of TRAINING_FILE_FIELDS) delete payload[fileField]
  const hoursValue =
    values.hours === '' || values.hours === null || values.hours === undefined
      ? null
      : Number(values.hours)

  return {
    ...currentRecord,
    ...payload,
    id: currentRecord?.id || values.id || generateUUID(),
    person_id:
      personId || teacherStore.personId || currentRecord?.person_id || values.person_id || '',
    hours: hoursValue,
    start_date: formatTrainingDate(values.start_date),
    end_date: formatTrainingDate(values.end_date),
    created_at: currentRecord?.created_at || new Date().toISOString(),
    updated_at: currentRecord?.id ? new Date().toISOString() : null,
  }
}

function resolveTrainingPersonId(values: TrainingFormValue, currentRecord?: TrainingRow) {
  return (
    currentRecord?.person_id ||
    values.person_id ||
    trainingData.value.find((record) => record.person_id)?.person_id ||
    ''
  )
}

function extractTrainingResponse(data: unknown) {
  if (!Array.isArray(data)) {
    return { records: [] as TrainingRow[], allDocumentLinks: [] as DocumentLinkRow[] }
  }

  const source = Array.isArray(data[0]) ? data[0] : data
  const records = (source as TrainingRow[]) || []
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

function createExistingTrainingFile(
  file: FileDocument,
  link?: DocumentLinkRow,
): ExistingTrainingFile {
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

async function getTrainingFiles(
  record: TrainingRow,
  documentLinks: DocumentLinkRow[],
  fileField: (typeof TRAINING_FILE_FIELDS)[number],
) {
  const matchedLinks = documentLinks.filter(
    (link) =>
      link.entity_id === record.id &&
      Boolean(link.document_key) &&
      matchesTrainingFileField(link, fileField),
  )

  if (!matchedLinks.length) return []

  const results = await Promise.allSettled(
    matchedLinks.map(async (link) => {
      const response = await getFileDocumentRows<FileDocument>(link.document_key)
      return createExistingTrainingFile(response.data, link)
    }),
  )

  return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
}

async function getTrainingData() {
  loading.value = true
  try {
    const response = await getDatasetRows<TrainingRow>(
      TRAINING_DATASET.DATASET_ID,
      TRAINING_DATASET.DATASET_VERSION,
      {
        view: TRAINING_GET_VIEW,
        page: 1,
        per_page: 50,
        where: teacherStore.personId
          ? [
              [
                {
                  table_name: TRAINING_ENTITY_TABLE,
                  field: 'person_id',
                  operator: '=',
                  value: teacherStore.personId,
                },
              ],
            ]
          : undefined,
      },
    )

    const { records, allDocumentLinks } = extractTrainingResponse(response.data)

    documentLinksByTraining.value = Object.fromEntries(
      records
        .filter((record) => Boolean(record.id))
        .map((record) => [
          record.id as string,
          allDocumentLinks.filter((link) => link.entity_id === record.id),
        ]),
    )

    trainingData.value = await Promise.all(
      records.map(async (record) => ({
        ...formatTrainingRecord(record),
        'photo-file': await getTrainingFiles(
          record,
          documentLinksByTraining.value[record.id || ''] || [],
          'photo-file',
        ),
        'certificate-file': await getTrainingFiles(
          record,
          documentLinksByTraining.value[record.id || ''] || [],
          'certificate-file',
        ),
      })),
    )

    formRenderKey.value += 1
  } catch (error: any) {
    console.error('Training API Error:', error)
    toast.error(
      `โหลดข้อมูลผลงานการอบรมไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      {
        position: 'bottom-right',
      },
    )
    trainingData.value = []
    documentLinksByTraining.value = {}
    formRenderKey.value += 1
  } finally {
    loading.value = false
  }
}

async function uploadTrainingFiles(files: File[]) {
  if (!files.length) return []

  const params: CreateFileDocumentParams = {
    path: 'file-req',
    folder: 'file',
    uploaded_by: getCurrentUserName(),
    description: 'ผลงานการอบรม',
  }

  const uploadedKeys: string[] = []

  for (const file of files) {
    const response = await createFileDocument<FileDocument>(file, params)
    if (!response.data?.resource_id) {
      throw new Error('อัปโหลดไฟล์ไม่สำเร็จ')
    }
    uploadedKeys.push(response.data.resource_id)
  }

  return uploadedKeys
}

async function deleteTrainingFiles(documentKeys: string[]) {
  for (const documentKey of documentKeys) {
    try {
      await deleteFileDocument<FileDocument>(documentKey)
    } catch (error: any) {
      if (error?.response?.status === 404) continue
      throw error
    }
  }
}

async function createTrainingData(payload: Record<string, any>) {
  return createDatasetRow<TrainingRow>(
    TRAINING_DATASET.DATASET_ID,
    TRAINING_DATASET.DATASET_VERSION,
    payload,
    TRAINING_DATASET.VIEW_NAME,
  )
}

async function updateTrainingData(recordId: string, payload: Record<string, any>) {
  return updateDatasetRow<TrainingRow>(
    TRAINING_DATASET.DATASET_ID,
    TRAINING_DATASET.DATASET_VERSION,
    recordId,
    payload,
    TRAINING_DATASET.VIEW_NAME,
  )
}

async function deleteTrainingData(recordId: string) {
  return deleteDatasetRow(
    TRAINING_DATASET_DELETE.DATASET_ID,
    TRAINING_DATASET_DELETE.DATASET_VERSION,
    recordId,
  )
}

async function storeTrainingFiles(
  documentIds: string[],
  record: TrainingRow,
  fileField: (typeof TRAINING_FILE_FIELDS)[number],
) {
  const createdLinks: DocumentLinkRow[] = []

  for (const documentId of documentIds) {
    const response = await createDatasetRow<DocumentLinkRow>(
      DOCUMENT_LINK_CREATE_DATASET.DATASET_ID,
      DOCUMENT_LINK_CREATE_DATASET.DATASET_VERSION,
      {
        document_key: documentId,
        entity_table: TRAINING_ENTITY_TABLE,
        entity_id: record.id || '',
        purpose: buildTrainingPurpose(record, fileField),
        person_id: record.person_id || '',
        created_at: new Date().toISOString(),
      },
      DOCUMENT_LINK_CREATE_DATASET.VIEW_NAME,
    )
    createdLinks.push(response.data)
  }

  return createdLinks
}

async function deleteTrainingDocumentLinks(documentLinks: DocumentLinkRow[]) {
  for (const link of documentLinks) {
    const documentLinkKey = link.id || link.document_key
    if (!documentLinkKey) continue
    await deleteDatasetRow(
      DOCUMENT_LINK_DELETE_DATASET.DATASET_ID,
      DOCUMENT_LINK_DELETE_DATASET.DATASET_VERSION,
      documentLinkKey,
    )
  }
}

async function persistTraining(index: number, values: TrainingFormValue) {
  const currentRecord = trainingData.value[index]
  const personId = resolveTrainingPersonId(values, currentRecord)
  const payload = buildTrainingPayload(values, currentRecord, personId)
  const currentLinks = currentRecord?.id
    ? documentLinksByTraining.value[currentRecord.id] || []
    : []

  const removedLinks = TRAINING_FILE_FIELDS.flatMap((fileField) => {
    const currentFiles = normalizeTrainingFiles(values[fileField])
    const existingFiles = currentFiles.filter(isExistingTrainingFile)
    const keptDocumentKeys = new Set(existingFiles.map((file) => file.resource_id))
    const currentFieldLinks = currentLinks.filter((link) =>
      matchesTrainingFileField(link, fileField),
    )
    return currentFieldLinks.filter((link) => !keptDocumentKeys.has(link.document_key))
  })

  const newFilesByField = Object.fromEntries(
    TRAINING_FILE_FIELDS.map((fileField) => [
      fileField,
      normalizeTrainingFiles(values[fileField]).filter(
        (file): file is File => file instanceof File,
      ),
    ]),
  ) as Record<(typeof TRAINING_FILE_FIELDS)[number], File[]>

  const hasFileChanges =
    removedLinks.length > 0 ||
    TRAINING_FILE_FIELDS.some((fileField) => newFilesByField[fileField].length > 0)

  let createdRecordId = ''
  let uploadedDocumentKeys: string[] = []
  let createdDocumentLinks: DocumentLinkRow[] = []

  try {
    if (!currentRecord?.id) {
      const createdRecord = await createTrainingData(payload)
      createdRecordId = createdRecord.data?.id || ''

      for (const fileField of TRAINING_FILE_FIELDS) {
        const uploadedKeys = await uploadTrainingFiles(newFilesByField[fileField])
        uploadedDocumentKeys.push(...uploadedKeys)

        if (uploadedKeys.length) {
          const links = await storeTrainingFiles(
            uploadedKeys,
            { ...createdRecord.data, ...payload, id: createdRecordId },
            fileField,
          )
          createdDocumentLinks.push(...links)
        }
      }

      toast.success('บันทึกข้อมูลผลงานการอบรมสำเร็จ', { position: 'bottom-right' })
      await getTrainingData()
      return
    }

    if (!hasFileChanges) {
      await updateTrainingData(currentRecord.id, payload)
      toast.success('บันทึกข้อมูลผลงานการอบรมสำเร็จ', { position: 'bottom-right' })
      await getTrainingData()
      return
    }

    for (const fileField of TRAINING_FILE_FIELDS) {
      const uploadedKeys = await uploadTrainingFiles(newFilesByField[fileField])
      uploadedDocumentKeys.push(...uploadedKeys)

      if (uploadedKeys.length) {
        const links = await storeTrainingFiles(
          uploadedKeys,
          { ...currentRecord, ...payload, id: currentRecord.id },
          fileField,
        )
        createdDocumentLinks.push(...links)
      }
    }

    await updateTrainingData(currentRecord.id, payload)

    if (removedLinks.length) {
      await deleteTrainingDocumentLinks(removedLinks)
      await deleteTrainingFiles(removedLinks.map((link) => link.document_key))
    }

    toast.success('บันทึกข้อมูลผลงานการอบรมสำเร็จ', { position: 'bottom-right' })
    await getTrainingData()
  } catch (error: any) {
    if (createdDocumentLinks.length) {
      try {
        await deleteTrainingDocumentLinks(createdDocumentLinks)
      } catch (rollbackError) {
        console.error('Training link rollback error:', rollbackError)
      }
    }

    if (uploadedDocumentKeys.length) {
      try {
        await deleteTrainingFiles(uploadedDocumentKeys)
      } catch (rollbackError) {
        console.error('Training file rollback error:', rollbackError)
      }
    }

    if (createdRecordId) {
      try {
        await deleteTrainingData(createdRecordId)
      } catch (rollbackError) {
        console.error('Training dataset rollback error:', rollbackError)
      }
    }

    console.error('Training Save Error:', error)
    toast.error(
      `บันทึกข้อมูลผลงานการอบรมไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      {
        position: 'bottom-right',
      },
    )
  }
}

function handleSave(index: number, values: Record<string, any>) {
  if (busyEntries.value[index]) return
  pendingAction.value = { type: 'save', index, values: values as TrainingFormValue }
  action.value = trainingData.value[index]?.id ? 'update' : 'add'
  modalValue.value = `ผลงานการอบรม ${values.course_title || ''}`
  confirmModal.value = true
}

async function deleteTrainingWithFiles(recordId?: string, currentRecord?: TrainingFormValue) {
  try {
    if (!recordId || !currentRecord?.id) {
      toast.success('ลบข้อมูลผลงานการอบรมสำเร็จ', { position: 'bottom-right' })
      await getTrainingData()
      return
    }

    const currentLinks = documentLinksByTraining.value[currentRecord.id] || []

    if (currentLinks.length) {
      await deleteTrainingDocumentLinks(currentLinks)
      await deleteTrainingFiles(currentLinks.map((link) => link.document_key))
    }

    await deleteTrainingData(recordId)

    toast.success('ลบข้อมูลผลงานการอบรมสำเร็จ', { position: 'bottom-right' })
    await getTrainingData()
  } catch (error: any) {
    console.error('Training Delete Error:', error)
    toast.error(
      `ลบข้อมูลผลงานการอบรมไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      {
        position: 'bottom-right',
      },
    )
    await getTrainingData()
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
      await persistTraining(currentAction.index, currentAction.values)
      return
    }

    await deleteTrainingWithFiles(currentAction.recordId, currentAction.values)
  } finally {
    const { [currentAction.index]: _busyEntry, ...restBusyEntries } = busyEntries.value
    busyEntries.value = restBusyEntries
  }
}

function handleDelete(index: number, recordId?: string) {
  if (busyEntries.value[index]) return
  pendingAction.value = {
    type: 'delete',
    index,
    recordId,
    values: trainingData.value[index],
  }
  action.value = 'delete'
  modalValue.value = `ผลงานการอบรม ${trainingData.value[index]?.course_title || ''}`
  confirmModal.value = true
}

onMounted(() => {
  getTrainingData()
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
      :values="trainingData"
      :fields="trainingFields"
      :canDelete="true"
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
