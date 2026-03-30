<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DropDownForm from '@/components/form/DropDownForm.vue'
import { Button } from '@/components/ui/button'
import { useToast } from '@/composables/useToast'
import { ROUTE_NAMES } from '@/lib/constants'
import { generateUUID } from '@/lib/helpers'
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

const generalForm = ref<any>(null)
const sensitiveForm = ref<any>(null)
const contactForm = ref<any>(null)

const handleFormSave = (values: Record<string, any>) => {
  formValuesUpdate.value = { ...formValuesUpdate.value, ...values }
}

const handleFormChange = (payload: { values: Record<string, any>; isDirty: boolean }) => {
  formValuesUpdate.value = { ...formValuesUpdate.value, ...payload.values }
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
  male: 'ชาย',
  female: 'หญิง',
}

const maritalStatusMap: Record<string, string> = {
  single: 'โสด',
  married: 'สมรส',
  widowed: 'หม้าย',
  divorced: 'หย่า',
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 'true'
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

async function fetchPrefixOptions() {
  try {
    const response = await getDatasetRows<PrefixRow>('data_get_dropdown', 'v1.0.0', {
      view: 'prefixes',
      page: 1,
      per_page: 100,
    })

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
      const response = await getDatasetRows<RoleRow>('data_get_dropdown', 'v2.0.0', {
        view: viewName,
        page: 1,
        per_page: 100,
      })

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
        role_id: teacher.role_id ? String(teacher.role_id) : '',
        first_name_th: teacher.first_name_th,
        middle_name_th: teacher.middle_name_th,
        last_name_th: teacher.last_name_th,
        first_name_en: teacher.first_name_en,
        middle_name_en: teacher.middle_name_en,
        last_name_en: teacher.last_name_en,
        'id-card': teacher.national_id,
        'blood-type': teacher.blood_type,
        birth_date: teacher.birth_date,
        gender: teacher.gender === 'ชาย' ? 'male' : teacher.gender === 'หญิง' ? 'female' : '',
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
                : teacher.marital_status === 'หย่า'
                  ? 'divorced'
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
    const personId = isEditing.value ? teacherStore.personId! : generateUUID()
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

    const payload: TeacherCreateDTO = {
      id: personId,
      prefix_id: prefixId,
      role_id: roleId,
      is_government: currentValues.is_government ?? true,
      first_name_th: firstName,
      middle_name_th: currentValues.middle_name_th || undefined,
      last_name_th: lastName,
      first_name_en: currentValues.first_name_en || undefined,
      middle_name_en: currentValues.middle_name_en || undefined,
      last_name_en: currentValues.last_name_en || undefined,
      birth_date: currentValues.birth_date || undefined,
      national_id: currentValues['id-card'] || undefined,
      gender: (genderMap[currentValues.gender] as any) || undefined,
      religion: currentValues.religion || undefined,
      nationality: currentValues.nationality || undefined,
      ethnicity: currentValues.ethnicity || undefined,
      blood_type: currentValues['blood-type'] || undefined,
      physical_status: currentValues['physical-status'] || undefined,
      phone: currentValues.phone || undefined,
      personal_email: currentValues.personal_email || undefined,
      line_id: currentValues.line_id || undefined,
      marital_status: maritalStatusMap[currentValues['marital-status']] || undefined,
      spouse_name: currentValues['spouse-name'] || undefined,
      created_at: isEditing.value ? teacherStore.currentTeacher?.created_at || now : now,
      updated_at: now,
    }

    if (isEditing.value) {
      await updateTeacher(personId, payload)
      showSuccess('แก้ไขข้อมูลส่วนบุคคลสำเร็จ', { description: 'กรุณากรอกข้อมูลที่อยู่ต่อไป' })
    } else {
      await createTeacher(payload)

      if (currentValues.personal_email) {
        try {
          await createUser({
            email: currentValues.personal_email,
            first_name: firstName,
            last_name: lastName,
          })
        } catch (userError: any) {
          console.error('Failed to create user account:', userError)
          showError('สร้างบัญชีผู้ใช้ไม่สำเร็จ', {
            description:
              userError?.response?.data?.message || 'อาจจำเป็นต้องสร้างบัญชีผู้ใช้ด้วยตนเองต่อมา',
          })
        }
      }

      showSuccess('เพิ่มข้อมูลส่วนบุคคลสำเร็จ', { description: 'กรุณากรอกข้อมูลที่อยู่ต่อไป' })
    }

    teacherStore.setCurrentTeacher({
      id: personId,
      first_name_th: firstName,
      last_name_th: lastName,
      prefix_id: prefixId,
      role_id: roleId,
    })

    await router.push({ name: ROUTE_NAMES.ADD_TEACHER_ADDRESS, query: { id: personId } })
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
          type: 'select',
          placeholder: 'Select prefix',
          options: [
            { label: 'Mr.', value: 'Mr.' },
            { label: 'Mrs.', value: 'Mrs.' },
            { label: 'Miss', value: 'Miss' },
          ],
        },
        {
          name: 'middle_name_en',
          label: 'Middlename',
          type: 'text',
          placeholder: 'Enter middlename',
        },
        { name: 'first_name_en', label: 'Name', type: 'text', placeholder: 'Enter name' },
        { name: 'last_name_en', label: 'Lastname', type: 'text', placeholder: 'Enter lastname' },
        {
          name: 'birth_date',
          label: 'วัน / เดือน / ปี เกิด',
          type: 'date',
          placeholder: 'วว / ดด / ปปปป',
        },
        { name: 'age', label: 'อายุ (ปี)', type: 'number', placeholder: 'อายุ' },
        {
          name: 'marital-status',
          label: 'สถานภาพการแต่งงาน',
          type: 'select',
          placeholder: 'เลือกสถานภาพการแต่งงาน',
          options: [
            { label: 'โสด', value: 'single' },
            { label: 'สมรส', value: 'married' },
            { label: 'หม้าย', value: 'widowed' },
            { label: 'หย่า', value: 'divorced' },
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
