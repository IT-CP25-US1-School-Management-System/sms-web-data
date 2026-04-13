<script setup lang="ts">
import NormalForm, {
  type NormalFormChangePayload,
  type NormalFormField,
} from '@/components/form/NormalForm.vue'
import { Button } from '@/components/ui/button'
import { MANAGE_DATASETS, MANAGE_DROPDOWN_DATASETS } from '@/lib/constants'
import { formatDateInput } from '@/lib/helpers'
import { ArrowUpFromLine } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { updateTeacher, useTeacherStore } from '@/stores/teachers'
import { createDatasetRow, getDatasetRows, updateDatasetRow } from '@/stores/dataset'
import { exportData, getUrlFile } from '@/stores/reporting'
import type { ExportJobRequest, GetExportJobResponse } from '@/types/reporting'
type PositionRow = Record<string, any> & {
  id?: string
  person_id?: string
  created_at?: string
  updated_at?: string | null
  person_data?: Record<string, any>
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
type DepartmentRow = {
  id?: number | string
  department_id?: number | string
  departments_id?: number | string
  subject_group_id?: number | string
  subject_groups_id?: number | string
  department_name_th?: string
  departments_name_th?: string
  subject_group_name_th?: string
  subject_groups_name_th?: string
  name_th?: string
  name?: string
}
type AppointmentTypeRow = {
  id?: number | string
  appointment_type_id?: number | string
  appointment_types_id?: number | string
  appointment_type_name_th?: string
  appointment_types_name_th?: string
  name_th?: string
  name?: string
}

type NormalFormInstance = InstanceType<typeof NormalForm>

type PositionFormState = {
  id: string
  source?: PositionRow
  initialValues: Record<string, any>
  currentValues: Record<string, any>
  formRef: NormalFormInstance | null
  hasChanges: boolean
}

const loading = ref(false)
const positionForms = ref<PositionFormState[]>([])
const pendingPayloads = new Map<string, Record<string, any>>()
const fileUrl = ref('')
const formRenderKey = ref(0)
const roleOptions = ref<{ label: string; value: string }[]>([])
const departmentOptions = ref<{ label: string; value: string }[]>([])
const appointmentTypeOptions = ref<{ label: string; value: string }[]>([])

const POSITION_HISTORY_DATASET = {
  DATASET_ID: MANAGE_DATASETS.DATASET_ID,
  DATASET_VERSION: MANAGE_DATASETS.DATASET_VERSION_POSITION_HISTORY,
  VIEW_NAME: MANAGE_DATASETS.VIEW_POSITION_HISTORY,
} as const

const route = useRoute()
const teacherStore = useTeacherStore()

function getPersonId(): string | undefined {
  const idFromUrl = route.query.id as string | undefined
  const personId = idFromUrl || teacherStore.personId || undefined

  if (idFromUrl && teacherStore.personId !== idFromUrl) {
    teacherStore.setPersonId(idFromUrl)
  }

  return personId
}

function mapDropdownOptions<T extends Record<string, any>>(
  rows: T[],
  valueKeys: string[],
  labelKeys: string[],
) {
  return rows
    .map((item) => {
      const value = valueKeys.map((key) => item[key]).find((candidate) => candidate !== undefined)
      const label = labelKeys.map((key) => item[key]).find((candidate) => Boolean(candidate))

      if (value === undefined || !label) return null

      return {
        label: String(label),
        value: String(value),
      }
    })
    .filter((item): item is { label: string; value: string } => Boolean(item))
}

async function fetchRoleOptions() {
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

      const mappedOptions = mapDropdownOptions(
        response.data || [],
        ['id', 'role_id', 'roles_id'],
        ['role_name_th', 'roles_name_th', 'name_th', 'name'],
      )

      if (mappedOptions.length > 0) {
        roleOptions.value.splice(0, roleOptions.value.length, ...mappedOptions)
        formRenderKey.value += 1
        return
      }
    }
  } catch (error) {
    console.error('Failed to load role options:', error)
  }
}

async function fetchDepartmentOptions() {
  try {
    for (const viewName of ['departments', 'department', 'subject_groups', 'subject_group']) {
      const response = await getDatasetRows<DepartmentRow>(
        MANAGE_DROPDOWN_DATASETS.DATASET_ID,
        MANAGE_DROPDOWN_DATASETS.DATASET_VERSION_DEPARTMENTS,
        {
          view: viewName,
          page: 1,
          per_page: 100,
        },
      )

      const mappedOptions = mapDropdownOptions(
        response.data || [],
        ['id', 'department_id', 'departments_id', 'subject_group_id', 'subject_groups_id'],
        [
          'department_name_th',
          'departments_name_th',
          'subject_group_name_th',
          'subject_groups_name_th',
          'name_th',
          'name',
        ],
      )

      if (mappedOptions.length > 0) {
        departmentOptions.value.splice(0, departmentOptions.value.length, ...mappedOptions)
        formRenderKey.value += 1
        return
      }
    }
  } catch (error) {
    console.error('Failed to load department options:', error)
  }
}

async function fetchAppointmentTypeOptions() {
  try {
    const response = await getDatasetRows<AppointmentTypeRow>(
      MANAGE_DROPDOWN_DATASETS.DATASET_ID,
      MANAGE_DROPDOWN_DATASETS.DATASET_VERSION_APPOINTMENT_TYPES,
      {
        view: MANAGE_DROPDOWN_DATASETS.VIEW_APPOINTMENT_TYPES,
        page: 1,
        per_page: 100,
      },
    )

    const mappedOptions = mapDropdownOptions(
      response.data || [],
      ['id', 'appointment_type_id', 'appointment_types_id'],
      ['appointment_type_name_th', 'appointment_types_name_th', 'name_th', 'name'],
    )

    if (mappedOptions.length > 0) {
      appointmentTypeOptions.value.splice(0, appointmentTypeOptions.value.length, ...mappedOptions)
      formRenderKey.value += 1
    }
  } catch (error) {
    console.error('Failed to load appointment type options:', error)
  }
}

const positionFields: NormalFormField[] = [
  {
    name: 'executive_group',
    label: 'กลุ่มงาน',
    type: 'select',
    required: true,
    disabled: false,
    placeholder: '',
    options: [
      { label: 'ผู้บริหาร', value: 'ผู้บริหาร' },
      { label: 'กลุ่มบริหารวิชาการ', value: 'กลุ่มบริหารวิชาการ' },
      { label: 'กลุ่มบริหารงานบุคคล', value: 'กลุ่มบริหารงานบุคคล' },
      { label: 'กลุ่มบริหารงบประมาณและธุรการ', value: 'กลุ่มบริหารงบประมาณและธุรการ' },
      { label: 'กลุ่มบริหารทั่วไป', value: 'กลุ่มบริหารทั่วไป' },
      { label: 'สำนักผู้อำนวยการ', value: 'สำนักผู้อำนวยการ' },
    ],
  },
  {
    name: 'subject_group',
    label: 'กลุ่มสาระ',
    type: 'select',
    required: true,
    disabled: false,
    placeholder: '',
    options: [
      { label: 'กลุ่มสาระฯภาษาไทย', value: 'กลุ่มสาระฯภาษาไทย' },
      { label: 'กลุ่มสาระฯคณิตศาสตร์', value: 'กลุ่มสาระฯคณิตศาสตร์' },
      { label: 'กลุ่มสาระฯวิทยาศาสตร์และเทคโนโลยี', value: 'กลุ่มสาระฯวิทยาศาสตร์และเทคโนโลยี' },
      {
        label: 'กลุ่มสาระฯสังคมศึกษา ศาสนา และวัฒนธรรม',
        value: 'กลุ่มสาระฯสังคมศึกษา ศาสนา และวัฒนธรรม',
      },
      { label: 'กลุ่มสาระฯภาษาต่างประเทศ', value: 'กลุ่มสาระฯภาษาต่างประเทศ' },
      { label: 'กลุ่มสาระฯการงานอาชีพ', value: 'กลุ่มสาระฯการงานอาชีพ' },
      { label: 'กลุ่มสาระฯสุขศึกษาและพลศึกษา', value: 'กลุ่มสาระฯสุขศึกษาและพลศึกษา' },
      { label: 'กลุ่มสาระฯศิลปะ', value: 'กลุ่มสาระฯศิลปะ' },
      { label: 'งานคอมพิวเตอร์', value: 'งานคอมพิวเตอร์' },
      { label: 'งานแนะแนว', value: 'งานแนะแนว' },
      { label: 'งานบรรณารักษ์', value: 'งานบรรณารักษ์' },
      { label: 'บุคลากรทางการศึกษา', value: 'บุคลากรทางการศึกษา' },
    ],
  },
  { name: 'position', label: 'ตำแหน่ง', type: 'text', disabled: false, placeholder: '' },
  {
    name: 'work_status',
    label: 'สถานภาพการทำงาน',
    type: 'select',
    disabled: false,
    placeholder: 'เลือกสถานภาพการทำงาน',
    options: [
      { label: 'ทำงาน', value: 'ทำงาน' },
      { label: 'ย้าย', value: 'ย้าย' },
      { label: 'เกษียณอายุราชการ', value: 'เกษียณอายุราชการ' },
      { label: 'ช่วยราชการ', value: 'ช่วยราชการ' },
      { label: 'ลาออก', value: 'ลาออก' },
      { label: 'เสียชีวิต', value: 'เสียชีวิต' },
    ],
  },
  { name: 'direct_pay_no', label: 'เลขที่จ่ายตรง', type: 'text', disabled: false, placeholder: '' },
  {
    name: 'position_number',
    label: 'เลขที่ตำแหน่ง',
    type: 'text',
    disabled: false,
    placeholder: '',
  },
  {
    name: 'appointment_type',
    label: 'ประเภทการบรรจุ',
    type: 'text',
    disabled: false,
    placeholder: 'เลือกประเภทการบรรจุ',
  },
  {
    name: 'appointment_date',
    label: 'ว/ด/ป ที่บรรจุ',
    type: 'date',
    disabled: false,
    placeholder: 'วว / ดด / ปปปป',
  },
  {
    name: 'service_start_date',
    label: 'ว/ด/ป ที่เริ่มปฏิบัติราชการ',
    type: 'date',
    disabled: false,
    placeholder: 'วว / ดด / ปปปป',
  },
  {
    name: 'retirement_date',
    label: 'วัน / เดือน / ปี เกษียณ',
    type: 'date',
    disabled: false,
    placeholder: 'วว / ดด / ปปปป',
  },
  {
    name: 'position_held_date',
    label: 'ว/ด/ป ที่ดำรงตำแหน่ง',
    type: 'date',
    disabled: false,
    placeholder: 'วว / ดด / ปปปป',
  },
  {
    name: 'school_entry_date',
    label: 'ว/ด/ป ที่ปฏิบัติหน้าที่ในโรงเรียนคณะราษฎร์ฯ',
    type: 'date',
    disabled: false,
    placeholder: 'วว / ดด / ปปปป',
  },
  {
    name: 'work_age_from_appointment',
    label: 'อายุงาน(นับจากวันบรรจุ)',
    type: 'text',
    disabled: false,
    placeholder: '',
  },
  {
    name: 'work_age_at_school',
    label: 'อายุงาน ณ โรงเรียนคณะราษฎร์ฯ',
    type: 'text',
    disabled: false,
    placeholder: '',
  },
]

const departmentField = positionFields.find((field) => field.name === 'subject_group')
if (departmentField) {
  departmentField.name = 'department_id'
  departmentField.placeholder = 'เลือกกลุ่มงาน/กลุ่มสาระ'
  departmentField.options = departmentOptions.value
}

const roleField = positionFields.find((field) => field.name === 'position')
if (roleField) {
  roleField.name = 'role_id'
  roleField.type = 'select'
  roleField.placeholder = 'เลือกบทบาท'
  roleField.options = roleOptions.value
}

const appointmentTypeField = positionFields.find((field) => field.name === 'appointment_type')
if (appointmentTypeField) {
  appointmentTypeField.name = 'appointment_type_id'
  appointmentTypeField.type = 'select'
  appointmentTypeField.options = appointmentTypeOptions.value
}

function cloneFormValues(values: Record<string, any> = {}) {
  return JSON.parse(JSON.stringify(values))
}

function extractPositionRecords(data: unknown): PositionRow[] {
  if (!Array.isArray(data) || !data.length) return []

  const firstItem = data[0]
  if (
    firstItem &&
    typeof firstItem === 'object' &&
    Array.isArray((firstItem as Record<string, unknown>)[POSITION_HISTORY_DATASET.VIEW_NAME])
  ) {
    return (firstItem as Record<string, PositionRow[]>)[POSITION_HISTORY_DATASET.VIEW_NAME] || []
  }

  return data as PositionRow[]
}

function sortPositionRecords(records: PositionRow[]) {
  return [...records].sort((left, right) => {
    const leftTime = new Date(left.updated_at || left.created_at || 0).getTime()
    const rightTime = new Date(right.updated_at || right.created_at || 0).getTime()
    return rightTime - leftTime
  })
}

function formatPositionRecord(record: PositionRow): PositionRow {
  const personData =
    record.person_data && typeof record.person_data === 'object' ? record.person_data : undefined

  return {
    ...record,
    person_id: record.person_id || personData?.id || '',
    department_id:
      record.department_id !== undefined && record.department_id !== null
        ? String(record.department_id)
        : personData?.department_id !== undefined && personData?.department_id !== null
          ? String(personData.department_id)
          : '',
    role_id:
      record.role_id !== undefined && record.role_id !== null
        ? String(record.role_id)
        : personData?.role_id
          ? String(personData.role_id)
          : '',
    appointment_type_id:
      record.appointment_type_id !== undefined && record.appointment_type_id !== null
        ? String(record.appointment_type_id)
        : record.appointment_type
          ? String(record.appointment_type)
          : '',
    appointment_date: formatDateInput(record.appointment_date ?? record.government_entry_date),
    service_start_date: formatDateInput(record.service_start_date),
    retirement_date: formatDateInput(record.retirement_date),
    position_held_date: formatDateInput(record.position_held_date ?? record.position_date),
    school_entry_date: formatDateInput(record.school_entry_date),
  }
}

function normalizeDateForPayload(date?: string | Date | null) {
  const formatted = formatDateInput(date)
  return formatted || null
}

function normalizeSelectValue(value: unknown) {
  if (value === undefined || value === null || String(value).trim() === '') return null
  if (typeof value === 'number') return value

  const normalized = String(value).trim()
  return /^\d+$/.test(normalized) ? Number(normalized) : normalized
}

function normalizeTeacherRoleId(value: unknown): string | undefined {
  if (value === undefined || value === null || String(value).trim() === '') return undefined
  return String(value).trim()
}

function normalizeTeacherDepartmentId(value: unknown): number | undefined {
  if (value === undefined || value === null || String(value).trim() === '') return undefined
  if (typeof value === 'number') return value

  const normalized = String(value).trim()
  return /^\d+$/.test(normalized) ? Number(normalized) : undefined
}

function createPositionFormState(source?: PositionRow, index = 0): PositionFormState {
  const initialValues = cloneFormValues(source || {})
  const generatedId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `position-${Date.now()}-${index}`

  return {
    id: source?.id || generatedId,
    source,
    initialValues,
    currentValues: cloneFormValues(initialValues),
    formRef: null,
    hasChanges: false,
  }
}

async function getPositionData() {
  loading.value = true
  try {
    const personId = getPersonId()

    if (!personId) {
      positionForms.value = [createPositionFormState(undefined, 0)]
      toast.error('ไม่พบ ID ของบุคลากร', {
        position: 'bottom-right',
      })
      return
    }

    const response = await getDatasetRows(
      POSITION_HISTORY_DATASET.DATASET_ID,
      POSITION_HISTORY_DATASET.DATASET_VERSION,
      {
        view: POSITION_HISTORY_DATASET.VIEW_NAME,
        page: 1,
        per_page: 50,
        where: [
          [
            {
              table_name: POSITION_HISTORY_DATASET.VIEW_NAME,
              field: 'person_id',
              operator: '=',
              value: personId,
            },
          ],
        ],
      },
    )

    const records = sortPositionRecords(extractPositionRecords(response.data)).map(
      formatPositionRecord,
    )
    const primaryRecord = records[0]

    if (records.length > 1) {
      toast.info('พบข้อมูลดำรงตำแหน่งมากกว่า 1 รายการ ระบบจะแสดงเฉพาะรายการล่าสุด', {
        position: 'bottom-right',
      })
    }

    positionForms.value = [createPositionFormState(primaryRecord, 0)]
  } catch (error: any) {
    console.error('Position API Error:', error)
    toast.error(`โหลดข้อมูลตำแหน่งไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
    positionForms.value = [createPositionFormState(undefined, 0)]
  } finally {
    loading.value = false
  }
}

function setPositionFormRef(formId: string, instance: NormalFormInstance | null) {
  const target = positionForms.value.find((form) => form.id === formId)
  if (target) {
    target.formRef = instance
  }
}

function handleFormChange(formId: string, payload: NormalFormChangePayload) {
  const target = positionForms.value.find((form) => form.id === formId)
  if (!target) return

  target.currentValues = cloneFormValues(payload.values)
  target.hasChanges = JSON.stringify(target.currentValues) !== JSON.stringify(target.initialValues)
}

function buildPositionPayload(
  source: PositionRow | undefined,
  payload: Record<string, any>,
  personId?: string,
  fallbackId?: string,
): PositionRow {
  const roleId = payload.role_id ?? source?.role_id ?? null
  const departmentId = payload.department_id ?? source?.department_id
  const appointmentTypeId = payload.appointment_type_id ?? source?.appointment_type_id
  const appointmentDate =
    payload.appointment_date ?? payload.government_entry_date ?? source?.government_entry_date
  const retirementDate = payload.retirement_date ?? payload.birth_date ?? source?.retirement_date
  const positionDate = payload.position_held_date ?? payload.position_date ?? source?.position_date
  const serviceStartDate = payload.service_start_date ?? source?.service_start_date
  const schoolEntryDate = payload.school_entry_date ?? source?.school_entry_date

  const restPayload = { ...payload }
  delete restPayload.person_data
  delete restPayload.role_id
  delete restPayload.department_id
  delete restPayload.appointment_type_id
  delete restPayload.appointment_date
  delete restPayload.retirement_date
  delete restPayload.birth_date
  delete restPayload.position_held_date
  delete restPayload.school_entry_date
  delete restPayload.service_start_date

  const restSource = { ...(source || {}) }
  delete restSource.person_data
  delete restSource.role_id
  delete restSource.department_id
  delete restSource.appointment_type_id
  delete restSource.appointment_date
  delete restSource.retirement_date
  delete restSource.birth_date
  delete restSource.position_held_date
  delete restSource.school_entry_date
  delete restSource.service_start_date

  const resolvedId = source?.id || payload.id || fallbackId || ''
  const resolvedCreatedAt = source?.created_at || payload.created_at || new Date().toISOString()

  return {
    ...restSource,
    ...restPayload,
    id: resolvedId,
    person_id: personId || source?.person_id || payload.person_id || '',
    role_id: normalizeSelectValue(roleId),
    department_id: normalizeSelectValue(departmentId),
    appointment_type_id: normalizeSelectValue(appointmentTypeId),
    government_entry_date: normalizeDateForPayload(appointmentDate),
    service_start_date: normalizeDateForPayload(serviceStartDate),
    retirement_date: normalizeDateForPayload(retirementDate),
    position_date: normalizeDateForPayload(positionDate),
    school_entry_date: normalizeDateForPayload(schoolEntryDate),
    created_at: resolvedCreatedAt,
    updated_at: source?.id ? new Date().toISOString() : null,
  }
}

function buildPersonDataPayload(source: PositionRow | undefined, payload: Record<string, any>) {
  const personData =
    source?.person_data && typeof source.person_data === 'object' ? source.person_data : {}
  const resolvedPersonId =
    personData.id ?? source?.person_id ?? payload.person_id ?? getPersonId() ?? undefined
  const resolvedCreatedAt =
    personData.created_at ?? payload.created_at ?? source?.created_at ?? new Date().toISOString()

  return {
    ...personData,
    id: resolvedPersonId,
    created_at: resolvedCreatedAt,
    updated_at: new Date().toISOString(),
    role_id: normalizeTeacherRoleId(payload.role_id ?? source?.role_id ?? personData.role_id),
    department_id: normalizeTeacherDepartmentId(
      payload.department_id ?? source?.department_id ?? personData.department_id,
    ),
  }
}

function handleFormSave(formId: string, values: Record<string, any>) {
  const target = positionForms.value.find((form) => form.id === formId)
  if (!target) return

  pendingPayloads.set(formId, buildPositionPayload(target.source, values, getPersonId(), formId))
}

const hasAnyChanges = computed(() => positionForms.value.some((form) => form.hasChanges))

const hasAnyInvalidRequired = computed(() =>
  positionForms.value.some((form) => Boolean(form.formRef?.hasMissingRequiredFields)),
)

const isSaveDisabled = computed(
  () => loading.value || !hasAnyChanges.value || hasAnyInvalidRequired.value,
)

async function createPositionData(payload: Record<string, any>) {
  return createDatasetRow<PositionRow>(
    POSITION_HISTORY_DATASET.DATASET_ID,
    POSITION_HISTORY_DATASET.DATASET_VERSION,
    payload,
    POSITION_HISTORY_DATASET.VIEW_NAME,
  )
}

async function updatePositionData(recordId: string, payload: Record<string, any>) {
  return updateDatasetRow<PositionRow>(
    POSITION_HISTORY_DATASET.DATASET_ID,
    POSITION_HISTORY_DATASET.DATASET_VERSION,
    recordId,
    payload,
    POSITION_HISTORY_DATASET.VIEW_NAME,
  )
}

async function persistPositionData() {
  loading.value = true
  try {
    const personId = getPersonId()

    if (!personId) {
      toast.error('ไม่พบ ID ของบุคลากร', {
        position: 'bottom-right',
      })
      return
    }

    for (const form of positionForms.value.filter((entry) => entry.hasChanges)) {
      const payload = pendingPayloads.get(form.id)
      if (!payload) continue

      const normalizedPayload = buildPositionPayload(form.source, payload, personId, form.id)
      const personPayload = buildPersonDataPayload(form.source, payload)

      if (form.source?.id) {
        await updatePositionData(String(form.source.id), normalizedPayload)
        await updateTeacher(personId, personPayload)
        continue
      }

      await createPositionData(normalizedPayload)
      await updateTeacher(personId, personPayload)
    }

    toast.success('บันทึกข้อมูลตำแหน่งสำเร็จ', { position: 'bottom-right' })
    pendingPayloads.clear()
    await getPositionData()
  } catch (error: any) {
    console.error('Position update error:', error)
    toast.error(
      `บันทึกข้อมูลตำแหน่งไม่สำเร็จ: ${error?.response?.data?.message || error.message}`,
      {
        position: 'bottom-right',
      },
    )
  } finally {
    loading.value = false
  }
}

async function onSaveAll() {
  pendingPayloads.clear()

  const validationResults: boolean[] = []

  for (const form of positionForms.value) {
    if (form.formRef?.submitForm) {
      const valid = await form.formRef.submitForm()
      validationResults.push(valid)
    }
  }

  if (validationResults.some((valid) => valid === false)) {
    return
  }

  if (!pendingPayloads.size) return

  await persistPositionData()
}

async function downloadTemplateFile(fileUrl: string, fileName: string) {
  const response = await fetch(fileUrl)
  if (!response.ok) {
    throw new Error('ดาวน์โหลดไฟล์ไม่สำเร็จ')
  }

  const blob = await response.blob()
  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = blobUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(blobUrl)
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function pollExportJob(jobId: string): Promise<GetExportJobResponse> {
  const maxAttempts = 30
  const intervalMs = 2000

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await getUrlFile(jobId)
    const status = response.data.status?.toLowerCase()

    if (status === 'succeeded' && response.data.destination_uri) {
      return response
    }

    if (status === 'failed') {
      throw new Error(response.data.error_message || 'Export failed')
    }

    await sleep(intervalMs)
  }

  throw new Error('Timed out waiting for export file')
}

function getDownloadFileName(downloadUrl: string) {
  try {
    const url = new URL(downloadUrl)
    const fileName = url.pathname.split('/').pop()
    if (fileName) return decodeURIComponent(fileName)
  } catch {
    const fileName = downloadUrl.split('/').pop()
    if (fileName) return decodeURIComponent(fileName)
  }

  return 'position_export.csv'
}

async function handleDownloadTemplate() {
  try {
    loading.value = true
    fileUrl.value = ''

    const payload: ExportJobRequest = {
      dataset_id: POSITION_HISTORY_DATASET.DATASET_ID,
      version: POSITION_HISTORY_DATASET.DATASET_VERSION,
      view: POSITION_HISTORY_DATASET.VIEW_NAME,
      format: 'csv',
    }

    const exportResponse = await exportData(payload)

    if (!exportResponse.job_id) {
      throw new Error('Missing export job id')
    }

    const exportResult = await pollExportJob(exportResponse.job_id)
    fileUrl.value = exportResult.data.destination_uri || ''

    if (!fileUrl.value) {
      throw new Error('Export file URL not found')
    }

    await downloadTemplateFile(fileUrl.value, getDownloadFileName(fileUrl.value))
  } catch (error: any) {
    toast.error('Export data failed: ' + (error?.message || 'Unknown error'), {
      position: 'bottom-right',
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void fetchRoleOptions()
  void fetchDepartmentOptions()
  void fetchAppointmentTypeOptions()
  void getPositionData()
})
</script>

<template>
  <div class="flex flex-col">
    <div class="sticky right-0 bottom-0 z-40 flex w-full justify-end bg-white p-3">
      <Button
        @click="handleDownloadTemplate()"
        class="cursor-pointer rounded-lg bg-[#1675dc] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#1567be]"
      >
        <ArrowUpFromLine />
        Export Data
      </Button>
    </div>

    <div class="flex-1 space-y-4 overflow-y-auto px-4 sm:px-6">
      <div v-for="form in positionForms" :key="`${form.id}-${formRenderKey}`">
        <NormalForm
          :topic="'ข้อมูลตำแหน่ง'"
          :ref="(instance) => setPositionFormRef(form.id, instance as NormalFormInstance | null)"
          :values="form.initialValues"
          :fields="positionFields"
          @change="(payload) => handleFormChange(form.id, payload)"
          @save="(values) => handleFormSave(form.id, values)"
        >
        </NormalForm>
      </div>
    </div>

    <div
      class="sticky right-0 bottom-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3"
    >
      <Button
        :disabled="isSaveDisabled"
        @click="onSaveAll"
        class="rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]"
      >
        บันทึก
      </Button>
    </div>
  </div>
</template>
