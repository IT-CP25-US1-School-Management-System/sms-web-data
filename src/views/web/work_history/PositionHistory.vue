<script setup lang="ts">
import NormalForm, {
  type NormalFormChangePayload,
  type NormalFormField,
} from '@/components/form/NormalForm.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { Button } from '@/components/ui/button'
import { DATASET_EDIT, DATASET_GET ,REPORTING } from '@/lib/constants'
import { ArrowUpFromLine } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { getDatasetRows, updateDatasetRow } from '@/stores/dataset'
import { exportData, getUrlFile } from '@/stores/reporting'
import type { ExportJobRequest, GetExportJobResponse } from '@/types/reporting'
import { Spinner } from '@/components/ui/spinner'
import SkeletonCard from '@/components/SkeletonCard.vue'
type PositionRow = Record<string, any> & {
  id?: string
  person_id?: string
  created_at?: string
  updated_at?: string | null
}

type PersonalRow = Record<string, any> & {
  department_id?: string
  roles?: {
    roles_name?: string
  } | null
  departments?: {
    departments_name?: string
    departments_created_at?: string
  } | null
}

type DepartmentRow = {
  id?: number
  name?: string
  created_at?: string
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
const isExporting = ref(false)
const positionForms = ref<PositionFormState[]>([])
const pendingPayloads = new Map<string, Record<string, any>>()
const personalDepartment = ref<DepartmentRow | null>(null)
const fileUrl = ref('')

const action = ref('update')
const modalTopic = ref('ข้อมูลตำแหน่ง')
const modalValue = ref('')
const confirmModal = ref(false)
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
  { name: 'position', label: 'ตำแหน่ง', type: 'text', disabled: true, placeholder: '' },
  { name: 'work_status', label: 'สถานภาพการทำงาน', type: 'text', disabled: true, placeholder: '' },
  { name: 'direct_pay_no', label: 'เลขที่จ่ายตรง', type: 'text', disabled: true, placeholder: '' },
  {
    name: 'position_number',
    label: 'เลขที่ตำแหน่ง',
    type: 'text',
    disabled: true,
    placeholder: '',
  },
  {
    name: 'appointment_type',
    label: 'ประเภทการบรรจุ',
    type: 'text',
    disabled: true,
    placeholder: 'เลือกประเภทการบรรจุ',
  },
  {
    name: 'government_entry_date',
    label: 'ว/ด/ป ที่บรรจุ',
    type: 'date',
    disabled: true,
    placeholder: 'วว / ดด / ปปปป',
  },
  {
    name: 'service_start_date',
    label: 'ว/ด/ป ที่เริ่มปฏิบัติราชการ',
    type: 'date',
    disabled: true,
    placeholder: 'วว / ดด / ปปปป',
  },
  {
    name: 'retirement_date',
    label: 'วัน / เดือน / ปี เกษียณ',
    type: 'date',
    disabled: true,
    placeholder: 'วว / ดด / ปปปป',
  },
  {
    name: 'position_date',
    label: 'ว/ด/ป ที่ดำรงตำแหน่ง',
    type: 'date',
    disabled: true,
    placeholder: 'วว / ดด / ปปปป',
  },
  {
    name: 'school_entry_date',
    label: 'ว/ด/ป ที่ปฏิบัติหน้าที่ในโรงเรียนคณะราษฎร์ฯ',
    type: 'date',
    disabled: true,
    placeholder: 'วว / ดด / ปปปป',
  },
  {
    name: 'work_age_from_appointment',
    label: 'อายุงาน(นับจากวันบรรจุ)',
    type: 'text',
    disabled: true,
    placeholder: '',
  },
  {
    name: 'work_age_at_school',
    label: 'อายุงาน ณ โรงเรียนคณะราษฎร์ฯ',
    type: 'text',
    disabled: true,
    placeholder: '',
  },
]

function cloneFormValues(values: Record<string, any> = {}) {
  return JSON.parse(JSON.stringify(values))
}

function parseDateValue(dateValue?: string | Date | null) {
  if (!dateValue) return null

  if (dateValue instanceof Date) {
    if (Number.isNaN(dateValue.getTime())) return null
    return new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate())
  }

  const datePart = dateValue.split('T')[0] || ''
  const [year, month, day] = datePart.split('-').map(Number)
  if (!year || !month || !day) return null

  const parsedDate = new Date(year, month - 1, day)
  if (Number.isNaN(parsedDate.getTime())) return null

  return parsedDate
}

function calculateWorkAge(dateValue?: string | Date | null) {
  const startDate = parseDateValue(dateValue)
  if (!startDate) return ''

  const today = new Date()
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  if (startDate > currentDate) return '0 วัน'

  let years = currentDate.getFullYear() - startDate.getFullYear()
  let months = currentDate.getMonth() - startDate.getMonth()
  let days = currentDate.getDate() - startDate.getDate()

  if (days < 0) {
    const previousMonthLastDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0,
    ).getDate()
    days += previousMonthLastDay
    months -= 1
  }

  if (months < 0) {
    months += 12
    years -= 1
  }

  const parts = [
    years > 0 ? `${years} ปี` : '',
    months > 0 ? `${months} เดือน` : '',
    days > 0 ? `${days} วัน` : '',
  ].filter(Boolean)

  return parts.join(' ') || '0 วัน'
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
    const [positionResponse, personalResponse] = await Promise.all([
      getDatasetRows(DATASET_GET.DATASET_ID, DATASET_GET.DATASET_VERSION, {
        view: 'position_get',
        page: 1,
        per_page: 50,
      }),
      getDatasetRows(DATASET_GET.DATASET_ID, DATASET_GET.DATASET_VERSION, {
        view: 'personal_get',
        page: 1,
        per_page: 50,
      }),
    ])
    console.log('Position Response:', positionResponse.data)
    console.log('Personal Response:', personalResponse.data)
    const records = positionResponse.data?.[0]?.governments || []
    const personalRecord: PersonalRow = personalResponse.data?.[0] || {}
    const positionName = personalRecord.roles?.roles_name || ''
    const subjectGroup = personalRecord.departments?.departments_name || ''
    personalDepartment.value = personalRecord.departments
      ? {
          id: personalRecord.department_id ? Number(personalRecord.department_id) : undefined,
          name: personalRecord.departments.departments_name,
          created_at: personalRecord.departments.departments_created_at,
        }
      : null
   
    positionForms.value = (records.length ? records : [undefined]).map((record: PositionRow | undefined, index: number) =>
      createPositionFormState(
        record
          ? {
              ...record,
              position: positionName || record.position || '',
              subject_group: subjectGroup,
              work_age_from_appointment: calculateWorkAge(record.government_entry_date),
              work_age_at_school: calculateWorkAge(record.school_entry_date),
            }
          : {
              position: positionName,
              subject_group: subjectGroup,
              work_age_from_appointment: '',
              work_age_at_school: '',
            },
        index,
      ),
    )

  } catch (error: any) {
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

function buildPositionUpdate(source: PositionRow | undefined, payload: Record<string, any>): PositionRow {
  const mergedPayload = {
    ...source,
    ...payload,
  }

  return {
    ...mergedPayload,
    id: source?.id || payload.id || '',
    person_id: source?.person_id || payload.person_id || '',
    work_age_from_appointment: calculateWorkAge(mergedPayload.government_entry_date),
    work_age_at_school: calculateWorkAge(mergedPayload.school_entry_date),
    created_at: source?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function buildDepartmentUpdate(name: string): DepartmentRow | null {
  if (!personalDepartment.value?.id) return null

  return {
    id: personalDepartment.value.id,
    name,
    created_at: personalDepartment.value.created_at,
  }
}

function handleFormSave(formId: string, values: Record<string, any>) {
  const target = positionForms.value.find((form) => form.id === formId)
  if (!target) return

  pendingPayloads.set(formId, buildPositionUpdate(target.source, values))
}

const hasAnyChanges = computed(() => positionForms.value.some((form) => form.hasChanges))

const hasAnyInvalidRequired = computed(() =>
  positionForms.value.some((form) => Boolean(form.formRef?.hasMissingRequiredFields)),
)

const isSaveDisabled = computed(
  () => loading.value || !hasAnyChanges.value || hasAnyInvalidRequired.value,
)

async function updatePositionData() {
  loading.value = true
  try {
    let departmentPayloadToUpdate: DepartmentRow | null = null

    for (const form of positionForms.value.filter((entry) => entry.hasChanges)) {
      const payload = pendingPayloads.get(form.id)
      if (!payload?.id) continue

      const { subject_group, ...positionPayload } = payload

      await updateDatasetRow(
        DATASET_EDIT.DATASET_ID,
        DATASET_EDIT.DATASET_VERSION_POSITION_HISTORY,
        payload.id,
        positionPayload,
        'position_update',
      )

      const hasSubjectGroupChanged = subject_group !== form.initialValues.subject_group

      if (hasSubjectGroupChanged) {
        departmentPayloadToUpdate = buildDepartmentUpdate(subject_group || '')
      }
    }

    if (departmentPayloadToUpdate?.id) {
      await updateDatasetRow(
        DATASET_EDIT.DATASET_ID,
        DATASET_EDIT.DATASET_VERSION_DEPARTMENT,
        String(departmentPayloadToUpdate.id),
        departmentPayloadToUpdate,
        'department_update',
      )
    }

    toast.success('บันทึกข้อมูลตำแหน่งสำเร็จ', { position: 'bottom-right' })
    await getPositionData()
  } catch (error: any) {
    toast.error(`บันทึกข้อมูลตำแหน่งไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
  } finally {
    loading.value = false
  }
}

function updateData(confirmed: boolean) {
  if (confirmed) {
    updatePositionData()
  }
  confirmModal.value = false
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
    confirmModal.value = false
    return
  }

  if (!pendingPayloads.size) return

  modalValue.value = `การดำรงตำแหน่ง`
  confirmModal.value = true
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
    if ((status === 'succeeded') && response.data.destination_uri) {
      return response
    }

    if (status === 'failed' ) {
      throw new Error(response.data.error_message || 'Export failed')
    }

    await sleep(intervalMs)
  }

  throw new Error('Timed out waiting for export file')
}

function getDownloadFileName(downloadUrl: string) {
  try {
    const fileName = 'ประวัติการดำรงตำแหน่ง.csv'
    
    if (fileName) return decodeURIComponent(fileName)
  } catch {
    const fileName = downloadUrl.split('/').pop()
    if (fileName) return decodeURIComponent(fileName)
  }

  return 'position_export.csv'
}

async function handleDownloadTemplate() {
  try {
    isExporting.value = true
    fileUrl.value = ''

    const payload: ExportJobRequest = {
      dataset_id: REPORTING.DATASET_ID,
      version: REPORTING.EXPORT_VERSION,
      view: 'position_get',
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
    isExporting.value = false
  }
}

onMounted(() => {
  getPositionData()
})
</script>

<template>
  <div class="flex flex-col">
    <div class="sticky right-0 bottom-0 z-40 flex w-full justify-end bg-white p-3">
      <Button
        :disabled="isExporting"
        @click="handleDownloadTemplate()"
        class="cursor-pointer rounded-lg bg-[#1675dc] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#1567be]"
      >
        <Spinner v-if="isExporting" class="mr-2 h-4 w-4" />
        <ArrowUpFromLine v-else class="mr-2 h-4 w-4" />
        Export Data
      </Button>
    </div>

    <div v-if="loading" class="flex-1 space-y-4 overflow-y-auto px-4 sm:px-6">
      <SkeletonCard />
    </div>

    <div v-else class="flex-1 space-y-4 overflow-y-auto px-4 sm:px-6">
      <div v-for="(form, index) in positionForms" :key="form.id">
        <NormalForm
          :topic="`ข้อมูลตำแหน่ง`"
          :ref="(instance) => setPositionFormRef(form.id, instance as NormalFormInstance | null)"
          :values="form.initialValues"
          :fields="positionFields"
          @change="(payload) => handleFormChange(form.id, payload)"
          @save="(values) => handleFormSave(form.id, values)"
        />
      </div>
    </div>

    <div
      class="sticky right-0 bottom-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3"
    >
      <Button
        :disabled="isSaveDisabled"
        @click="onSaveAll"
        class="cursor-pointer rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]"
      >
        บันทึก
      </Button>
    </div>

    <ConfirmModal
      v-if="confirmModal"
      :action="action"
      :topic="modalTopic"
      :value="modalValue"
      @confirm="updateData"
    />
  </div>
</template>
