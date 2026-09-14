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
  MANAGE_DROPDOWN_DATASETS,
} from '@/lib/constants'
import { formatDateInput, generateUUID, sortDropdownOptionsByThaiLabel } from '@/lib/helpers'
import {
  normalizeInnovationStudent,
  planInnovationStudentChanges,
  uniqueInnovationStudents,
  type InnovationStudentRow,
} from '@/lib/innovationStudents'
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
import { toast } from 'vue-sonner'

type DocumentLinkRow = DocumentLink & { id?: string }
type ExistingInnovationFile = {
  name: string
  size: number
  type?: string
  resource_id: string
  url?: string
  existing: true
  document_link_id?: string
}
type InnovationFileItem = File | ExistingInnovationFile
type InnovationStudentAwardRow = InnovationStudentRow
type InnovationRow = Record<string, any> & {
  id?: string
  person_id?: string
  document_links?: DocumentLinkRow[]
  innovation_student_awards?: InnovationStudentAwardRow[]
}
type InnovationFormValue = InnovationRow & {
  'photo-file'?: InnovationFileItem[]
  'certificate-file'?: InnovationFileItem[]
  innovation_student_awards?: InnovationStudentAwardRow[]
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
  subFields?: CreateFormField[]
  subEntryFieldName?: string
}
type DepartmentRow = {
  id?: number | string
  department_id?: number | string
  departments_id?: number | string
  subject_group_id?: number | string
  subject_groups_id?: number | string
  department_name_th?: string
  departments_name_th?: string
  subject_group_name?: string
  subject_groups_name?: string
  name?: string
}

const INNOVATION_GET_VIEW = 'innovation_get'
const INNOVATION_EDIT_VIEW = 'innovations_update'
const INNOVATION_ENTITY_TABLE = 'innovations'
const INNOVATION_FILE_FIELDS = ['photo-file', 'certificate-file'] as const
const INNOVATION_DATE_FIELDS = ['start_date', 'end_date'] as const

const DATASET_CONFIG = {
  DATASET_ID: DATASET_EDIT.DATASET_ID,
  DATASET_VERSION: DATASET_EDIT.DATASET_VERSION_INNOVATIONS,
  VIEW_NAME: INNOVATION_EDIT_VIEW,
  DATASET_STUDENTS: DATASET_EDIT.DATASET_VERSION_INNOVATIONS_STUDENTS,
  VIEW_NAME_STUDENTS: 'student_update',
} as const
const DELETE_CONFIG = {
  DATASET_ID: DATASET_DELETE.DATASET_ID,
  DATASET_VERSION: DATASET_DELETE.DATASET_VERSION_INNOVATIONS,
  DATASET_VERSION_STUDENTS: DATASET_DELETE.DATASET_VERSION_INNOVATIONS_STUDENTS,
  VIEW_NAME_STUDENTS: 'student_delete',
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
console.log('Teacher Store:')
const loading = ref(false)
const busyEntries = ref<Record<number, 'save' | 'delete'>>({})
const innovationData = ref<InnovationFormValue[]>([])
const documentLinksByInnovation = ref<Record<string, DocumentLinkRow[]>>({})
const formRenderKey = ref(0)
const innovationPersonId = ref('')
const departmentOptions = ref<{ label: string; value: string }[]>([])

const confirmModal = ref(false)
const action = ref('update')
const modalTopic = ref('ผลงานและนวัตกรรม')
const modalValue = ref('')
const pendingAction = ref<
  | { type: 'save'; index: number; values: InnovationFormValue }
  | { type: 'delete'; index: number; recordId?: string; values?: InnovationFormValue }
  | null
>(null)

const innovationFields: CreateFormSection[][] = [
  [
    {
      topic: 'ข้อมูลพื้นฐาน',
      content: [
        {
          name: 'academic_year',
          label: 'ปีการศึกษา',
          type: 'text',
          required: true,
          isShow: true,
          placeholder: '',
        },
        {
          name: 'project_title',
          label: 'หลักสูตร / เรื่อง / หัวข้อ',
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
          name: 'organizer',
          label: 'หน่วยงานที่จัด',
          type: 'text',
          required: true,
          placeholder: '',
        },
        { name: 'location', label: 'สถานที่จัด', type: 'text', placeholder: '' },
      ],
    },
    {
      topic: 'ข้อมูลผลงาน',
      content: [
        {
          name: 'achievement_level',
          label: 'ผลงานระดับ',
          type: 'select',
          required: true,
          placeholder: '',
          options: [
            { label: 'ระดับเขต', value: 'ระดับเขต' },
            { label: 'ระดับภาค', value: 'ระดับภาค' },
            { label: 'ระดับประเทศ', value: 'ระดับประเทศ' },
            { label: 'ระดับนานาชาติ', value: 'ระดับนานาชาติ' },
          ],
        },
        {
          name: 'award_name',
          label: 'ชื่อรางวัล',
          type: 'text',
          required: false,
          placeholder: 'เช่น รางวัลชนะเลิศ',
        },
      ],
    },
    {
      topic: 'ข้อมูลนักเรียนผู้เข้าร่วม',
      content: [],
      subEntryFieldName: 'innovation_student_awards',
      subFields: [
        {
          name: 'student_name',
          label: 'ชื่อนักเรียน',
          type: 'text',
          required: false,
          placeholder: '',
        },
        { name: 'class_level', label: 'ชั้น', type: 'text', required: false, placeholder: '' },
        { name: 'class_room', label: 'ห้อง', type: 'text', required: false, placeholder: '' },
      ],
    },
    {
      topic: 'ข้อมูลผู้ครูที่ดูแล',
      content: [
        { name: 'supervisor', label: 'ครูผู้ดูแล', type: 'text', required: false, placeholder: '' },
        {
          name: 'subject_group',
          label: 'กลุ่มสาระการเรียนรู้',
          type: 'select',
          required: false,
          placeholder: 'เลือกกลุ่มสาระการเรียนรู้',
          options: departmentOptions.value,
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

// const innovationFormFields = innovationFields.map((entry) =>
//   entry.filter((section) => section.content.length > 0),
// )

const innovationFormSnapshots = ref<InnovationFormValue[]>([])
const innovationStudentEntries = ref<InnovationStudentAwardRow[][]>([])
const innovationStudentDirty = ref<boolean[]>([])

function getCurrentUserName() {
  return (
    authStore.user?.name || authStore.user?.given_name || authStore.user?.email || 'current-user'
  )
}

function createEmptyInnovationForm(): InnovationFormValue {
  return {
    academic_year: '',
    achievement_level: '',
    award_name: '',
    project_title: '',
    start_date: '',
    end_date: '',
    organizer: '',
    location: '',
    supervisor: '',
    subject_group: '',
    'photo-file': [],
    'certificate-file': [],
    innovation_student_awards: [],
  }
}

function cloneInnovationStudents(students?: InnovationStudentAwardRow[] | null) {
  return Array.isArray(students) ? students.map((student) => ({ ...(student || {}) })) : []
}

function syncInnovationEntryState(entries: InnovationFormValue[]) {
  innovationFormSnapshots.value = entries.map((entry) => ({ ...entry }))
  innovationStudentEntries.value = entries.map((entry) =>
    cloneInnovationStudents(entry.innovation_student_awards),
  )
  innovationStudentDirty.value = entries.map(() => false)
}

function buildInnovationSaveValues(index: number, values?: InnovationFormValue) {
  return {
    ...(innovationData.value[index] || createEmptyInnovationForm()),
    ...(innovationFormSnapshots.value[index] || {}),
    ...(values || {}),
    innovation_student_awards: cloneInnovationStudents(innovationStudentEntries.value[index]),
  }
}

function readInnovationStudentsFromDom(index: number) {
  if (typeof document === 'undefined') {
    return cloneInnovationStudents(innovationStudentEntries.value[index])
  }

  const formElement = document.getElementById(`form-${index}`)
  if (!formElement) {
    return cloneInnovationStudents(innovationStudentEntries.value[index])
  }

  const previousStudents = cloneInnovationStudents(innovationStudentEntries.value[index])
  const rowElements = Array.from(
    formElement.querySelectorAll('div.mt-3.flex.items-end.gap-4'),
  ).filter((element) => element.querySelectorAll('input').length >= 3)

  if (!rowElements.length) return previousStudents

  return rowElements
    .map((rowElement, rowIndex) => {
      const textInputs = Array.from(rowElement.querySelectorAll('input')).slice(
        0,
        3,
      ) as HTMLInputElement[]
      const previousStudent = previousStudents[rowIndex] || {}

      return {
        ...previousStudent,
        student_name: textInputs[0]?.value?.trim() || '',
        class_level: textInputs[1]?.value?.trim() || '',
        class_room: textInputs[2]?.value?.trim() || '',
      }
    })
    .filter((student) => student.student_name || student.class_level || student.class_room)
}

function normalizeInnovationFiles(value: unknown): InnovationFileItem[] {
  if (!value) return []
  if (Array.isArray(value)) return value as InnovationFileItem[]
  return [value as InnovationFileItem]
}

function mapDropdownOptions<T extends Record<string, any>>(
  rows: T[],
  valueKeys: string[],
  labelKeys: string[],
) {
  const options = rows
    .map((row) => {
      const value = valueKeys.map((key) => row[key]).find((candidate) => candidate != null)
      const label = labelKeys.map((key) => row[key]).find((candidate) => candidate != null)
      if (value == null || label == null) return null
      return { label: String(label), value: String(value) }
    })
    .filter((option): option is { label: string; value: string } => Boolean(option))

  return sortDropdownOptionsByThaiLabel(options)
}

async function fetchDepartmentOptions() {
  try {
    for (const viewName of ['departments', 'department', 'subject_groups', 'subject_group']) {
      const response = await getDatasetRows<DepartmentRow>(
        MANAGE_DROPDOWN_DATASETS.DATASET_ID,
        MANAGE_DROPDOWN_DATASETS.DATASET_VERSION_DEPARTMENTS,
        { page: 1, per_page: 100, view: viewName },
      )
      const options = mapDropdownOptions(
        response.data || [],
        ['id', 'department_id', 'departments_id', 'subject_group_id', 'subject_groups_id'],
        [
          'department_name_th',
          'departments_name_th',
          'subject_group_name',
          'subject_groups_name',
          'name',
        ],
      )
      if (!options.length) continue
      departmentOptions.value.splice(0, departmentOptions.value.length, ...options)
      return
    }
  } catch (error) {
    console.error('Failed to load innovation department options:', error)
  }
}

function isExistingInnovationFile(file: InnovationFileItem): file is ExistingInnovationFile {
  return 'resource_id' in file && typeof file.resource_id === 'string'
}

function buildInnovationPurpose(values: Partial<InnovationRow>, fileField?: string) {
  const topic = values.project_title || 'ไม่ระบุหัวข้อ'

  if (fileField === 'photo-file') {
    return `ภาพการอบรม/ศึกษาดูงานสำหรับ ${topic}_${fileField}`
  }

  if (fileField === 'certificate-file') {
    return `ใบประกาศนียบัตรของ ${topic}_${fileField}`
  }

  return String(topic)
}

function matchesInnovationFileField(link: DocumentLinkRow, fileField: string) {
  if (!link.purpose) return fileField === INNOVATION_FILE_FIELDS[0]
  if (link.purpose.endsWith(`_${fileField}`)) return true
  return false
}

function formatInnovationRecord(record: InnovationRow) {
  return {
    ...record,
    innovation_student_awards: uniqueInnovationStudents(
      (record.innovation_student_awards || []).map((student) =>
        normalizeInnovationStudent(student),
      ),
    ),
    ...Object.fromEntries(
      INNOVATION_DATE_FIELDS.map((field) => [
        field,
        record[field] ? formatDateInput(record[field]) : null,
      ]),
    ),
  }
}

function buildInnovationPayload(
  values: InnovationFormValue,
  currentRecord?: InnovationRow,
  personId?: string,
) {
  const resolvedPersonId =
    personId ||
    teacherStore.personId ||
    teacherStore.currentTeacher?.id ||
    authStore.user?.id ||
    innovationPersonId.value ||
    currentRecord?.person_id ||
    values.person_id ||
    innovationData.value.find((record) => record.person_id)?.person_id ||
    ''
  const innovationId = currentRecord?.id || values.id || generateUUID()
  const createdAt = currentRecord?.created_at || values.created_at || new Date().toISOString()

  return {
    academic_year: values.academic_year || currentRecord?.academic_year || '',
    achievement_level: values.achievement_level || currentRecord?.achievement_level || null,
    award_name:
      typeof values.award_name === 'string'
        ? values.award_name.trim() || null
        : currentRecord?.award_name || null,
    created_at: createdAt,
    document_links: currentRecord?.document_links || values.document_links || [],
    end_date: values.end_date ? formatDateInput(values.end_date) : null,
    id: innovationId,
    location: values.location || currentRecord?.location || null,
    organizer: values.organizer || currentRecord?.organizer || '',
    person_id: resolvedPersonId,
    project_title: values.project_title || currentRecord?.project_title || '',
    start_date: values.start_date ? formatDateInput(values.start_date) : null,
    subject_group: values.subject_group || currentRecord?.subject_group || '',
    supervisor: values.supervisor || currentRecord?.supervisor || null,
    updated_at: currentRecord?.id ? new Date().toISOString() : null,
  }
}

function buildInnovationStudentPayload(
  student: InnovationStudentAwardRow,
  innovationId: string,
  personId: string,
  isExisting: boolean,
) {
  const now = new Date().toISOString()

  return {
    id: student.id || generateUUID(),
    innovation_id: innovationId,
    person_id: personId,
    student_name: student.student_name || '',
    class_level: student.class_level || '',
    class_room: student.class_room || '',
    created_at: student.created_at || now,
    updated_at: isExisting ? now : null,
  }
}

function resolveInnovationPersonId(values: InnovationFormValue, currentRecord?: InnovationRow) {
  return (
    teacherStore.personId ||
    teacherStore.currentTeacher?.id ||
    authStore.user?.id ||
    innovationPersonId.value ||
    currentRecord?.person_id ||
    values.person_id ||
    innovationData.value.find((record) => record.person_id)?.person_id ||
    ''
  )
}

function extractInnovationResponse(data: unknown) {
  if (!Array.isArray(data))
    return { records: [] as InnovationRow[], allDocumentLinks: [] as DocumentLinkRow[] }
  const source = Array.isArray(data[0]) ? data[0] : data
  const records = (source as InnovationRow[]) || []
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

function createExistingInnovationFile(
  file: FileDocument,
  link?: DocumentLinkRow,
): ExistingInnovationFile {
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

async function getInnovationFiles(
  record: InnovationRow,
  documentLinks: DocumentLinkRow[],
  fileField: string,
) {
  const matchedLinks = documentLinks.filter(
    (link) =>
      link.entity_id === record.id &&
      Boolean(link.document_key) &&
      matchesInnovationFileField(link, fileField),
  )
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
    const response = await getDatasetRows<InnovationRow>(
      DATASET_GET.DATASET_ID,
      DATASET_GET.DATASET_VERSION_INNOVATIONS,
      {
        view: INNOVATION_GET_VIEW,
        page: 1,
        per_page: 50,
      },
    )

    const { records, allDocumentLinks } = extractInnovationResponse(response.data)
    innovationPersonId.value = records[0]?.person_id || authStore.user?.id || ''
    documentLinksByInnovation.value = Object.fromEntries(
      records
        .filter((record) => Boolean(record.id))
        .map((record) => [
          record.id as string,
          allDocumentLinks.filter((link) => link.entity_id === record.id),
        ]),
    )

    innovationData.value = await Promise.all(
      records.map(async (record) => ({
        ...formatInnovationRecord(record),
        'photo-file': await getInnovationFiles(
          record,
          documentLinksByInnovation.value[record.id || ''] || [],
          'photo-file',
        ),
        'certificate-file': await getInnovationFiles(
          record,
          documentLinksByInnovation.value[record.id || ''] || [],
          'certificate-file',
        ),
      })),
    )
    syncInnovationEntryState(innovationData.value)

    formRenderKey.value += 1
  } catch (error: any) {
    console.error('Innovation API Error:', error)
    toast.error(
      `โหลดข้อมูลผลงานและนวัตกรรมไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      { position: 'bottom-right' },
    )
    innovationData.value = []
    documentLinksByInnovation.value = {}
    innovationPersonId.value = ''
    syncInnovationEntryState([])
    formRenderKey.value += 1
  } finally {
    loading.value = false
  }
}

async function uploadInnovationFiles(files: File[]) {
  if (!files.length) return []
  const params: CreateFileDocumentParams = {
    path: 'file-req',
    folder: 'file',
    uploaded_by: getCurrentUserName(),
    description: 'ผลงานและนวัตกรรม',
  }
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

async function createInnovationStudent(payload: Record<string, any>) {
  return createDatasetRow<InnovationRow>(
    DATASET_CONFIG.DATASET_ID,
    DATASET_CONFIG.DATASET_STUDENTS,
    payload,
    DATASET_CONFIG.VIEW_NAME_STUDENTS,
  )
}

async function updateInnovationStudent(recordId: string, payload: Record<string, any>) {
  return updateDatasetRow<InnovationRow>(
    DATASET_CONFIG.DATASET_ID,
    DATASET_CONFIG.DATASET_STUDENTS,
    recordId,
    payload,
    DATASET_CONFIG.VIEW_NAME_STUDENTS,
  )
}

async function deleteInnovationStudent(studentId: string) {
  return deleteDatasetRow(
    DELETE_CONFIG.DATASET_ID,
    DELETE_CONFIG.DATASET_VERSION_STUDENTS,
    studentId,
    DELETE_CONFIG.VIEW_NAME_STUDENTS,
  )
}

async function createInnovationData(payload: Record<string, any>) {
  return createDatasetRow<InnovationRow>(
    DATASET_CONFIG.DATASET_ID,
    DATASET_CONFIG.DATASET_VERSION,
    payload,
    DATASET_CONFIG.VIEW_NAME,
  )
}

async function updateInnovationData(recordId: string, payload: Record<string, any>) {
  return updateDatasetRow<InnovationRow>(
    DATASET_CONFIG.DATASET_ID,
    DATASET_CONFIG.DATASET_VERSION,
    recordId,
    payload,
    DATASET_CONFIG.VIEW_NAME,
  )
}

async function deleteInnovationData(recordId: string) {
  return deleteDatasetRow(DELETE_CONFIG.DATASET_ID, DELETE_CONFIG.DATASET_VERSION, recordId)
}

async function storeInnovationFiles(
  documentIds: string[],
  record: InnovationRow,
  fileField: string,
) {
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
    await deleteDatasetRow(
      DOCUMENT_DELETE_CONFIG.DATASET_ID,
      DOCUMENT_DELETE_CONFIG.DATASET_VERSION,
      documentLinkKey,
    )
  }
}

async function persistInnovationStudents(
  values: InnovationFormValue,
  innovationId: string,
  personId: string,
  currentRecord?: InnovationRow,
) {
  const changes = planInnovationStudentChanges(
    currentRecord?.innovation_student_awards,
    values.innovation_student_awards,
  )

  for (const student of changes.create) {
    const studentPayload = buildInnovationStudentPayload(student, innovationId, personId, false)
    await createInnovationStudent(studentPayload)
  }

  for (const student of changes.update) {
    if (!student.id) continue
    const studentPayload = buildInnovationStudentPayload(student, innovationId, personId, true)
    await updateInnovationStudent(student.id, studentPayload)
  }

  for (const studentId of changes.deleteIds) {
    await deleteInnovationStudent(studentId)
  }
}

async function persistInnovation(index: number, values: InnovationFormValue) {
  const currentRecord = innovationData.value[index]
  const existingRecordId = currentRecord?.id || values.id
  const persistedRecord = currentRecord || (existingRecordId ? values : undefined)
  const personId = resolveInnovationPersonId(values, currentRecord)
  const payload = buildInnovationPayload(values, persistedRecord, personId)
  const currentLinks = existingRecordId
    ? documentLinksByInnovation.value[existingRecordId] || []
    : []

  const removedLinks = INNOVATION_FILE_FIELDS.flatMap((fileField) => {
    const currentFiles = normalizeInnovationFiles(values[fileField])
    const existingFiles = currentFiles.filter(isExistingInnovationFile)
    const keptDocumentKeys = new Set(existingFiles.map((file) => file.resource_id))
    return currentLinks
      .filter((link) => matchesInnovationFileField(link, fileField))
      .filter((link) => !keptDocumentKeys.has(link.document_key))
  })

  const newFilesByField = Object.fromEntries(
    INNOVATION_FILE_FIELDS.map((fileField) => [
      fileField,
      normalizeInnovationFiles(values[fileField]).filter(
        (file): file is File => file instanceof File,
      ),
    ]),
  ) as Record<(typeof INNOVATION_FILE_FIELDS)[number], File[]>

  const hasFileChanges =
    removedLinks.length > 0 ||
    INNOVATION_FILE_FIELDS.some((fileField) => newFilesByField[fileField].length > 0)

  let createdRecordId = ''
  let uploadedDocumentKeys: string[] = []
  let createdDocumentLinks: DocumentLinkRow[] = []

  try {
    if (!existingRecordId) {
      const createdRecord = await createInnovationData(payload)
      createdRecordId = createdRecord.data?.id || ''
      await persistInnovationStudents(values, createdRecordId || payload.id, personId)

      for (const fileField of INNOVATION_FILE_FIELDS) {
        const uploadedKeys = await uploadInnovationFiles(newFilesByField[fileField])
        uploadedDocumentKeys.push(...uploadedKeys)
        if (uploadedKeys.length) {
          createdDocumentLinks.push(
            ...(await storeInnovationFiles(
              uploadedKeys,
              {
                ...payload,
                ...createdRecord.data,
                id: createdRecordId,
                person_id: createdRecord.data?.person_id || payload.person_id,
              },
              fileField,
            )),
          )
        }
      }

      toast.success('บันทึกข้อมูลผลงานและนวัตกรรมสำเร็จ', { position: 'bottom-right' })
      await getInnovationData()
      return
    }

    if (!hasFileChanges) {
      await updateInnovationData(existingRecordId, payload)
      await persistInnovationStudents(values, existingRecordId, personId, persistedRecord)
      toast.success('บันทึกข้อมูลผลงานและนวัตกรรมสำเร็จ', { position: 'bottom-right' })
      await getInnovationData()
      return
    }

    for (const fileField of INNOVATION_FILE_FIELDS) {
      const uploadedKeys = await uploadInnovationFiles(newFilesByField[fileField])
      uploadedDocumentKeys.push(...uploadedKeys)
      if (uploadedKeys.length) {
        createdDocumentLinks.push(
          ...(await storeInnovationFiles(
            uploadedKeys,
            {
              ...payload,
              ...persistedRecord,
              id: existingRecordId,
              person_id: persistedRecord?.person_id || payload.person_id,
            },
            fileField,
          )),
        )
      }
    }

    await updateInnovationData(existingRecordId, payload)
    await persistInnovationStudents(values, existingRecordId, personId, persistedRecord)

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
    toast.error(
      `บันทึกข้อมูลผลงานและนวัตกรรมไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      { position: 'bottom-right' },
    )
  }
}
/*
function handleInnovationFormChange(index: number, values: Record<string, any>) {
  innovationFormSnapshots.value[index] = buildInnovationSaveValues(index, values as InnovationFormValue)
}

function addInnovationEntry() {
  innovationData.value = [...innovationData.value, createEmptyInnovationForm()]
  innovationFormSnapshots.value = [...innovationFormSnapshots.value, createEmptyInnovationForm()]
  innovationStudentEntries.value = [...innovationStudentEntries.value, []]
  innovationStudentDirty.value = [...innovationStudentDirty.value, false]
  formRenderKey.value += 1
}

function addInnovationStudentRow(index: number) {
  innovationStudentEntries.value[index] = [...(innovationStudentEntries.value[index] || []), {}]
  innovationStudentDirty.value[index] = true
}

function updateInnovationStudentField(
  index: number,
  studentIndex: number,
  field: keyof InnovationStudentAwardRow,
  value: string,
) {
  const nextStudents = cloneInnovationStudents(innovationStudentEntries.value[index])
  nextStudents[studentIndex] = {
    ...(nextStudents[studentIndex] || {}),
    [field]: value,
  }
  innovationStudentEntries.value[index] = nextStudents
  innovationStudentDirty.value[index] = true
}

function removeInnovationStudentRow(index: number, studentIndex: number) {
  const nextStudents = cloneInnovationStudents(innovationStudentEntries.value[index])
  nextStudents.splice(studentIndex, 1)
  innovationStudentEntries.value[index] = nextStudents
  innovationStudentDirty.value[index] = true
}

function requestInnovationStudentSave(index: number) {
  queueInnovationSave(index, buildInnovationSaveValues(index))
}
*/
function handleSave(index: number, values: Record<string, any>) {
  if (busyEntries.value[index]) return
  innovationStudentEntries.value[index] = readInnovationStudentsFromDom(index)
  const mergedValues = buildInnovationSaveValues(index, values as InnovationFormValue)
  pendingAction.value = { type: 'save', index, values: mergedValues }
  action.value = innovationData.value[index]?.id ? 'update' : 'add'
  modalValue.value = `ผลงานและนวัตกรรม ${values['course-title'] || ''}`
  confirmModal.value = true
}

// function queueInnovationSave(index: number, values: Record<string, any>) {
//   if (busyEntries.value[index]) return
//   const mergedValues = buildInnovationSaveValues(index, values as InnovationFormValue)
//   pendingAction.value = { type: 'save', index, values: mergedValues }
//   action.value = innovationData.value[index]?.id ? 'update' : 'add'
//   modalValue.value = `ข้อมูลผลงานและนวัตกรรม`
//   confirmModal.value = true
// }

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
    toast.error(
      `ลบข้อมูลผลงานและนวัตกรรมไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      { position: 'bottom-right' },
    )
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
  void fetchDepartmentOptions()
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

<style scoped>
.innovation-entry-form > div:first-child {
  display: none;
}
</style>
