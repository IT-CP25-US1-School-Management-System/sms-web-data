<script setup lang="ts">
import ConfirmModal from '@/components/ConfirmModal.vue'
import CreateForm from '@/components/form/CreateForm.vue'
import { MANAGE_DATASETS } from '@/lib/constants'
import { formatDateInput, generateUUID } from '@/lib/helpers'
import { deleteDatasetRow } from '@/stores/dataset'
import {
  createEducationRecord,
  getEducationById,
  updateEducationRecord,
  useTeacherStore,
} from '@/stores/teachers'
import type { EducationRecord, EducationRecordCreateDTO } from '@/types/teacher'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
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

type EducationFormValue = Partial<EducationRecord> & {
  'qualification-used'?: string
}

const EDUCATION_DATASET = {
  DATASET_ID: MANAGE_DATASETS.DATASET_ID,
  DATASET_VERSION: MANAGE_DATASETS.DATASET_VERSION_EDUCATION,
} as const

const route = useRoute()
const teacherStore = useTeacherStore()

const loading = ref(false)
const busyEntries = ref<Record<number, 'save' | 'delete'>>({})
const educationData = ref<EducationFormValue[]>([])
const formRenderKey = ref(0)

const confirmModal = ref(false)
const action = ref('update')
const modalTopic = ref('ข้อมูลการศึกษา')
const modalValue = ref('')
const pendingAction = ref<
  | { type: 'save'; index: number; values: EducationFormValue }
  | { type: 'delete'; index: number; recordId?: string; values?: EducationFormValue }
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

function getPersonId() {
  const idFromUrl = route.query.id as string | undefined
  const personId = idFromUrl || teacherStore.personId

  if (idFromUrl && teacherStore.personId !== idFromUrl) {
    teacherStore.setPersonId(idFromUrl)
  }

  return personId
}

function normalizeText(value: unknown) {
  const text = String(value ?? '').trim()
  return text || undefined
}

function buildQualificationUsedValue(source?: Partial<EducationRecord>) {
  const labels: string[] = []

  if (source?.is_used_for_first_appointment) {
    labels.push('ใช้บรรจุ')
  }

  if (source?.is_highest_degree) {
    labels.push('วุฒิการศึกษาสูงสุด')
  }

  return labels.join(' / ')
}

function normalizeQualificationUsage(value: unknown) {
  const text = String(value ?? '').trim()

  return {
    is_used_for_first_appointment: text.includes('บรรจุ'),
    is_highest_degree: text.includes('สูงสุด'),
  }
}

function formatEducationRecord(record: EducationRecord): EducationFormValue {
  return {
    ...record,
    start_date: formatDateInput(record.start_date),
    graduation_date: formatDateInput(record.graduation_date),
    'qualification-used': buildQualificationUsedValue(record),
  }
}

async function getEducationData() {
  loading.value = true

  const personId = getPersonId()

  if (!personId) {
    educationData.value = []
    formRenderKey.value += 1
    toast.error('ไม่พบข้อมูลครู กรุณาบันทึกข้อมูลส่วนบุคคลก่อน', {
      position: 'bottom-right',
    })
    loading.value = false
    return
  }

  try {
    const response = await getEducationById(personId)
    const records = response.data?.education_records || []

    educationData.value = records.map((record) => formatEducationRecord(record))
    formRenderKey.value += 1
  } catch (error: any) {
    console.error('Education API Error:', error)
    toast.error(`โหลดข้อมูลการศึกษาไม่สำเร็จ: ${error?.response?.data?.message || error.message}`)
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
): EducationRecordCreateDTO {
  const personId = getPersonId() || currentRecord?.person_id || values.person_id || ''
  const now = new Date().toISOString()
  const qualificationUsage = normalizeQualificationUsage(values['qualification-used'])

  return {
    ...currentRecord,
    ...values,
    id: currentRecord?.id || values.id || generateUUID(),
    person_id: personId,
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
    created_at:
      mode === 'create'
        ? now
        : currentRecord?.created_at || values.created_at || now,
    updated_at: mode === 'update' ? now : undefined,
  }
}

async function saveEducationData(index: number, values: EducationFormValue) {
  const currentRecord = educationData.value[index]
  const personId = getPersonId()

  if (!personId) {
    toast.error('ไม่พบข้อมูลครู กรุณาบันทึกข้อมูลส่วนบุคคลก่อน', {
      position: 'bottom-right',
    })
    return
  }

  try {
    if (currentRecord?.id) {
      const payload = buildEducationPayload(values, currentRecord, 'update')
      await updateEducationRecord(currentRecord.id, payload)
      toast.success('บันทึกข้อมูลการศึกษาสำเร็จ', { position: 'bottom-right' })
      await getEducationData()
      return
    }

    const payload = buildEducationPayload(values, currentRecord, 'create')
    await createEducationRecord(payload)
    toast.success('บันทึกข้อมูลการศึกษาสำเร็จ', { position: 'bottom-right' })
    await getEducationData()
  } catch (error: any) {
    console.error('Education save error:', error)
    toast.error(`บันทึกข้อมูลการศึกษาไม่สำเร็จ: ${error?.response?.data?.message || error.message}`)
  }
}

async function deleteEducationData(index: number, recordId?: string) {
  try {
    if (!recordId) {
      educationData.value.splice(index, 1)
      formRenderKey.value += 1
      return
    }

    await deleteDatasetRow(
      EDUCATION_DATASET.DATASET_ID,
      EDUCATION_DATASET.DATASET_VERSION,
      recordId,
    )
    toast.success('ลบข้อมูลการศึกษาสำเร็จ', { position: 'bottom-right' })
    await getEducationData()
  } catch (error: any) {
    console.error('Education delete error:', error)
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
      return
    }

    await deleteEducationData(currentAction.index, currentAction.recordId)
  } finally {
    const { [currentAction.index]: _busyEntry, ...restBusyEntries } = busyEntries.value
    busyEntries.value = restBusyEntries
  }
}

function handleSave(index: number, values: Record<string, any>) {
  if (busyEntries.value[index]) return

  pendingAction.value = {
    type: 'save',
    index,
    values: values as EducationFormValue,
  }
  action.value = educationData.value[index]?.id ? 'update' : 'add'
  modalValue.value =
    values.qualification_name || values.qualification || educationData.value[index]?.qualification_name || ''
  confirmModal.value = true
}

function handleDelete(index: number, recordId?: string) {
  if (busyEntries.value[index]) return

  pendingAction.value = {
    type: 'delete',
    index,
    recordId,
    values: educationData.value[index],
  }
  action.value = 'delete'
  modalValue.value =
    educationData.value[index]?.qualification_name || educationData.value[index]?.qualification || ''
  confirmModal.value = true
}

onMounted(() => {
  void getEducationData()
})
</script>

<template>
  <div class="mx-6 flex flex-col gap-4">
    <p v-if="loading" class="text-muted-foreground text-sm">กำลังโหลดข้อมูล...</p>

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
