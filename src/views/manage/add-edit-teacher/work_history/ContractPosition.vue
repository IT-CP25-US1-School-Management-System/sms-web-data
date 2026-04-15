<script setup lang="ts">
import ConfirmModal from '@/components/ConfirmModal.vue'
import CreateForm from '@/components/form/CreateForm.vue'
import { MANAGE_DATASETS, MANAGE_DROPDOWN_DATASETS } from '@/lib/constants'
import { formatDateInput, generateUUID, sortDropdownOptionsByThaiLabel } from '@/lib/helpers'
import { useAuthStore } from '@/stores/auth'
import { useTeacherStore } from '@/stores/teachers'
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
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'

type DocumentLinkRow = DocumentLink & { id?: string }
type ExistingContractFile = {
  name: string
  size: number
  type?: string
  resource_id: string
  url?: string
  existing: true
  document_link_id?: string
}
type ContractFileItem = File | ExistingContractFile
type ContractRow = Record<string, any> & {
  id?: string
  person_id?: string
  document_links?: DocumentLinkRow[]
}
type RoleRow = {
  id?: number | string
  role_id?: number | string
  roles_id?: number | string
  role_name_th?: string
  roles_name_th?: string
  name_th?: string
  name?: string
}
type ContractFormValue = ContractRow & { file?: ContractFileItem[] }
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
type CreateFormSection = { topic?: string; content: CreateFormField[] }

const ENTITY_TABLE = 'history_position'
const FILE_FIELD = 'file'

const CONTRACT_POSITION_DATASET = {
  DATASET_ID: MANAGE_DATASETS.DATASET_ID,
  DATASET_VERSION: MANAGE_DATASETS.DATASET_VERSION_CONTRACT_POSITION,
  VIEW_NAME: MANAGE_DATASETS.VIEW_CONTRACT_POSITION,
} as const
const DOCUMENT_LINK_DATASET = {
  DATASET_ID: MANAGE_DATASETS.DATASET_ID,
  DATASET_VERSION: MANAGE_DATASETS.DATASET_VERSION_DOCUMENT_LINK,
  VIEW_NAME: 'file_view',
} as const

const route = useRoute()
const teacherStore = useTeacherStore()
const authStore = useAuthStore()

const loading = ref(false)
const busyEntries = ref<Record<number, 'save' | 'delete'>>({})
const contractPositionData = ref<ContractFormValue[]>([])
const documentLinksByContract = ref<Record<string, DocumentLinkRow[]>>({})
const formRenderKey = ref(0)
const positionOptions = ref<{ label: string; value: string }[]>([])
const roleIdByPosition = new Map<string, string>()
const positionLabelByRoleId = new Map<string, string>()

const confirmModal = ref(false)
const action = ref('update')
const modalTopic = ref('ประวัติการดำรงตำแหน่ง')
const modalValue = ref('')
const pendingAction = ref<
  | { type: 'save'; index: number; values: ContractFormValue }
  | { type: 'delete'; index: number; recordId?: string; values?: ContractFormValue }
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

const contractFields: CreateFormSection[][] = [
  [
    {
      content: [
        {
          name: 'date',
          label: 'วันเดือนปี',
          type: 'date',
          required: true,
          placeholder: '-',
          disabled: false,
        },
        {
          name: 'position',
          label: 'ตำแหน่ง',
          type: 'select',
          required: true,
          placeholder: 'เลือกตำแหน่ง',
          disabled: false,
          options: positionOptions.value,
        },
        {
          name: 'salary',
          label: 'เงินเดือน',
          type: 'number',
          required: true,
          placeholder: '-',
          disabled: false,
        },
        {
          name: 'contract_number',
          label: 'เลขที่คำสั่ง/สัญญาจ้าง',
          type: 'text',
          required: true,
          placeholder: '',
          disabled: false,
        },
        {
          name: 'file',
          label: 'ดาวน์โหลดไฟล์',
          type: 'file',
          accept: '.pdf,.jpg,.png',
          multiple: true,
          required: true,
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

function mapDropdownOptions<T extends Record<string, any>>(rows: T[], labelKeys: string[]) {
  const options = Array.from(
    new Map(
      rows
        .map((item) => {
          const label = labelKeys.map((key) => item[key]).find((candidate) => Boolean(candidate))

          if (!label) return null

          return {
            label: String(label),
            value: String(label),
          }
        })
        .filter((item): item is { label: string; value: string } => Boolean(item))
        .map((item) => [item.value, item]),
    ).values(),
  )

  return sortDropdownOptionsByThaiLabel(options)
}

function resolveRoleIdFromRow(row: RoleRow) {
  const roleId = row.id ?? row.role_id ?? row.roles_id
  return roleId === undefined || roleId === null ? '' : String(roleId)
}

async function fetchPositionOptions() {
  try {
    for (const viewName of ['roles', 'role']) {
      const response = await getDatasetRows<RoleRow>(
        MANAGE_DROPDOWN_DATASETS.DATASET_ID,
        MANAGE_DROPDOWN_DATASETS.DATASET_VERSION_ROLES,
        {
          view: viewName,
          page: 1,
          per_page: 100,
        },
      )

      const mappedOptions = mapDropdownOptions(response.data || [], [
        'role_name_th',
        'roles_name_th',
        'name_th',
        'name',
      ])

      roleIdByPosition.clear()
      positionLabelByRoleId.clear()
      ;(response.data || []).forEach((row) => {
        const label = [row.role_name_th, row.roles_name_th, row.name_th, row.name].find(
          (candidate) => Boolean(candidate),
        )
        const roleId = resolveRoleIdFromRow(row)

        if (!label || !roleId) return

        roleIdByPosition.set(String(label), roleId)
        positionLabelByRoleId.set(roleId, String(label))
      })

      if (mappedOptions.length > 0) {
        positionOptions.value.splice(0, positionOptions.value.length, ...mappedOptions)
        formRenderKey.value += 1
        return
      }
    }
  } catch (error) {
    console.error('Failed to load contract position options:', error)
  }
}

function normalizeContractFiles(value: unknown): ContractFileItem[] {
  if (!value) return []
  if (Array.isArray(value)) return value as ContractFileItem[]
  return [value as ContractFileItem]
}

function isExistingContractFile(file: ContractFileItem): file is ExistingContractFile {
  return 'resource_id' in file && typeof file.resource_id === 'string'
}

function buildContractPurpose(values: Partial<ContractRow>, fileField?: string) {
  const basePurpose = `${values.license_type || 'license'}_${values.license_no || 'unknown'}`
  return fileField ? `${basePurpose}_${fileField}` : basePurpose
}

function formatContractRecord(record: ContractRow) {
  const resolvedRoleId = record.role_id ? String(record.role_id) : ''
  return {
    ...record,
    position:
      record.position ||
      (resolvedRoleId ? positionLabelByRoleId.get(resolvedRoleId) || record.position : '') ||
      '',
    role_id: resolvedRoleId || undefined,
    contract_number: record.contract_number ?? record.order_no ?? '',
    date: record.date ? formatDateInput(record.date) : null,
  }
}

function buildContractPayload(
  values: ContractFormValue,
  currentRecord?: ContractRow,
  personId?: string,
) {
  const payload = { ...values }
  delete payload[FILE_FIELD]
  const resolvedPosition = String(values.position ?? currentRecord?.position ?? '').trim()
  const resolvedRoleId =
    String(values.role_id ?? currentRecord?.role_id ?? '').trim() ||
    roleIdByPosition.get(resolvedPosition) ||
    undefined

  return {
    ...currentRecord,
    ...payload,
    id: currentRecord?.id || values.id || generateUUID(),
    person_id: personId || currentRecord?.person_id || values.person_id || '',
    position: resolvedPosition,
    role_id: resolvedRoleId,
    order_no:
      values.contract_number ??
      payload.order_no ??
      currentRecord?.order_no ??
      currentRecord?.contract_number ??
      '',
    date: values.date ? formatDateInput(values.date) : null,
    created_at: currentRecord?.created_at || new Date().toISOString(),
    updated_at: currentRecord?.id ? new Date().toISOString() : null,
  }
}

function resolveContractPersonId(values: ContractFormValue, currentRecord?: ContractRow) {
  return (
    getPersonId() ||
    currentRecord?.person_id ||
    values.person_id ||
    contractPositionData.value.find((record) => record.person_id)?.person_id ||
    ''
  )
}

function extractContractResponse(data: unknown) {
  if (!Array.isArray(data))
    return { records: [] as ContractRow[], allDocumentLinks: [] as DocumentLinkRow[] }
  const source = Array.isArray(data[0]) ? data[0] : data
  const root = Array.isArray(source) ? source[0] : source
  const records = (
    ((root?.history_position || root?.contract_positions || source) as ContractRow[] | undefined) ||
    []
  ).map(formatContractRecord)
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

function createExistingContractFile(
  file: FileDocument,
  link?: DocumentLinkRow,
): ExistingContractFile {
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

async function getContractFiles(record: ContractRow, documentLinks: DocumentLinkRow[]) {
  const matchedLinks = documentLinks.filter(
    (link) => link.entity_id === record.id && Boolean(link.document_key),
  )
  if (!matchedLinks.length) return []
  const results = await Promise.allSettled(
    matchedLinks.map(async (link) => {
      const response = await getFileDocumentRows<FileDocument>(link.document_key)
      return createExistingContractFile(response.data, link)
    }),
  )
  return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
}

async function getContractPositionData() {
  loading.value = true
  try {
    const personId = getPersonId()

    if (!personId) {
      contractPositionData.value = []
      documentLinksByContract.value = {}
      formRenderKey.value += 1
      toast.error('ไม่พบข้อมูลบุคลากร', {
        position: 'bottom-right',
      })
      return
    }

    const response = await getDatasetRows<ContractRow>(
      CONTRACT_POSITION_DATASET.DATASET_ID,
      CONTRACT_POSITION_DATASET.DATASET_VERSION,
      {
        view: CONTRACT_POSITION_DATASET.VIEW_NAME,
        page: 1,
        per_page: 50,
        where: [
          [
            {
              table_name: CONTRACT_POSITION_DATASET.VIEW_NAME,
              field: 'person_id',
              operator: '=',
              value: personId,
            },
          ],
        ],
      },
    )
    const { records, allDocumentLinks } = extractContractResponse(response.data)
    documentLinksByContract.value = Object.fromEntries(
      records
        .filter((record) => Boolean(record.id))
        .map((record) => [
          record.id as string,
          allDocumentLinks.filter((link) => link.entity_id === record.id),
        ]),
    )
    contractPositionData.value = await Promise.all(
      records.map(async (record) => ({
        ...record,
        person_id: record.person_id || personId,
        file: await getContractFiles(record, documentLinksByContract.value[record.id || ''] || []),
      })),
    )
    formRenderKey.value += 1
  } catch (error: any) {
    console.error('Contract Position API Error:', error)
    toast.error(
      `โหลดข้อมูลประวัติการดำรงตำแหน่งไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      { position: 'bottom-right' },
    )
    contractPositionData.value = []
    documentLinksByContract.value = {}
    formRenderKey.value += 1
  } finally {
    loading.value = false
  }
}

async function uploadContractFiles(files: File[]) {
  if (!files.length) return []
  const params: CreateFileDocumentParams = {
    path: 'file-req',
    folder: 'file',
    uploaded_by: getCurrentUserName(),
    description: 'ประวัติการดำรงตำแหน่ง',
  }
  const uploadedKeys: string[] = []
  for (const file of files) {
    const response = await createFileDocument<FileDocument>(file, params)
    if (!response.data?.resource_id) throw new Error('อัปโหลดไฟล์ไม่สำเร็จ')
    uploadedKeys.push(response.data.resource_id)
  }
  return uploadedKeys
}

async function deleteContractFiles(documentKeys: string[]) {
  for (const documentKey of documentKeys) {
    try {
      await deleteFileDocument<FileDocument>(documentKey)
    } catch (error: any) {
      if (error?.response?.status === 404) continue
      throw error
    }
  }
}

async function createContractData(payload: Record<string, any>) {
  return createDatasetRow<ContractRow>(
    CONTRACT_POSITION_DATASET.DATASET_ID,
    CONTRACT_POSITION_DATASET.DATASET_VERSION,
    payload,
    CONTRACT_POSITION_DATASET.VIEW_NAME,
  )
}

async function updateContractData(recordId: string, payload: Record<string, any>) {
  return updateDatasetRow<ContractRow>(
    CONTRACT_POSITION_DATASET.DATASET_ID,
    CONTRACT_POSITION_DATASET.DATASET_VERSION,
    recordId,
    payload,
    CONTRACT_POSITION_DATASET.VIEW_NAME,
  )
}

async function deleteContractData(recordId: string) {
  return deleteDatasetRow(
    CONTRACT_POSITION_DATASET.DATASET_ID,
    CONTRACT_POSITION_DATASET.DATASET_VERSION,
    recordId,
  )
}

async function storeContractFiles(documentIds: string[], record: ContractRow) {
  const createdLinks: DocumentLinkRow[] = []
  for (const documentId of documentIds) {
    const response = await createDatasetRow<DocumentLinkRow>(
      DOCUMENT_LINK_DATASET.DATASET_ID,
      DOCUMENT_LINK_DATASET.DATASET_VERSION,
      {
        document_key: documentId,
        entity_table: ENTITY_TABLE,
        entity_id: record.id || '',
        purpose: buildContractPurpose(record, FILE_FIELD),
        person_id: record.person_id || '',
        created_at: new Date().toISOString(),
      },
      DOCUMENT_LINK_DATASET.VIEW_NAME,
    )
    createdLinks.push(response.data)
  }
  return createdLinks
}

async function deleteContractDocumentLinks(documentLinks: DocumentLinkRow[]) {
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

async function persistContract(index: number, values: ContractFormValue) {
  const currentRecord = contractPositionData.value[index]
  const personId = resolveContractPersonId(values, currentRecord)

  if (!personId) {
    toast.error('ไม่พบข้อมูลบุคลากร', {
      position: 'bottom-right',
    })
    return
  }

  const payload = buildContractPayload(values, currentRecord, personId)
  const currentFiles = normalizeContractFiles(values[FILE_FIELD])
  const existingFiles = currentFiles.filter(isExistingContractFile)
  const newFiles = currentFiles.filter((file): file is File => file instanceof File)
  const currentLinks = currentRecord?.id
    ? documentLinksByContract.value[currentRecord.id] || []
    : []
  const keptDocumentKeys = new Set(existingFiles.map((file) => file.resource_id))
  const removedLinks = currentLinks.filter((link) => !keptDocumentKeys.has(link.document_key))
  const hasFileChanges = removedLinks.length > 0 || newFiles.length > 0

  let createdRecordId = ''
  let uploadedDocumentKeys: string[] = []
  let createdDocumentLinks: DocumentLinkRow[] = []

  try {
    if (!currentRecord?.id) {
      const createdRecord = await createContractData(payload)
      createdRecordId = createdRecord.data?.id || ''
      uploadedDocumentKeys = await uploadContractFiles(newFiles)
      if (uploadedDocumentKeys.length) {
        createdDocumentLinks = await storeContractFiles(uploadedDocumentKeys, {
          ...createdRecord.data,
          ...payload,
          id: createdRecordId,
        })
      }
      toast.success('บันทึกข้อมูลประวัติการดำรงตำแหน่งสำเร็จ', { position: 'bottom-right' })
      await getContractPositionData()
      return
    }

    if (!hasFileChanges) {
      await updateContractData(currentRecord.id, payload)
      toast.success('บันทึกข้อมูลประวัติการดำรงตำแหน่งสำเร็จ', { position: 'bottom-right' })
      await getContractPositionData()
      return
    }

    if (newFiles.length) {
      uploadedDocumentKeys = await uploadContractFiles(newFiles)
      createdDocumentLinks = await storeContractFiles(uploadedDocumentKeys, {
        ...currentRecord,
        ...payload,
        id: currentRecord.id,
      })
    }

    await updateContractData(currentRecord.id, payload)

    if (removedLinks.length) {
      await deleteContractDocumentLinks(removedLinks)
      await deleteContractFiles(removedLinks.map((link) => link.document_key))
    }

    toast.success('บันทึกข้อมูลประวัติการดำรงตำแหน่งสำเร็จ', { position: 'bottom-right' })
    await getContractPositionData()
  } catch (error: any) {
    if (createdDocumentLinks.length) {
      try {
        await deleteContractDocumentLinks(createdDocumentLinks)
      } catch (rollbackError) {
        console.error('Contract link rollback error:', rollbackError)
      }
    }
    if (uploadedDocumentKeys.length) {
      try {
        await deleteContractFiles(uploadedDocumentKeys)
      } catch (rollbackError) {
        console.error('Contract file rollback error:', rollbackError)
      }
    }
    if (createdRecordId) {
      try {
        await deleteContractData(createdRecordId)
      } catch (rollbackError) {
        console.error('Contract dataset rollback error:', rollbackError)
      }
    }
    console.error('Contract Save Error:', error)
    toast.error(
      `บันทึกข้อมูลประวัติการดำรงตำแหน่งไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      { position: 'bottom-right' },
    )
  }
}

function handleSave(index: number, values: Record<string, any>) {
  if (busyEntries.value[index]) return
  pendingAction.value = { type: 'save', index, values: values as ContractFormValue }
  action.value = contractPositionData.value[index]?.id ? 'update' : 'add'
  modalValue.value = `สัญญาจ้าง ${values.contract_number || ''}`
  confirmModal.value = true
}

async function deleteContractWithFiles(recordId?: string, currentRecord?: ContractFormValue) {
  try {
    if (!recordId || !currentRecord?.id) {
      toast.success('ลบข้อมูลประวัติการดำรงตำแหน่งสำเร็จ', { position: 'bottom-right' })
      await getContractPositionData()
      return
    }
    const currentLinks = documentLinksByContract.value[currentRecord.id] || []
    if (currentLinks.length) {
      await deleteContractDocumentLinks(currentLinks)
      await deleteContractFiles(currentLinks.map((link) => link.document_key))
    }
    await deleteContractData(recordId)
    toast.success('ลบข้อมูลประวัติการดำรงตำแหน่งสำเร็จ', { position: 'bottom-right' })
    await getContractPositionData()
  } catch (error: any) {
    console.error('Contract Delete Error:', error)
    toast.error(
      `ลบข้อมูลประวัติการดำรงตำแหน่งไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      { position: 'bottom-right' },
    )
    await getContractPositionData()
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
      await persistContract(currentAction.index, currentAction.values)
      return
    }
    await deleteContractWithFiles(currentAction.recordId, currentAction.values)
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
    values: contractPositionData.value[index],
  }
  action.value = 'delete'
  modalValue.value = `สัญญาจ้าง ${contractPositionData.value[index]?.contract_number || ''}`
  confirmModal.value = true
}

onMounted(() => {
  const idFromUrl = route.query.id as string | undefined

  if (idFromUrl && !teacherStore.personId) {
    teacherStore.setPersonId(idFromUrl)
  }

  void fetchPositionOptions()
  void getContractPositionData()
})
</script>

<template>
  <div class="mx-6 flex flex-col gap-4 pb-6">
    <CreateForm
      :key="formRenderKey"
      :busyEntries="busyEntries"
      :values="contractPositionData"
      :canDelete="true"
      :fields="contractFields"
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
