<script setup lang="ts">
import CreateForm from '@/components/form/CreateForm.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { MANAGE_DATASETS } from '@/lib/constants'
import { formatDateInput, generateUUID } from '@/lib/helpers'
import { useAuthStore } from '@/stores/auth'
import {
  createProfessionalLicense,
  deleteProfessionalLicense,
  getProfessionalLicensesByTeacherId,
  updateProfessionalLicense,
  useTeacherStore,
} from '@/stores/teachers'
import { createFileDocument, deleteFileDocument, getFileDocumentRows } from '@/stores/document'
import { createDatasetRow, deleteDatasetRow } from '@/stores/dataset'
import type { CreateFileDocumentParams, FileDocument } from '@/types/document'
import type { DocumentLink } from '@/types/document_request'
import type { ProfessionalLicense } from '@/types/teacher'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'

type DocumentLinkRow = DocumentLink & {
  id?: string
}

type ExistingLicenseFile = {
  name: string
  size: number
  type?: string
  resource_id: string
  url?: string
  existing: true
  document_link_id?: string
}

type LicenseFileItem = File | ExistingLicenseFile

type ProfessionalLicenseRow = Record<string, any> &
  Partial<ProfessionalLicense> & {
    document_links?: DocumentLinkRow[]
  }

type ProfessionalLicenseFormValue = ProfessionalLicenseRow & {
  'license-file'?: LicenseFileItem[]
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

const LICENSE_FILE_FIELD = 'license-file'
const LICENSE_ENTITY_TABLE = 'profession-license'
const DOCUMENT_LINK_DATASET = {
  DATASET_ID: MANAGE_DATASETS.DATASET_ID,
  DATASET_VERSION: MANAGE_DATASETS.DATASET_VERSION_DOCUMENT_LINK,
  VIEW_NAME: 'document_links',
} as const

const route = useRoute()
const teacherStore = useTeacherStore()
const authStore = useAuthStore()

const loading = ref(false)
const busyEntries = ref<Record<number, 'save' | 'delete'>>({})
const professionalLicenseData = ref<ProfessionalLicenseFormValue[]>([])
const documentLinksByLicense = ref<Record<string, DocumentLinkRow[]>>({})
const formRenderKey = ref(0)

const confirmModal = ref(false)
const action = ref('update')
const modalTopic = ref('ใบประกอบวิชาชีพ')
const modalValue = ref('')
const pendingAction = ref<
  | { type: 'save'; index: number; values: ProfessionalLicenseFormValue }
  | { type: 'delete'; index: number; licenseId?: string; values?: ProfessionalLicenseFormValue }
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

const licenseFields: CreateFormSection[][] = [
  [
    {
      content: [
        {
          name: 'license_type',
          label: 'ใบประกอบวิชาชีพ',
          type: 'select',
          required: true,
          placeholder: 'เลือกประเภทใบประกอบวิชาชีพ',
          options: [
            { label: 'ใบอนุญาตปฏิบัติหน้าที่ครู (P-License)', value: 'P-License' },
            { label: 'ใบอนุญาตประกอบวิชาชีพครูชั้นต้น (B-License)', value: 'B-License' },
            { label: 'ใบอนุญาตประกอบวิชาชีพครูชั้นสูง (A-License)', value: 'A-License' },
            { label: 'ใบอนุญาตสอน', value: 'ใบอนุญาตสอน' },
          ],
        },
        {
          name: 'license_no',
          label: 'เลขที่ใบประกอบวิชาชีพ',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุเลขที่ใบประกอบวิชาชีพ',
        },
        {
          name: 'issue_date',
          label: 'วันเดือนปีที่ออกบัตร',
          type: 'date',
          required: true,
          placeholder: 'วว / ดด / ปปปป',
        },
        {
          name: 'expiry_date',
          label: 'วันเดือนปีบัตรหมดอายุ',
          type: 'date',
          required: true,
          placeholder: 'วว / ดด / ปปปป',
        },
        {
          name: LICENSE_FILE_FIELD,
          label: 'แนบใบประกอบวิชาชีพ',
          type: 'file',
          accept: '.pdf,.jpg,.png',
          required: true,
          multiple: true,
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

function normalizeLicenseFiles(value: unknown): LicenseFileItem[] {
  if (!value) return []
  if (Array.isArray(value)) return value as LicenseFileItem[]
  return [value as LicenseFileItem]
}

function isExistingLicenseFile(file: LicenseFileItem): file is ExistingLicenseFile {
  return 'resource_id' in file && typeof file.resource_id === 'string'
}

function formatApiDate(date?: string | null) {
  if (!date) return null
  return formatDateInput(date)
}

function buildLicensePurpose(values: Partial<ProfessionalLicenseRow>) {
  return `${values.license_type || 'license'}_${values.license_no || 'unknown'}`
}

function buildProfessionalLicensePayload(
  values: ProfessionalLicenseFormValue,
  currentRecord?: ProfessionalLicenseRow,
  personId?: string,
) {
  const basePayload = {
    id: currentRecord?.id || values.id || generateUUID(),
    person_id: personId || currentRecord?.person_id || values.person_id || '',
    license_type: values.license_type || '',
    license_no: values.license_no || '',
    issue_date: formatApiDate(values.issue_date),
    expiry_date: formatApiDate(values.expiry_date),
  }

  if (currentRecord?.id) {
    return {
      ...basePayload,
      created_at: currentRecord.created_at || null,
      updated_at: new Date().toISOString(),
    }
  }

  return {
    ...basePayload,
    created_at: new Date().toISOString(),
    updated_at: null,
  }
}

function resolveProfessionalLicensePersonId(
  values: ProfessionalLicenseFormValue,
  currentRecord?: ProfessionalLicenseRow,
) {
  return (
    getPersonId() ||
    currentRecord?.person_id ||
    values.person_id ||
    professionalLicenseData.value.find((record) => record.person_id)?.person_id ||
    ''
  )
}

function extractProfessionalLicenseResponse(data: unknown) {
  if (!Array.isArray(data)) {
    return {
      records: [] as ProfessionalLicenseRow[],
      allDocumentLinks: [] as DocumentLinkRow[],
    }
  }

  const records = Array.isArray(data[0])
    ? (data[0] as ProfessionalLicenseRow[])
    : (data as ProfessionalLicenseRow[])
  const allDocumentLinks = records.flatMap(
    (record) => (record.document_links || []) as DocumentLinkRow[],
  )
  const uniqueDocumentLinks = Array.from(
    new Map(
      allDocumentLinks.map((link) => [
        link.id || `${link.entity_id}-${link.document_key}-${link.created_at}`,
        link,
      ]),
    ).values(),
  )

  return {
    records,
    allDocumentLinks: uniqueDocumentLinks,
  }
}

function createExistingLicenseFile(
  file: FileDocument,
  link?: DocumentLinkRow,
): ExistingLicenseFile {
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

async function getFileProfessionalLicense(
  record: ProfessionalLicenseRow,
  documentLinks: DocumentLinkRow[],
) {
  const matchedLinks = documentLinks.filter(
    (link) => link.entity_id === record.id && Boolean(link.document_key),
  )

  if (!matchedLinks.length) return []

  const results = await Promise.allSettled(
    matchedLinks.map(async (link) => {
      const response = await getFileDocumentRows<FileDocument>(link.document_key)
      return createExistingLicenseFile(response.data, link)
    }),
  )

  return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
}

async function getProfessionalLicenseData() {
  loading.value = true
  try {
    const personId = getPersonId()

    if (!personId) {
      professionalLicenseData.value = []
      documentLinksByLicense.value = {}
      formRenderKey.value += 1
      toast.error('ไม่พบข้อมูลครู กรุณาบันทึกข้อมูลส่วนบุคคลก่อน', {
        position: 'bottom-right',
      })
      return
    }

    const response = await getProfessionalLicensesByTeacherId(personId)
    const { records, allDocumentLinks } = extractProfessionalLicenseResponse(
      response.data?.professional_licenses,
    )

    documentLinksByLicense.value = Object.fromEntries(
      records
        .filter((record) => Boolean(record.id))
        .map((record) => [
          record.id as string,
          allDocumentLinks.filter((link) => link.entity_id === record.id),
        ]),
    )

    professionalLicenseData.value = await Promise.all(
      records.map(async (record) => ({
        ...record,
        person_id: record.person_id || personId,
        issue_date: formatDateInput(record.issue_date),
        expiry_date: formatDateInput(record.expiry_date),
        [LICENSE_FILE_FIELD]: await getFileProfessionalLicense(
          record,
          documentLinksByLicense.value[record.id || ''] || [],
        ),
      })),
    )
    formRenderKey.value += 1
  } catch (error: any) {
    console.error('Professional License API Error:', error)
    toast.error(
      `โหลดข้อมูลใบประกอบวิชาชีพไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      {
        position: 'bottom-right',
      },
    )
    professionalLicenseData.value = []
    documentLinksByLicense.value = {}
    formRenderKey.value += 1
  } finally {
    loading.value = false
  }
}

async function uploadFile(files: File[]) {
  if (!files.length) return []

  const params: CreateFileDocumentParams = {
    path: 'file-req',
    folder: 'file',
    uploaded_by: getCurrentUserName(),
    description: 'ใบประกอบวิชาชีพ',
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

async function deleteFiles(documentKeys: string[]) {
  for (const documentKey of documentKeys) {
    try {
      await deleteFileDocument<FileDocument>(documentKey)
    } catch (error: any) {
      if (error?.response?.status === 404) {
        continue
      }
      throw error
    }
  }
}

async function storeFile(documentIds: string[], license: ProfessionalLicenseRow) {
  const createdLinks: DocumentLinkRow[] = []

  for (const documentId of documentIds) {
    const payload = {
      document_key: documentId,
      entity_table: LICENSE_ENTITY_TABLE,
      entity_id: license.id || '',
      purpose: buildLicensePurpose(license),
      person_id: license.person_id || '',
      created_at: new Date().toISOString(),
    }

    const response = await createDatasetRow<DocumentLinkRow>(
      DOCUMENT_LINK_DATASET.DATASET_ID,
      DOCUMENT_LINK_DATASET.DATASET_VERSION,
      payload,
      DOCUMENT_LINK_DATASET.VIEW_NAME,
    )
    createdLinks.push(response.data)
  }

  return createdLinks
}

async function deleteDocumentLinks(documentLinks: DocumentLinkRow[]) {
  for (const link of documentLinks) {
    const documentLinkKey = link.id || link.document_key
    if (!documentLinkKey) continue
    await deleteDatasetRow(
      DOCUMENT_LINK_DATASET.DATASET_ID,
      DOCUMENT_LINK_DATASET.DATASET_VERSION,
      documentLinkKey,
    )
  }
}

async function persistProfessionalLicense(index: number, values: ProfessionalLicenseFormValue) {
  const currentRecord = professionalLicenseData.value[index]
  const personId = getPersonId() || resolveProfessionalLicensePersonId(values, currentRecord)

  if (!personId) {
    toast.error('ไม่พบข้อมูลครู กรุณาบันทึกข้อมูลส่วนบุคคลก่อน', {
      position: 'bottom-right',
    })
    return
  }

  const payload = buildProfessionalLicensePayload(values, currentRecord, personId)
  const currentFiles = normalizeLicenseFiles(values[LICENSE_FILE_FIELD])
  const existingFiles = currentFiles.filter(isExistingLicenseFile)
  const newFiles = currentFiles.filter((file): file is File => file instanceof File)
  const currentLinks = currentRecord?.id ? documentLinksByLicense.value[currentRecord.id] || [] : []
  const keptDocumentKeys = new Set(existingFiles.map((file) => file.resource_id))
  const removedLinks = currentLinks.filter((link) => !keptDocumentKeys.has(link.document_key))
  const hasFileChanges = removedLinks.length > 0 || newFiles.length > 0

  let createdLicenseId = ''
  let uploadedDocumentKeys: string[] = []
  let createdDocumentLinks: DocumentLinkRow[] = []

  try {
    if (!currentRecord?.id) {
      const createdLicense = await createProfessionalLicense(payload)
      createdLicenseId = createdLicense.data?.id || ''

      uploadedDocumentKeys = await uploadFile(newFiles)
      if (uploadedDocumentKeys.length) {
        createdDocumentLinks = await storeFile(uploadedDocumentKeys, {
          ...payload,
          ...createdLicense.data,
          id: createdLicenseId,
          person_id: createdLicense.data?.person_id || payload.person_id,
        })
      }
      toast.success('บันทึกข้อมูลใบประกอบวิชาชีพสำเร็จ', {
        position: 'bottom-right',
      })
      await getProfessionalLicenseData()
      return
    }

    if (!hasFileChanges) {
      await updateProfessionalLicense(currentRecord.id, payload)
      toast.success('บันทึกข้อมูลใบประกอบวิชาชีพสำเร็จ', {
        position: 'bottom-right',
      })
      await getProfessionalLicenseData()
      return
    }

    if (newFiles.length) {
      uploadedDocumentKeys = await uploadFile(newFiles)
      createdDocumentLinks = await storeFile(uploadedDocumentKeys, {
        ...payload,
        ...currentRecord,
        id: currentRecord.id,
        person_id: currentRecord.person_id || payload.person_id,
      })
    }

    await updateProfessionalLicense(currentRecord.id, payload)
    if (removedLinks.length) {
      await deleteDocumentLinks(removedLinks)
      await deleteFiles(removedLinks.map((link) => link.document_key))
    }

    toast.success('บันทึกข้อมูลใบประกอบวิชาชีพสำเร็จ', {
      position: 'bottom-right',
    })
    await getProfessionalLicenseData()
  } catch (error: any) {
    if (createdDocumentLinks.length) {
      try {
        await deleteDocumentLinks(createdDocumentLinks)
      } catch (rollbackError) {
        console.error('Professional License link rollback error:', rollbackError)
      }
    }

    if (uploadedDocumentKeys.length) {
      try {
        await deleteFiles(uploadedDocumentKeys)
      } catch (rollbackError) {
        console.error('Professional License file rollback error:', rollbackError)
      }
    }

    if (createdLicenseId) {
      try {
        await deleteProfessionalLicense(createdLicenseId)
      } catch (rollbackError) {
        console.error('Professional License dataset rollback error:', rollbackError)
      }
    }

    console.error('Professional License Save Error:', error)
    toast.error(
      `บันทึกข้อมูลใบประกอบวิชาชีพไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      {
        position: 'bottom-right',
      },
    )
  }
}

function handleSave(index: number, values: Record<string, any>) {
  if (busyEntries.value[index]) return
  pendingAction.value = {
    type: 'save',
    index,
    values: values as ProfessionalLicenseFormValue,
  }
  action.value = professionalLicenseData.value[index]?.id ? 'update' : 'add'
  modalValue.value = `ใบประกอบวิชาชีพ ${values.license_type || ''} เลขที่ใบประกอบวิชาชีพ ${values.license_no || ''}`
  confirmModal.value = true
}

async function deleteProfessionalLicenseWithFiles(
  licenseId?: string,
  currentRecord?: ProfessionalLicenseFormValue,
) {
  try {
    if (!licenseId || !currentRecord?.id) {
      toast.success('ลบข้อมูลใบประกอบวิชาชีพสำเร็จ', {
        position: 'bottom-right',
      })
      await getProfessionalLicenseData()
      return
    }

    const currentLinks = documentLinksByLicense.value[currentRecord.id] || []

    if (currentLinks.length) {
      await deleteDocumentLinks(currentLinks)
      await deleteFiles(currentLinks.map((link) => link.document_key))
    }

    await deleteProfessionalLicense(licenseId)

    toast.success('ลบข้อมูลใบประกอบวิชาชีพสำเร็จ', {
      position: 'bottom-right',
    })
    await getProfessionalLicenseData()
  } catch (error: any) {
    console.error('Professional License Delete Error:', error)
    toast.error(
      `ลบข้อมูลใบประกอบวิชาชีพไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      {
        position: 'bottom-right',
      },
    )
    await getProfessionalLicenseData()
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
  busyEntries.value = {
    ...busyEntries.value,
    [currentAction.index]: currentAction.type,
  }

  try {
    if (currentAction.type === 'save') {
      await persistProfessionalLicense(currentAction.index, currentAction.values)
      return
    }

    await deleteProfessionalLicenseWithFiles(currentAction.licenseId, currentAction.values)
  } finally {
    const { [currentAction.index]: _busyEntry, ...restBusyEntries } = busyEntries.value
    busyEntries.value = restBusyEntries
  }
}

async function handleDelete(index: number, licenseId?: string) {
  if (busyEntries.value[index]) return
  pendingAction.value = {
    type: 'delete',
    index,
    licenseId,
    values: professionalLicenseData.value[index],
  }
  action.value = 'delete'
  modalValue.value = `ใบประกอบวิชาชีพ ${professionalLicenseData.value[index]?.license_type || ''} เลขที่ใบประกอบวิชาชีพ ${professionalLicenseData.value[index]?.license_no || ''}`
  confirmModal.value = true
}

onMounted(() => {
  const idFromUrl = route.query.id as string | undefined

  if (idFromUrl && !teacherStore.personId) {
    teacherStore.setPersonId(idFromUrl)
  }

  void getProfessionalLicenseData()
})
</script>

<template>
  <div class="mx-6 flex flex-col gap-4 pb-6">
    <p v-if="loading" class="text-muted-foreground text-sm">กำลังโหลดข้อมูล...</p>

    <CreateForm
      :key="formRenderKey"
      :busyEntries="busyEntries"
      :values="professionalLicenseData"
      :fields="licenseFields"
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
