<script setup lang="ts">
import ConfirmModal from '@/components/ConfirmModal.vue'
import CreateForm from '@/components/form/CreateForm.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import { DATASET_EDIT, DATASET_GET } from '@/lib/constants'
import { formatDateInput, generateUUID } from '@/lib/helpers'
import {
  createDatasetRow,
  deleteDatasetRow,
  getDatasetRows,
  updateDatasetRow,
} from '@/stores/dataset'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'

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

type EducationFormValue = Record<string, any> & {
  'qualification-used'?: string
}

const EDUCATION_DATASET = {
  DATASET_ID: DATASET_EDIT.DATASET_ID,
  DATASET_VERSION: DATASET_EDIT.DATASET_VERSION_EDUCATION,
  VIEW_NAME: 'education_records',
} as const

const loading = ref(false)
const busyEntries = ref<Record<number, 'save' | 'delete'>>({})
const educationData = ref<EducationFormValue[]>([])
const personId = ref('')
const formRenderKey = ref(0)

const confirmModal = ref(false)
const action = ref('update')
const modalTopic = ref('ข้อมูลการศึกษา')
const modalValue = ref('')
const pendingAction = ref<
  | { type: 'save'; index: number; values: EducationFormValue }
  | { type: 'delete'; index: number; recordId?: string }
  | null
>(null)

const educationFields: CreateFormSection[][] = [
  [
    {
      topic: 'ข้อมูลการศึกษา',
      content: [
        {
          name: 'education_level',
          label: 'ระดับการศึกษา',
          type: 'text',
          required: true,
          isShow: true,
          placeholder: 'เช่น ปริญญาตรี / ปริญญาโท',
        },
        {
          name: 'qualification',
          label: 'วุฒิการศึกษา',
          type: 'text',
          required: true,
          isShow: true,
          placeholder: 'เช่น ครุศาสตรบัณฑิต',
        },
        {
          name: 'qualification_name',
          label: 'ชื่อวุฒิการศึกษา',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุชื่อวุฒิการศึกษา',
        },
        {
          name: 'major_group',
          label: 'สาขาวิชาเอก',
          type: 'text',
          placeholder: 'กรุณาระบุสาขาวิชาเอก',
        },
        {
          name: 'minor_group',
          label: 'สาขาวิชาโท',
          type: 'text',
          placeholder: 'กรุณาระบุสาขาวิชาโท',
        },
        {
          name: 'institution',
          label: 'สถานศึกษา',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุสถานศึกษา',
        },
        {
          name: 'country',
          label: 'ประเทศ',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุประเทศ',
        },
        {
          name: 'start_date',
          label: 'วันที่เข้าศึกษา',
          type: 'date',
          placeholder: 'วว / ดด / ปปปป',
        },
        {
          name: 'graduation_date',
          label: 'วันที่สำเร็จการศึกษา',
          type: 'date',
          required: true,
          placeholder: 'วว / ดด / ปปปป',
        },
        {
          name: 'honor_type',
          label: 'เกียรตินิยม',
          type: 'text',
          placeholder: 'กรุณาระบุเกียรตินิยม',
        },
        {
          name: 'qualification-used',
          label: 'วุฒิที่ใช้บรรจุ / วุฒิการศึกษาสูงสุด',
          type: 'text',
          placeholder: 'เช่น ใช้บรรจุ / วุฒิการศึกษาสูงสุด',
        },
      ],
    },
  ],
]

function normalizeText(value: unknown) {
  const text = String(value ?? '').trim()
  return text || undefined
}

function buildQualificationUsedValue(source?: EducationFormValue) {
  const labels: string[] = []
  if (source?.is_used_for_first_appointment) labels.push('ใช้บรรจุ')
  if (source?.is_highest_degree) labels.push('วุฒิการศึกษาสูงสุด')
  return labels.join(' / ')
}

function normalizeQualificationUsage(value: unknown) {
  const text = String(value ?? '').trim()
  return {
    is_used_for_first_appointment: text.includes('บรรจุ'),
    is_highest_degree: text.includes('สูงสุด'),
  }
}

function formatEducationRecord(record: EducationFormValue): EducationFormValue {
  return {
    ...record,
    start_date: formatDateInput(record.start_date),
    graduation_date: formatDateInput(record.graduation_date),
    'qualification-used': buildQualificationUsedValue(record),
  }
}

async function getEducationRecordData() {
  loading.value = true
  try {
    const response = await getDatasetRows(DATASET_GET.DATASET_ID, DATASET_GET.DATASET_VERSION, {
      view: 'education_get',
      page: 1,
      per_page: 50,
    })
    const rootRecord = response.data[0] as Record<string, any> | undefined
    personId.value = String(rootRecord?.id || rootRecord?.person_id || '')
    educationData.value = (rootRecord?.education_records || []).map((record: EducationFormValue) =>
      formatEducationRecord(record),
    )
    formRenderKey.value += 1
  } catch (error: any) {
    toast.error(`โหลดข้อมูลการศึกษาไม่สำเร็จ: ${error?.response?.data?.message || error.message}`, {
      position: 'bottom-right',
    })
    educationData.value = []
    formRenderKey.value += 1
  } finally {
    loading.value = false
  }
}

function buildEducationPayload(
  values: EducationFormValue,
  currentRecord?: EducationFormValue,
  mode: 'create' | 'update' = 'update',
) {
  const now = new Date().toISOString()
  const qualificationUsage = normalizeQualificationUsage(values['qualification-used'])

  return {
    ...currentRecord,
    ...values,
    id: currentRecord?.id || values.id || generateUUID(),
    person_id: currentRecord?.person_id || values.person_id || personId.value,
    education_level: String(values.education_level || '').trim(),
    qualification: String(values.qualification || '').trim(),
    qualification_name: String(values.qualification_name || '').trim(),
    major_group: normalizeText(values.major_group),
    minor_group: normalizeText(values.minor_group),
    institution: String(values.institution || '').trim(),
    country: String(values.country || '').trim(),
    start_date: formatDateInput(values.start_date) || undefined,
    graduation_date: formatDateInput(values.graduation_date) || undefined,
    honor_type: normalizeText(values.honor_type),
    is_used_for_first_appointment: qualificationUsage.is_used_for_first_appointment,
    is_highest_degree: qualificationUsage.is_highest_degree,
    is_meets_position_standard: currentRecord?.is_meets_position_standard ?? undefined,
    is_recognized_by_kksa: currentRecord?.is_recognized_by_kksa ?? undefined,
    is_recognized_by_ocsc: currentRecord?.is_recognized_by_ocsc ?? undefined,
    created_at: mode === 'create' ? now : currentRecord?.created_at || values.created_at || now,
    updated_at: mode === 'update' ? now : undefined,
  }
}

async function saveEducationData(index: number, values: EducationFormValue) {
  const currentRecord = educationData.value[index]
  const payload = buildEducationPayload(
    values,
    currentRecord,
    currentRecord?.id ? 'update' : 'create',
  )

  if (!payload.person_id) {
    toast.error('ไม่พบข้อมูลผู้ใช้งาน กรุณาบันทึกข้อมูลส่วนบุคคลก่อน', {
      position: 'bottom-right',
    })
    return
  }

  try {
    if (currentRecord?.id) {
      await updateDatasetRow(
        EDUCATION_DATASET.DATASET_ID,
        EDUCATION_DATASET.DATASET_VERSION,
        currentRecord.id,
        payload,
        EDUCATION_DATASET.VIEW_NAME,
      )
    } else {
      await createDatasetRow(
        EDUCATION_DATASET.DATASET_ID,
        EDUCATION_DATASET.DATASET_VERSION,
        payload,
        EDUCATION_DATASET.VIEW_NAME,
      )
    }

    toast.success('บันทึกข้อมูลการศึกษาสำเร็จ', { position: 'bottom-right' })
    await getEducationRecordData()
  } catch (error: any) {
    toast.error(`บันทึกข้อมูลการศึกษาไม่สำเร็จ: ${error?.response?.data?.message || error.message}`)
  }
}

async function deleteEducationData(index: number, recordId?: string) {
  if (!recordId) {
    educationData.value.splice(index, 1)
    formRenderKey.value += 1
    return
  }

  try {
    await deleteDatasetRow(
      EDUCATION_DATASET.DATASET_ID,
      EDUCATION_DATASET.DATASET_VERSION,
      recordId,
      EDUCATION_DATASET.VIEW_NAME,
    )
    toast.success('ลบข้อมูลการศึกษาสำเร็จ', { position: 'bottom-right' })
    await getEducationRecordData()
  } catch (error: any) {
    toast.error(`ลบข้อมูลการศึกษาไม่สำเร็จ: ${error?.response?.data?.message || error.message}`)
  }
}

async function updateData(confirmed: boolean) {
  if (!confirmed) {
    pendingAction.value = null
    confirmModal.value = false
    return
  }

  confirmModal.value = false
  if (!pendingAction.value) return

  const currentAction = pendingAction.value
  pendingAction.value = null
  busyEntries.value = { ...busyEntries.value, [currentAction.index]: currentAction.type }

  try {
    if (currentAction.type === 'save') {
      await saveEducationData(currentAction.index, currentAction.values)
    } else {
      await deleteEducationData(currentAction.index, currentAction.recordId)
    }
  } finally {
    const { [currentAction.index]: _busyEntry, ...restBusyEntries } = busyEntries.value
    busyEntries.value = restBusyEntries
  }
}

function handleSave(index: number, values: Record<string, any>) {
  if (busyEntries.value[index]) return
  pendingAction.value = { type: 'save', index, values: values as EducationFormValue }
  action.value = educationData.value[index]?.id ? 'update' : 'add'
  modalValue.value =
    values.qualification_name ||
    values.qualification ||
    educationData.value[index]?.qualification_name ||
    ''
  confirmModal.value = true
}

function handleDelete(index: number, recordId?: string) {
  if (busyEntries.value[index]) return
  pendingAction.value = { type: 'delete', index, recordId }
  action.value = 'delete'
  modalValue.value =
    educationData.value[index]?.qualification_name ||
    educationData.value[index]?.qualification ||
    ''
  confirmModal.value = true
}

onMounted(() => {
  void getEducationRecordData()
})
</script>

<template>
  <div v-if="loading" class="flex-1 space-y-4 overflow-y-auto px-4 sm:px-6">
    <SkeletonCard />
  </div>

  <div v-else class="mx-6 flex flex-col gap-4">
    <CreateForm
      :key="formRenderKey"
      :isDropdown="true"
      :busyEntries="busyEntries"
      :deferCommitOnSave="true"
      :deferDeleteOnConfirm="true"
      :values="educationData"
      :canDelete="true"
      :fields="educationFields"
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
