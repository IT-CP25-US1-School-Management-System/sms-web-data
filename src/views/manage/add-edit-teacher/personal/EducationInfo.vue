<script setup lang="ts">
import NormalForm, {
  type NormalFormField,
  type NormalFormChangePayload,
} from '@/components/form/NormalForm.vue'
import { Button } from '@/components/ui/button'
import {
  createEducationRecord,
  getEducationById,
  updateEducationRecord,
  useTeacherStore,
} from '@/stores/teachers'
import type { EducationRecord, EducationRecordCreateDTO } from '@/types/teacher'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'

type NormalFormInstance = InstanceType<typeof NormalForm>

type EducationFormState = {
  id: string
  recordId: string | null
  source: Partial<EducationRecord>
  createdAt?: string
  updatedAt?: string
  fields: NormalFormField[]
  initialValues: Record<string, any>
  currentValues: Record<string, any>
  formRef: NormalFormInstance | null
  hasChanges: boolean
}

const route = useRoute()
const teacherStore = useTeacherStore()

const loading = ref(false)
const isSubmitting = ref(false)
const educationForms = ref<EducationFormState[]>([])

const pendingPayloads = new Map<string, Record<string, any>>()

function cloneFormValues(values: Record<string, any>) {
  return JSON.parse(JSON.stringify(values))
}

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

function buildEducationValues(source?: Partial<EducationRecord>) {
  return {
    education_level: source?.education_level || '',
    qualification: source?.qualification || '',
    qualification_name: source?.qualification_name || '',
    major_group: source?.major_group || '',
    minor_group: source?.minor_group || '',
    institution: source?.institution || '',
    start_date: source?.start_date || '',
    graduation_date: source?.graduation_date || '',
    country: source?.country || '',
    honor_type: source?.honor_type || '',
    'qualification-used': buildQualificationUsedValue(source),
  }
}

function createEducationFields() {
  return reactive<NormalFormField[]>([
    {
      name: 'education_level',
      label: 'ระดับการศึกษา',
      type: 'text',
      required: true,
      placeholder: 'เช่น ปริญญาตรี / ปริญญาโท',
    },
    {
      name: 'qualification',
      label: 'วุฒิการศึกษา',
      type: 'text',
      required: true,
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
      name: 'start_date',
      label: 'วันที่เข้าศึกษา',
      type: 'date',
      placeholder: 'วว / ดด / ปปปป',
    },
    {
      name: 'graduation_date',
      label: 'วันที่สำเร็จการศึกษา',
      type: 'date',
      placeholder: 'วว / ดด / ปปปป',
    },
    {
      name: 'country',
      label: 'ประเทศ',
      type: 'text',
      required: true,
      placeholder: 'กรุณาระบุประเทศ',
    },
    {
      name: 'honor_type',
      label: 'เกียรตินิยม',
      type: 'text',
      placeholder: 'กรุณาระบุเกียรตินิยม',
    },
    {
      name: 'qualification-used',
      label: 'วุฒิที่ใช้บรรจุ /วุฒิการศึกษาสูงสุด',
      type: 'text',
      placeholder: 'เช่น ใช้บรรจุ / วุฒิการศึกษาสูงสุด',
    },
  ])
}

function createEducationFormState(source?: EducationRecord, index = 0) {
  const initialValues = buildEducationValues(source)
  const generatedId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `education-${Date.now()}-${index}`

  return reactive<EducationFormState>({
    id: source?.id || generatedId,
    recordId: source?.id || null,
    source: source || {},
    createdAt: source?.created_at || undefined,
    updatedAt: source?.updated_at || undefined,
    fields: createEducationFields(),
    initialValues: cloneFormValues(initialValues),
    currentValues: cloneFormValues(initialValues),
    formRef: null,
    hasChanges: false,
  })
}

async function getEducationData() {
  loading.value = true

  const personId = getPersonId()

  if (!personId) {
    educationForms.value = [createEducationFormState(undefined, 0)]
    loading.value = false
    return
  }

  try {
    const response = await getEducationById(personId)
    const records = response.data?.education_records || []

    educationForms.value = (records.length ? records : [undefined]).map((education, index) =>
      createEducationFormState(education, index),
    )
  } catch (error: any) {
    console.error('Education API Error:', error)
    toast.error(`โหลดข้อมูลการศึกษาไม่สำเร็จ: ${error?.response?.data?.message || error.message}`)
    educationForms.value = [createEducationFormState(undefined, 0)]
  } finally {
    loading.value = false
  }
}

function setFormRef(formId: string, instance: NormalFormInstance | null) {
  const target = educationForms.value.find((entry) => entry.id === formId)
  if (target) {
    target.formRef = instance
  }
}

function handleFormChange(formId: string, payload: NormalFormChangePayload) {
  const target = educationForms.value.find((entry) => entry.id === formId)
  if (!target) return

  target.currentValues = cloneFormValues(payload.values)
  target.hasChanges =
    JSON.stringify(target.currentValues) !== JSON.stringify(target.initialValues)
}

function handleFormSave(formId: string, values: Record<string, any>) {
  pendingPayloads.set(formId, cloneFormValues(values))
}

function buildEducationRequestPayload(
  values: Record<string, any>,
  metadata: {
    recordId: string
    personId: string
    createdAt: string
    updatedAt: string
    source: Partial<EducationRecord>
  },
): EducationRecordCreateDTO {
  const qualificationUsage = normalizeQualificationUsage(values['qualification-used'])

  return {
    id: metadata.recordId,
    person_id: metadata.personId,
    education_level: String(values.education_level || '').trim(),
    qualification: String(values.qualification || '').trim(),
    qualification_name: String(values.qualification_name || '').trim(),
    major_group: normalizeText(values.major_group),
    minor_group: normalizeText(values.minor_group),
    institution: String(values.institution || '').trim(),
    start_date: normalizeText(values.start_date),
    graduation_date: normalizeText(values.graduation_date),
    country: String(values.country || '').trim(),
    honor_type: normalizeText(values.honor_type),
    is_used_for_first_appointment: qualificationUsage.is_used_for_first_appointment,
    is_highest_degree: qualificationUsage.is_highest_degree,
    is_meets_position_standard: metadata.source.is_meets_position_standard ?? undefined,
    is_recognized_by_kksa: metadata.source.is_recognized_by_kksa ?? undefined,
    is_recognized_by_ocsc: metadata.source.is_recognized_by_ocsc ?? undefined,
    created_at: metadata.createdAt,
    updated_at: metadata.updatedAt,
  }
}

const hasAnyChanges = computed(() => educationForms.value.some((entry) => entry.hasChanges))

const isSaveDisabled = computed(
  () => loading.value || isSubmitting.value || !hasAnyChanges.value,
)

async function onSaveAll() {
  if (isSubmitting.value) return

  const personId = getPersonId()
  if (!personId) {
    toast.error('ไม่พบข้อมูลครู กรุณาบันทึกข้อมูลส่วนบุคคลก่อน')
    return
  }

  pendingPayloads.clear()

  for (const form of educationForms.value) {
    if (form.formRef?.submitForm) {
      const valid = await form.formRef.submitForm()
      if (!valid) {
        toast.error('กรุณาตรวจสอบข้อมูลการศึกษาก่อนบันทึก')
        return
      }
    }
  }

  const changedForms = educationForms.value.filter((form) => form.hasChanges)
  if (!changedForms.length) return

  try {
    isSubmitting.value = true

    for (const form of changedForms) {
      const currentValues = pendingPayloads.get(form.id) || form.currentValues
      const now = new Date().toISOString()
      const requestPayload = buildEducationRequestPayload(currentValues, {
        recordId: form.recordId || form.id,
        personId,
        createdAt: form.createdAt || now,
        updatedAt: now,
        source: form.source,
      })

      if (form.recordId) {
        await updateEducationRecord(form.recordId, requestPayload)
        form.createdAt = requestPayload.created_at
        form.updatedAt = requestPayload.updated_at
      } else {
        const response = await createEducationRecord(requestPayload)
        const createdRecordId =
          typeof (response.data as { id?: unknown } | undefined)?.id === 'string'
            ? ((response.data as { id?: string }).id ?? null)
            : (requestPayload.id ?? null)

        if (createdRecordId) {
          form.recordId = createdRecordId
        }

        form.createdAt = requestPayload.created_at
        form.updatedAt = requestPayload.updated_at
      }
    }

    await getEducationData()
    toast.success('บันทึกข้อมูลการศึกษาเรียบร้อย')
  } catch (error: any) {
    console.error('Education save error:', error)
    toast.error(`บันทึกข้อมูลการศึกษาไม่สำเร็จ: ${error?.response?.data?.message || error.message}`)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  const idFromUrl = route.query.id as string

  if (idFromUrl && !teacherStore.personId) {
    teacherStore.setPersonId(idFromUrl)
  }

  void getEducationData()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="loading" class="px-4 text-sm text-muted-foreground sm:px-6">กำลังโหลดข้อมูล...</div>

    <div v-for="(form, index) in educationForms" :key="form.id" class="px-4 sm:px-6">
      <NormalForm
        :topic="`ข้อมูลการศึกษา #${index + 1}`"
        :fields="form.fields"
        :values="form.initialValues"
        :ref="(instance) => setFormRef(form.id, instance as NormalFormInstance | null)"
        @change="(payload) => handleFormChange(form.id, payload)"
        @save="(values) => handleFormSave(form.id, values)"
      />
    </div>

    <div
      class="sticky right-0 bottom-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3 dark:border-neutral-700 dark:bg-black"
    >
      <Button
        class="rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]"
        :disabled="isSaveDisabled"
        @click="onSaveAll"
      >
        {{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึก' }}
      </Button>
    </div>
  </div>
</template>
