<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DropDownForm from '@/components/form/DropDownForm.vue'
import { Button } from '@/components/ui/button'
import { useToast } from '@/composables/useToast'
import { MANAGE_DROPDOWN_DATASETS, ROUTE_NAMES } from '@/lib/constants'
import { calAge, formatDateInput, sortDropdownOptionsByThaiLabel } from '@/lib/helpers'
import { createUser } from '@/stores/api'
import { getDatasetRows } from '@/stores/dataset'
import { createTeacher, getTeacherById, updateTeacher, useTeacherStore } from '@/stores/teachers'
import type { TeacherCreateDTO } from '@/types/teacher'

const router = useRouter()
const route = useRoute()
const { showError, showSuccess } = useToast()
const teacherStore = useTeacherStore()

const isSubmitting = ref(false)
const isEditing = ref(false)
const prefixOptions = ref<{ label: string; value: string }[]>([
  { label: 'นาย', value: '1' },
  { label: 'นาง', value: '2' },
  { label: 'นางสาว', value: '3' },
])

type PrefixRow = {
  id?: number | string
  prefix_id?: number | string
  prefixes_id?: number | string
  prefixes_name_th?: string
  name_th?: string
  name?: string
}

const roleOptions = ref<{ label: string; value: string }[]>([])

type RoleRow = {
  id?: number | string
  role_id?: number | string
  roles_id?: number | string
  role_name_th?: string
  roles_name_th?: string
  name_th?: string
  name?: string
}

const formValues = ref<Record<string, any>>({
  is_government: true,
  role_id: '',
  line_id: '',
})
const formValuesUpdate = ref<Record<string, any>>({
  is_government: true,
  role_id: '',
  line_id: '',
})

const PREFIX_EN_BY_ID: Record<string, string> = {
  '250ae8ee-9f0a-4b94-a2c4-a475752dc3e6': 'Mr.',
  '6ec2c1dd-ab31-47d3-8870-680baac1b8da': 'Mrs.',
  '9b91d6d5-c414-4a92-b44a-2ad07250271c': 'Miss',
}

function getPrefixEn(prefixId?: string | number | null) {
  if (!prefixId) return ''
  return PREFIX_EN_BY_ID[String(prefixId)] || ''
}

function calculateAgeFromDate(value?: string | Date | null) {
  const date = formatDateInput(value)
  return date ? calAge(date) : ''
}

const generalForm = ref<any>(null)
const sensitiveForm = ref<any>(null)
const contactForm = ref<any>(null)

const handleFormSave = (values: Record<string, any>) => {
  const nextValues = { ...formValuesUpdate.value, ...values }
  if ('prefix_id' in values) {
    nextValues.prefix_en = getPrefixEn(nextValues.prefix_id)
  }
  if ('birth_date' in values) {
    nextValues.age = calculateAgeFromDate(nextValues.birth_date)
  }
  formValues.value = { ...formValues.value, ...nextValues }
  formValuesUpdate.value = nextValues
}

const handleFormChange = (payload: { values: Record<string, any>; isDirty: boolean }) => {
  const nextValues = { ...formValuesUpdate.value, ...payload.values }
  if ('prefix_id' in payload.values) {
    nextValues.prefix_en = getPrefixEn(nextValues.prefix_id)
  }
  if ('birth_date' in payload.values) {
    nextValues.age = calculateAgeFromDate(nextValues.birth_date)
    generalForm.value?.setFieldValue?.('age', nextValues.age)
  }
  formValues.value = { ...formValues.value, ...nextValues }
  formValuesUpdate.value = nextValues
}

const requiredFields = [
  { key: 'role_id', label: 'ตำแหน่ง' },
  { key: 'prefix_id', label: 'คำนำหน้า' },
  { key: 'first_name_th', label: 'ชื่อ' },
  { key: 'last_name_th', label: 'นามสกุล' },
  { key: 'id-card', label: 'เลขบัตรประชาชน' },
  { key: 'phone', label: 'เบอร์โทรศัพท์' },
  { key: 'personal_email', label: 'E-mail' },
  { key: 'line_id', label: 'Line ID' },
]

const getMissingRequiredFieldLabels = (values: Record<string, any>) => {
  return requiredFields
    .filter(({ key }) => !String(values[key] ?? '').trim())
    .map(({ label }) => label)
}

const hasRequiredFieldsCompleted = computed(
  () => getMissingRequiredFieldLabels(formValuesUpdate.value).length === 0,
)

const hasAnyChanges = computed(() =>
  [generalForm.value, sensitiveForm.value, contactForm.value].some((form) =>
    Boolean(form?.isDirty),
  ),
)

const canSave = computed(() => hasAnyChanges.value && hasRequiredFieldsCompleted.value)

const genderMap: Record<string, string> = {
  male: 'male',
  female: 'female',
  other: 'other',
}

function normalizeGender(value: unknown) {
  if (value === 'male' || value === 'female' || value === 'other') return value
  if (value === 'ชาย') return 'male'
  if (value === 'หญิง') return 'female'
  if (value === 'อื่นๆ') return 'other'
  return ''
}

const maritalStatusMap: Record<string, string> = {
  single: 'โสด',
  married: 'สมรส',
  widowed: 'หม้าย',
  divorced: 'หย่าร้าง',
  separated: 'แยกกันอยู่',
  deceased: 'เสียชีวิต',
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 'true'
}

function normalizeExistingTeacherPayload(teacher?: Record<string, any> | null) {
  if (!teacher) return {}

  const {
    prefixes,
    roles,
    governments,
    employment_contract,
    family_members,
    education_records,
    professional_licenses,
    ...payload
  } = teacher

  return {
    ...payload,
    id: payload.id,
    prefix_id: payload.prefix_id,
    role_id: payload.role_id,
    is_government: normalizeBoolean(payload.is_government),
    birth_date: formatDateInput(payload.birth_date) || undefined,
    created_at: payload.created_at,
    updated_at: payload.updated_at,
  }
}

function resolvePayloadValue(value: unknown, fallback: unknown) {
  if (value === undefined || value === null || value === '') return fallback ?? undefined
  return value
}

function mapDropdownOptions<T extends Record<string, any>>(
  rows: T[],
  valueKeys: string[],
  labelKeys: string[],
) {
  const options = rows
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

  return sortDropdownOptionsByThaiLabel(options)
}

async function fetchPrefixOptions() {
  try {
    const response = await getDatasetRows<PrefixRow>(
      MANAGE_DROPDOWN_DATASETS.DATASET_ID,
      MANAGE_DROPDOWN_DATASETS.DATASET_VERSION_PREFIXES,
      {
        view: 'prefixes',
        page: 1,
        per_page: 100,
      },
    )

    const mappedOptions = mapDropdownOptions(
      response.data || [],
      ['id', 'prefix_id', 'prefixes_id'],
      ['prefixes_name_th', 'name_th', 'name'],
    )

    if (mappedOptions.length > 0) {
      prefixOptions.value = mappedOptions
    }
  } catch (error) {
    console.error('Failed to load prefix options:', error)
  }
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
        roleOptions.value = mappedOptions
        return
      }
    }
  } catch (error) {
    console.error('Failed to load role options:', error)
  }
}

watch(
  () => route.query.id,
  async (idQuery) => {
    const idFromUrl = idQuery as string | undefined
    isEditing.value = Boolean(idFromUrl)

    if (!idFromUrl) {
      formValues.value = { is_government: true, role_id: '', line_id: '' }
      formValuesUpdate.value = { is_government: true, role_id: '', line_id: '' }
      teacherStore.clearCurrentTeacher()
      return
    }

    teacherStore.setPersonId(idFromUrl)
    try {
      const response = await getTeacherById(idFromUrl)
      if (!response.data) return

      const teacher = response.data
      formValues.value = {
        is_government: normalizeBoolean(teacher.is_government),
        prefix_id: teacher.prefix_id ? String(teacher.prefix_id) : '',
        prefix_en:
          teacher.prefixes?.prefixes_name_en ||
          getPrefixEn(teacher.prefix_id ? String(teacher.prefix_id) : ''),
        role_id: teacher.role_id ? String(teacher.role_id) : '',
        first_name_th: teacher.first_name_th,
        middle_name_th: teacher.middle_name_th,
        last_name_th: teacher.last_name_th,
        first_name_en: teacher.first_name_en,
        middle_name_en: teacher.middle_name_en,
        last_name_en: teacher.last_name_en,
        'id-card': teacher.national_id,
        'blood-type': teacher.blood_type,
        birth_date: teacher.birth_date ? formatDateInput(teacher.birth_date) : '',
        age: calculateAgeFromDate(teacher.birth_date),
        gender: normalizeGender(teacher.gender),
        religion: teacher.religion,
        nationality: teacher.nationality,
        ethnicity: teacher.ethnicity,
        'physical-status': teacher.physical_status,
        phone: teacher.phone,
        personal_email: teacher.personal_email,
        line_id: teacher.line_id,
        'marital-status':
          teacher.marital_status === 'โสด'
            ? 'single'
            : teacher.marital_status === 'สมรส'
              ? 'married'
              : teacher.marital_status === 'หม้าย'
                ? 'widowed'
                : teacher.marital_status === 'หย่าร้าง' || teacher.marital_status === 'หย่า'
                  ? 'divorced'
                  : teacher.marital_status === 'แยกกันอยู่'
                    ? 'separated'
                    : teacher.marital_status === 'เสียชีวิต'
                      ? 'deceased'
                      : '',
        'spouse-name': teacher.spouse_name,
      }
      formValuesUpdate.value = { ...formValues.value }
      teacherStore.setCurrentTeacher(teacher)
    } catch (error) {
      console.error('Failed to load teacher data:', error)
      showError('ไม่สามารถโหลดข้อมูลคุณครูได้')
    }
  },
  { immediate: true },
)

fetchPrefixOptions()
fetchRoleOptions()

const handleSave = async () => {
  if (isSubmitting.value) return // Prevent multiple submissions

  const forms = [generalForm, sensitiveForm, contactForm]
  const isAllValid: boolean[] = []

  for (const fRef of forms) {
    if (fRef.value?.submitForm) {
      const isValid = await fRef.value.submitForm()
      if (!isValid) {
        isAllValid.push(false)
      }
    }
  }
  if (isAllValid.some((valid) => valid === false)) {
    const missingLabels = getMissingRequiredFieldLabels(formValuesUpdate.value)

    if (missingLabels.length > 0) {
      showError(`กรุณากรอกข้อมูลให้ครบ: ${missingLabels.join(', ')}`)
    } else {
      showError('กรุณาตรวจสอบรูปแบบข้อมูลที่กรอก เช่น E-mail หรือเบอร์โทรศัพท์')
    }
    return // If any form is invalid, do not proceed
  }

  const currentValues = formValuesUpdate.value
  const firstName = currentValues.first_name_th?.trim()
  const lastName = currentValues.last_name_th?.trim()

  if (!firstName || !lastName) {
    showError('กรุณากรอกชื่อและนามสกุลภาษาไทย')
    return
  }

  try {
    isSubmitting.value = true
    const now = new Date().toISOString()
    const prefixId = String(currentValues.prefix_id ?? '').trim()
    const roleId = String(currentValues.role_id ?? '').trim()

    if (!prefixId) {
      showError('กรุณาเลือกคำนำหน้า')
      return
    }

    if (!roleId) {
      showError('กรุณาเลือกตำแหน่ง')
      return
    }

    let personId = teacherStore.personId ?? undefined

    if (!isEditing.value) {
      if (!currentValues.personal_email) {
        showError('กรุณากรอก E-mail')
        return
      }

      const userResponse = await createUser({
        email: currentValues.personal_email,
        first_name: firstName,
        last_name: lastName,
      })

      personId = userResponse.data.keycloak_id
    }

    const existingPayload = isEditing.value
      ? normalizeExistingTeacherPayload(teacherStore.currentTeacher as Record<string, any>)
      : {}

    const payload: TeacherCreateDTO & Record<string, any> = {
      ...existingPayload,
      id: personId,
      prefix_id: prefixId,
      role_id: roleId,
      is_government: currentValues.is_government ?? existingPayload.is_government ?? true,
      first_name_th: firstName,
      middle_name_th: resolvePayloadValue(
        currentValues.middle_name_th,
        existingPayload.middle_name_th,
      ),
      last_name_th: lastName,
      first_name_en: resolvePayloadValue(currentValues.first_name_en, existingPayload.first_name_en),
      middle_name_en: resolvePayloadValue(
        currentValues.middle_name_en,
        existingPayload.middle_name_en,
      ),
      last_name_en: resolvePayloadValue(currentValues.last_name_en, existingPayload.last_name_en),
      birth_date: resolvePayloadValue(
        formatDateInput(currentValues.birth_date),
        existingPayload.birth_date,
      ) as string | undefined,
      national_id: resolvePayloadValue(currentValues['id-card'], existingPayload.national_id),
      gender: resolvePayloadValue(genderMap[currentValues.gender], existingPayload.gender) as any,
      religion: resolvePayloadValue(currentValues.religion, existingPayload.religion),
      nationality: resolvePayloadValue(currentValues.nationality, existingPayload.nationality),
      ethnicity: resolvePayloadValue(currentValues.ethnicity, existingPayload.ethnicity),
      blood_type: resolvePayloadValue(currentValues['blood-type'], existingPayload.blood_type) as any,
      physical_status: resolvePayloadValue(
        currentValues['physical-status'],
        existingPayload.physical_status,
      ),
      phone: resolvePayloadValue(currentValues.phone, existingPayload.phone),
      personal_email: resolvePayloadValue(
        currentValues.personal_email,
        existingPayload.personal_email,
      ),
      line_id: resolvePayloadValue(currentValues.line_id, existingPayload.line_id),
      marital_status: resolvePayloadValue(
        maritalStatusMap[currentValues['marital-status']],
        existingPayload.marital_status,
      ),
      spouse_name: resolvePayloadValue(currentValues['spouse-name'], existingPayload.spouse_name),
      created_at: isEditing.value ? teacherStore.currentTeacher?.created_at || now : now,
      updated_at: now,
    }

    if (isEditing.value) {
      await updateTeacher(personId!, payload)
      showSuccess('แก้ไขข้อมูลส่วนบุคคลสำเร็จ', { description: 'กรุณากรอกข้อมูลที่อยู่ต่อไป' })
    } else {
      await createTeacher(payload)

      showSuccess('เพิ่มข้อมูลส่วนบุคคลสำเร็จ', { description: 'กรุณากรอกข้อมูลที่อยู่ต่อไป' })
    }

    teacherStore.setCurrentTeacher({
      id: personId!,
      first_name_th: firstName,
      last_name_th: lastName,
      prefix_id: prefixId,
      role_id: roleId,
      is_government: currentValues.is_government ?? true,
    })

    await router.push({ name: ROUTE_NAMES.ADD_TEACHER_ADDRESS, query: { id: personId! } })
  } catch (error: any) {
    const action = isEditing.value ? 'แก้ไข' : 'เพิ่ม'
    showError(`ไม่สามารถ${action}ข้อมูลคุณครูได้`, {
      description:
        error?.response?.data?.message || error?.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mx-6 flex flex-col gap-4">
    <DropDownForm
      ref="generalForm"
      topic="ข้อมูลทั่วไป"
      :values="formValues"
      @save="handleFormSave"
      @change="handleFormChange"
      :fields="[
        {
          name: 'prefix_id',
          label: 'คำนำหน้า',
          type: 'select',
          required: true,
          placeholder: 'เลือกคำนำหน้า',
          options: prefixOptions,
        },
        {
          name: 'first_name_th',
          label: 'ชื่อ',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุชื่อ',
        },
        {
          name: 'middle_name_th',
          label: 'ชื่อกลาง',
          type: 'text',
          placeholder: 'กรุณาระบุชื่อกลาง',
        },
        {
          name: 'last_name_th',
          label: 'นามสกุล',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุนามสกุล',
        },
        {
          name: 'prefix_en',
          label: 'Prefix',
          type: 'text',
          placeholder: 'ระบบกำหนดให้อัตโนมัติ',
          disabled: true,
        },

        { name: 'first_name_en', label: 'Name', type: 'text', placeholder: 'Enter name' },
        {
          name: 'middle_name_en',
          label: 'Middlename',
          type: 'text',
          placeholder: 'Enter middlename',
        },
        { name: 'last_name_en', label: 'Lastname', type: 'text', placeholder: 'Enter lastname' },
        {
          name: 'birth_date',
          label: 'วัน / เดือน / ปี เกิด',
          type: 'date',
          placeholder: 'วว / ดด / ปปปป',
        },
        { name: 'age', label: 'อายุ (ปี)', type: 'number', placeholder: 'อายุ', disabled: true },
        {
          name: 'marital-status',
          label: 'สถานภาพการแต่งงาน',
          type: 'select',
          placeholder: 'เลือกสถานภาพการแต่งงาน',
          options: [
            { label: 'โสด', value: 'single' },
            { label: 'สมรส', value: 'married' },
            { label: 'หม้าย', value: 'widowed' },
            { label: 'หย่าร้าง', value: 'divorced' },
            { label: 'แยกกันอยู่', value: 'separated' },
            { label: 'เสียชีวิต', value: 'deceased' },
          ],
        },
        {
          name: 'spouse-name',
          label: 'คู่สมรส',
          type: 'text',
          placeholder: 'กรุณาระบุชื่อคู่สมรส',
        },
        {
          name: 'id-card',
          label: 'เลขบัตรประจำตัวประชาชน',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุเลขบัตรประชาชน',
        },
        {
          name: 'role_id',
          label: 'ตำแหน่ง',
          type: 'select',
          required: true,
          placeholder: 'กรุณาเลือกตำแหน่ง',
          options: roleOptions,
        },
        {
          name: 'is_government',
          label: 'ประเภทบุคลากร',
          type: 'checkbox',
          placeholder: 'เป็นข้าราชการ',
          disabled: false,
        },
      ]"
    />

    <DropDownForm
      ref="sensitiveForm"
      topic="ข้อมูล Sensitive"
      :values="formValues"
      @save="handleFormSave"
      @change="handleFormChange"
      :fields="[
        {
          name: 'gender',
          label: 'เพศ',
          type: 'select',
          placeholder: 'เลือกเพศ',
          options: [
            { label: 'ชาย', value: 'male' },
            { label: 'หญิง', value: 'female' },
            { label: 'อื่นๆ', value: 'other' },
          ],
        },
        {
          name: 'religion',
          label: 'ศาสนา',
          type: 'select',
          placeholder: 'เลือกศาสนา',
          options: [
            { label: 'พุทธ', value: 'พุทธ' },
            { label: 'คริสต์', value: 'คริสต์' },
            { label: 'อิสลาม', value: 'อิสลาม' },
            { label: 'อื่นๆ', value: 'อื่นๆ' },
          ],
        },
        {
          name: 'nationality',
          label: 'สัญชาติ',
          type: 'select',
          placeholder: 'เลือกสัญชาติ',
          options: [
            { label: 'ไทย', value: 'ไทย' },
            { label: 'อื่นๆ', value: 'อื่นๆ' },
          ],
        },
        {
          name: 'ethnicity',
          label: 'เชื้อชาติ',
          type: 'select',
          placeholder: 'เลือกเชื้อชาติ',
          options: [
            { label: 'ไทย', value: 'ไทย' },
            { label: 'อื่นๆ', value: 'อื่นๆ' },
          ],
        },
        {
          name: 'blood-type',
          label: 'หมู่เลือด',
          type: 'select',
          placeholder: 'เลือกหมู่เลือด',
          options: [
            { label: 'A', value: 'A' },
            { label: 'B', value: 'B' },
            { label: 'AB', value: 'AB' },
            { label: 'O', value: 'O' },
          ],
        },
        {
          name: 'physical-status',
          label: 'สถานภาพทางร่างกาย',
          type: 'select',
          placeholder: 'เลือกสถานภาพทางร่างกาย',
          options: [
            { label: 'ปกติ', value: 'ปกติ' },
            { label: 'พิการ', value: 'พิการ' },
          ],
        },
      ]"
    />

    <DropDownForm
      ref="contactForm"
      topic="ช่องทางการติดต่อ"
      :values="formValues"
      @save="handleFormSave"
      @change="handleFormChange"
      :fields="[
        {
          name: 'phone',
          label: 'เบอร์โทรศัพท์',
          type: 'text',
          required: true,
          placeholder: '0xxxxxxxxx',
        },
        {
          name: 'personal_email',
          label: 'E-mail',
          type: 'email',
          required: true,
          placeholder: 'example@email.com',
        },
        {
          name: 'line_id',
          label: 'Line ID',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุ Line ID',
        },
      ]"
    />
  </div>

  <div
    class="sticky right-0 bottom-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3"
  >
    <Button
      class="rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D] disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="isSubmitting || !canSave"
      @click="handleSave"
    >
      {{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึก' }}
    </Button>
  </div>
</template>
