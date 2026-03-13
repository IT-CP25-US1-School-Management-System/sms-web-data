<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import DropDownForm from '@/components/form/DropDownForm.vue'
import { Button } from '@/components/ui/button'
import { ROUTE_NAMES } from '@/lib/constants'
import { createTeacher, getTeachers } from '@/stores/teachers'
import { useTeacherStore } from '@/stores/teachers'
import type { TeacherCreateDTO } from '@/types/teacher'
import { useToast } from '@/composables/useToast'
import { generateUUID } from '@/lib/helpers'

const router = useRouter()
const { showError, showSuccess } = useToast()
const teacherStore = useTeacherStore()

const isSubmitting = ref(false)
const formValues = ref<Record<string, any>>({
  is_government: true,

})

const handleValuesUpdate = (values: Record<string, any>) => {
  formValues.value = { ...formValues.value, ...values }
}

const prefixMap: Record<string, number> = {
  นาย: 1,
  นาง: 2,
  นางสาว: 3,
}

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

async function getFallbackRoleId(): Promise<string> {
  const response = await getTeachers({ page: 1, per_page: 1 })
  const firstRoleId = response.data?.[0]?.role_id
  if (!firstRoleId) {
    throw new Error('ไม่พบ role_id สำหรับใช้สร้างข้อมูลคุณครู')
  }
  return firstRoleId
}

const handleSave = async () => {
  if (isSubmitting.value) return

  const firstName = formValues.value.first_name_th?.trim()
  const lastName = formValues.value.last_name_th?.trim()

  if (!firstName || !lastName) {
    showError('กรุณากรอกชื่อและนามสกุลภาษาไทย')
    return
  }

  try {
    isSubmitting.value = true

    const roleId = await getFallbackRoleId()
    const now = new Date().toISOString()
    const personId = generateUUID()

    const payload: TeacherCreateDTO = {
      id: personId,
      prefix_id: prefixMap[formValues.value.prefix_id] ?? 1,
      role_id: roleId,
      is_government: true,
      first_name_th: firstName,
      middle_name_th: formValues.value.middle_name_th || undefined,
      last_name_th: lastName,
      first_name_en: formValues.value.first_name_en || undefined,
      middle_name_en: formValues.value.middle_name_en || undefined,
      last_name_en: formValues.value.last_name_en || undefined,
      birth_date: formValues.value.birth_date || undefined,
      national_id: formValues.value['id-card'] || undefined,
      gender: (genderMap[formValues.value.gender] as any) || undefined,
      religion: formValues.value.religion || undefined,
      nationality: formValues.value.nationality || undefined,
      ethnicity: formValues.value.ethnicity || undefined,
      blood_type: formValues.value['blood-type'] || undefined,
      physical_status: formValues.value['physical-status'] || undefined,
      phone: formValues.value.phone || undefined,
      personal_email: formValues.value.email || undefined,
      marital_status: maritalStatusMap[formValues.value['marital-status']] || undefined,
      spouse_name: formValues.value['spouse-name'] || undefined,
      created_at: now,
      updated_at: now,
    }

    await createTeacher(payload)

    teacherStore.setPersonId(personId)
    showSuccess('เพิ่มข้อมูลส่วนบุคคลสำเร็จ', { description: 'กรุณากรอกข้อมูลที่อยู่ต่อไป' })
    await router.push({ name: ROUTE_NAMES.ADD_TEACHER_ADDRESS })
  } catch (error: any) {
    showError('ไม่สามารถเพิ่มข้อมูลคุณครูได้', {
      description: error?.response?.data?.message || error?.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mx-6 flex flex-col gap-4">
    <DropDownForm
      topic="ข้อมูลทั่วไป"
      :values="formValues"
      @update:values="handleValuesUpdate"
      :fields="[
        {
          name: 'prefix_id',
          label: 'คำนำหน้า',
          type: 'select',
          required: true,
          placeholder: 'เลือกคำนำหน้า',
          disabled: true,
          options: [
            { label: 'นาย', value: 'นาย' },
            { label: 'นาง', value: 'นาง' },
            { label: 'นางสาว', value: 'นางสาว' },
          ],
        },
        { name: 'first_name_th', label: 'ชื่อ', type: 'text', required: true, placeholder: 'กรุณาระบุชื่อ' },
        { name: 'middle_name_th', label: 'ชื่อกลาง', type: 'text', placeholder: 'กรุณาระบุชื่อกลาง' },
        { name: 'last_name_th', label: 'นามสกุล', type: 'text', required: true, placeholder: 'กรุณาระบุนามสกุล' },
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
        { name: 'middle_name_en', label: 'Middlename', type: 'text', placeholder: 'Enter middlename' },
        { name: 'first_name_en', label: 'Name', type: 'text', placeholder: 'Enter name' },
        { name: 'last_name_en', label: 'Lastname', type: 'text', placeholder: 'Enter lastname' },
        { name: 'birth_date', label: 'วัน / เดือน / ปี เกิด', type: 'date', placeholder: 'วว / ดด / ปปปป' },
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
        { name: 'spouse-name', label: 'คู่สมรส', type: 'text', placeholder: 'กรุณาระบุชื่อคู่สมรส' },
        {
          name: 'id-card',
          label: 'เลขบัตรประจำตัวประชาชน',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุเลขบัตรประชาชน',
        },
      ]"
    />

    <DropDownForm
      topic="ข้อมูล Sensitive"
      :values="formValues"
      @update:values="handleValuesUpdate"
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
      topic="ช่องทางการติดต่อ"
      :values="formValues"
      @update:values="handleValuesUpdate"
      :fields="[
        {
          name: 'phone',
          label: 'เบอร์โทรศัพท์',
          type: 'text',
          required: true,
          placeholder: 'กรุณาระบุเบอร์โทรศัพท์',
        },
        {
          name: 'email',
          label: 'E-mail',
          type: 'email',
          required: true,
          placeholder: 'กรุณาระบุอีเมล',
        },
        {
          name: 'line-id',
          label: 'Line ID',
          type: 'text',
          placeholder: 'กรุณาระบุ Line ID',
        },
      ]"
    />
  </div>

  <div class="sticky bottom-0 right-0 z-40 flex w-full justify-end border-t border-gray-200 bg-white p-3">
    <Button
      class="rounded-lg bg-[#16A34A] px-8 py-2 font-semibold text-white shadow-sm hover:bg-[#15803D]"
      :disabled="isSubmitting"
      @click="handleSave"
    >
      {{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึก' }}
    </Button>
  </div>
</template>
