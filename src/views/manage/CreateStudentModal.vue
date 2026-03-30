<script setup lang="ts">
import { computed, ref } from 'vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import DropDownForm from '@/components/form/DropDownForm.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/composables/useToast'
import { generateUUID, PREFIX_NAME_BY_ID } from '@/lib/helpers'
import { createStudent, createStudentAddress, createStudentParent } from '@/stores/students'
import type { AddressCreateDTO, ParentCreateDTO, StudentCreateDTO } from '@/types/student'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

type FormFieldItem = {
  name: string
  label?: string
  type: 'text' | 'date' | 'select' | 'number' | 'email' | 'textarea' | 'file' | 'checkbox'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: { label: string; value: string }[]
  accept?: string
  multiple?: boolean
}

const { showError, showSuccess } = useToast()

const emit = defineEmits<{
  close: []
  success: []
}>()

const STEPS = {
  STUDENT_INFO: 0,
  ADDRESS: 1,
  PARENT: 2,
} as const

const currentStep = ref(0)
const isSubmitting = ref(false)
const showCloseConfirm = ref(false)
const studentId = ref('')
const addressId = ref('')
const studentFormRef = ref<InstanceType<typeof DropDownForm> | null>(null)
const addressFormRef = ref<InstanceType<typeof DropDownForm> | null>(null)
const parentFormRefs = ref<Array<InstanceType<typeof DropDownForm> | null>>([])

const studentFormValues = ref<Record<string, any>>({})
const addressFormValues = ref<Record<string, any>>({})
const parentFormValues = ref<Record<string, any>[]>([{}])

const prefixOptions = Object.entries(PREFIX_NAME_BY_ID).map(([value, label]) => ({
  label,
  value,
}))

const studentFields: FormFieldItem[] = [
  {
    name: 'student_id',
    label: 'เลขประจำตัวนักเรียน',
    type: 'text',
    required: true,
    placeholder: 'กรุณาระบุเลขประจำตัว',
  },
  {
    name: 'prefixe_id',
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
    name: 'last_name_th',
    label: 'นามสกุล',
    type: 'text',
    required: true,
    placeholder: 'กรุณาระบุนามสกุล',
  },
  {
    name: 'prefixEn',
    label: 'Prefix',
    type: 'select',
    placeholder: 'เลือก Prefix',
    options: [
      { label: 'Mr.', value: 'Mr.' },
      { label: 'Mrs.', value: 'Mrs.' },
      { label: 'Ms.', value: 'Ms.' },
    ],
  },
  { name: 'first_name_en', label: 'ชื่อ (อังกฤษ)', type: 'text', placeholder: 'Enter first name' },
  { name: 'last_name_en', label: 'นามสกุล (อังกฤษ)', type: 'text', placeholder: 'Enter last name' },
  { name: 'date_of_birth', label: 'วัน / เดือน / ปี เกิด', type: 'date' },
  { name: 'age_years', label: 'อายุ (ปี)', type: 'number', required: true },
  { name: 'birth_province', label: 'จังหวัดที่เกิด', type: 'text' },
  { name: 'weight_kg', label: 'น้ำหนัก', type: 'number' },
  { name: 'height_cm', label: 'ส่วนสูง', type: 'number' },
  {
    name: 'blood_type',
    label: 'กลุ่มเลือด',
    type: 'select',
    placeholder: 'เลือกหมู่เลือด',
    options: [
      { label: 'A', value: 'A' },
      { label: 'B', value: 'B' },
      { label: 'AB', value: 'AB' },
      { label: 'O', value: 'O' },
    ],
  },
  { name: 'phone_number', label: 'หมายเลขโทรศัพท์', type: 'text' },
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
  { name: 'grade_level', label: 'ชั้น', type: 'text', placeholder: 'เช่น ม.1' },
  { name: 'class_section', label: 'ห้อง', type: 'text', placeholder: 'เช่น 1' },
  { name: 'religion', label: 'ศาสนา', type: 'text' },
  { name: 'nationality', label: 'สัญชาติ', type: 'text' },
]

const addressFields: FormFieldItem[] = [
  { name: 'province', label: 'จังหวัด', type: 'text', placeholder: 'กรุณาระบุจังหวัด' },
  { name: 'district', label: 'อำเภอ', type: 'text', placeholder: 'กรุณาระบุอำเภอ' },
  { name: 'subdistrict', label: 'ตำบล', type: 'text', placeholder: 'กรุณาระบุตำบล' },
  {
    name: 'postal_code',
    label: 'รหัสไปรษณีย์',
    type: 'text',
    placeholder: 'กรุณาระบุรหัสไปรษณีย์',
  },
  { name: 'road', label: 'ถนน', type: 'text', placeholder: 'กรุณาระบุถนน' },
  { name: 'soi', label: 'ซอย', type: 'text', placeholder: 'กรุณาระบุซอย' },
  { name: 'house_no', label: 'บ้านเลขที่', type: 'text', placeholder: 'กรุณาระบุบ้านเลขที่' },
  { name: 'moo', label: 'หมู่ที่', type: 'text', placeholder: 'กรุณาระบุหมู่ที่' },
]

const parentFields: FormFieldItem[] = [
  {
    name: 'prefixe_id',
    label: 'คำนำหน้า',
    type: 'select',
    placeholder: 'เลือกคำนำหน้า',
    options: prefixOptions,
  },
  { name: 'first_name_th', label: 'ชื่อ', type: 'text' },
  { name: 'last_name_th', label: 'นามสกุล', type: 'text' },
  { name: 'occupation', label: 'อาชีพ', type: 'text' },
  { name: 'phone_number', label: 'เบอร์โทรศัพท์', type: 'text' },
  {
    name: 'relation',
    label: 'ความสัมพันธ์',
    type: 'select',
    options: [
      { label: 'พ่อ', value: 'father' },
      { label: 'แม่', value: 'mother' },
      { label: 'ผู้ปกครอง', value: 'guardian' },
    ],
  },
]

const stepTitle = computed(() => {
  const titles = ['ข้อมูลนักเรียน', 'ข้อมูลที่อยู่', 'ข้อมูลผู้ปกครอง']
  return titles[currentStep.value]
})

const canProceed = computed(() => {
  if (currentStep.value === STEPS.STUDENT_INFO) {
    const { first_name_th, last_name_th } = studentFormValues.value
    return !!(first_name_th && last_name_th)
  }

  return true
})

const hasDraftData = computed(() => {
  const hasFilledValues = (values: Record<string, any>) =>
    Object.values(values).some((value) => {
      if (typeof value === 'boolean') return value
      if (typeof value === 'number') return !Number.isNaN(value)
      return String(value ?? '').trim().length > 0
    })

  return (
    hasFilledValues(studentFormValues.value) ||
    hasFilledValues(addressFormValues.value) ||
    parentFormValues.value.some((parent) => hasFilledValues(parent))
  )
})

const handleStudentValuesUpdate = (payload: { values: Record<string, any>; isDirty: boolean }) => {
  studentFormValues.value = { ...studentFormValues.value, ...payload.values }
}

const handleAddressValuesUpdate = (payload: { values: Record<string, any>; isDirty: boolean }) => {
  addressFormValues.value = { ...addressFormValues.value, ...payload.values }
}

const handleParentValueUpdate = (
  index: number,
  payload: { values: Record<string, any>; isDirty: boolean },
) => {
  parentFormValues.value[index] = { ...parentFormValues.value[index], ...payload.values }
}

async function handleNextStep() {
  if (!canProceed.value) return

  if (currentStep.value === STEPS.STUDENT_INFO) {
    const isValid = await studentFormRef.value?.submitForm?.()
    if (isValid === false) return

    const firstName = studentFormValues.value.first_name_th?.trim()
    const lastName = studentFormValues.value.last_name_th?.trim()

    if (!firstName || !lastName) {
      showError('กรุณากรอกชื่อและนามสกุล')
      return
    }

    currentStep.value = STEPS.ADDRESS
    return
  }

  if (currentStep.value === STEPS.ADDRESS) {
    const isValid = await addressFormRef.value?.submitForm?.()
    if (isValid === false) return

    currentStep.value = STEPS.PARENT
    return
  }

  try {
    isSubmitting.value = true

    const validationResults = await Promise.all(
      parentFormRefs.value.map((formRef) => formRef?.submitForm?.() ?? true),
    )
    if (validationResults.some((result) => result === false)) return

    const firstName = studentFormValues.value.first_name_th?.trim()
    const lastName = studentFormValues.value.last_name_th?.trim()

    if (!firstName || !lastName) {
      showError('กรุณากรอกชื่อและนามสกุล')
      return
    }

    studentId.value = generateUUID()
    addressId.value = generateUUID()
    const now = new Date().toISOString()

    const studentPayload: StudentCreateDTO = {
      id: studentId.value,
      student_id: studentFormValues.value.student_id || generateUUID(),
      grade_level: studentFormValues.value.grade_level || '',
      class_section: studentFormValues.value.class_section || '',
      prefixe_id: String(studentFormValues.value.prefixe_id || ''),
      first_name_th: firstName,
      last_name_th: lastName,
      first_name_en: studentFormValues.value.first_name_en || undefined,
      last_name_en: studentFormValues.value.last_name_en || undefined,
      age_years: studentFormValues.value.age_years || 0,
      address_id: addressId.value,
      academic_track: studentFormValues.value.academic_track || undefined,
      student_type: studentFormValues.value.student_type || undefined,
      date_of_birth: studentFormValues.value.date_of_birth || undefined,
      birth_province: studentFormValues.value.birth_province || undefined,
      weight_kg: studentFormValues.value.weight_kg || undefined,
      height_cm: studentFormValues.value.height_cm || undefined,
      blood_type: studentFormValues.value.blood_type || undefined,
      gender: studentFormValues.value.gender || undefined,
      religion: studentFormValues.value.religion || undefined,
      ethnicity: studentFormValues.value.ethnicity || undefined,
      nationality: studentFormValues.value.nationality || undefined,
      phone_number: studentFormValues.value.phone_number || undefined,
      marital_status: studentFormValues.value.marital_status || undefined,
      created_at: now,
      updated_at: now,
    }

    const addressPayload: AddressCreateDTO = {
      id: addressId.value,
      student_id: studentId.value,
      house_registry_no: addressFormValues.value.house_registry_no || undefined,
      house_no: addressFormValues.value.house_no || undefined,
      moo: addressFormValues.value.moo || undefined,
      building: addressFormValues.value.building || undefined,
      soi: addressFormValues.value.soi || undefined,
      road: addressFormValues.value.road || undefined,
      subdistrict: addressFormValues.value.subdistrict || undefined,
      district: addressFormValues.value.district || undefined,
      province: addressFormValues.value.province || undefined,
      postal_code: addressFormValues.value.postal_code || undefined,
      is_house_registered: addressFormValues.value.is_house_registered ?? false,
      is_current: addressFormValues.value.is_current ?? false,
      created_at: now,
      updated_at: now,
    }

    await createStudent(studentPayload)
    await createStudentAddress(addressPayload)

    for (const parent of parentFormValues.value) {
      if (parent.first_name_th?.trim() && parent.last_name_th?.trim()) {
        const parentPayload: ParentCreateDTO = {
          id: generateUUID(),
          student_id: studentId.value,
          prefixe_id: String(parent.prefixe_id || ''),
          first_name_th: parent.first_name_th.trim(),
          last_name_th: parent.last_name_th.trim(),
          first_name_en: parent.first_name_en || undefined,
          last_name_en: parent.last_name_en || undefined,
          occupation: parent.occupation || undefined,
          phone_number: parent.phone_number || undefined,
          relation: parent.relation || '',
          created_at: now,
          updated_at: now,
        }

        await createStudentParent(parentPayload)
      }
    }

    showSuccess('บันทึกข้อมูลนักเรียนสำเร็จ')
    emit('success')
    emit('close')
  } catch (error: any) {
    showError('ไม่สามารถบันทึกข้อมูลนักเรียน', {
      description: error?.response?.data?.message || error?.message,
    })
  } finally {
    isSubmitting.value = false
  }
}

function handlePrevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function addParent() {
  parentFormValues.value.push({})
  parentFormRefs.value.push(null)
}

function removeParent(index: number) {
  parentFormValues.value.splice(index, 1)
  parentFormRefs.value.splice(index, 1)
}

function requestCloseModal() {
  if (isSubmitting.value) return

  if (!hasDraftData.value) {
    emit('close')
    return
  }

  showCloseConfirm.value = true
}

function handleCloseConfirm(confirmed: boolean) {
  showCloseConfirm.value = false

  if (confirmed) {
    emit('close')
  }
}
</script>

<template>
  <Dialog
    open
    @update:open="
      (open) => {
        if (!open) requestCloseModal()
      }
    "
  >
    <DialogContent
      class="max-w-7xl rounded-xl border border-gray-300 bg-white p-0 shadow-sm"
      style="max-width: 90vw; width: 90vw"
    >
      <div class="rounded-t-xl px-6 py-4 text-white" style="background-color: #1c509f">
        <DialogTitle class="text-xl font-semibold text-white">{{ stepTitle }}</DialogTitle>
        <DialogDescription class="mt-1 text-sm text-white opacity-90">
          ขั้นตอนที่ {{ currentStep + 1 }} จาก 3
        </DialogDescription>
      </div>

      <div v-if="currentStep === STEPS.STUDENT_INFO" class="max-h-96 space-y-6 overflow-y-auto p-6">
        <DropDownForm
          ref="studentFormRef"
          topic="ข้อมูลทั่วไป"
          :values="studentFormValues"
          @change="handleStudentValuesUpdate"
          :fields="studentFields"
        />
      </div>

      <div v-if="currentStep === STEPS.ADDRESS" class="max-h-96 space-y-6 overflow-y-auto p-6">
        <div class="rounded-lg border p-4" style="background-color: #fdfdfd; border-color: #e5e5e5">
          <label class="text-sm font-semibold" style="color: #09090b">ประเภทที่อยู่</label>
          <div class="mt-3 flex gap-6">
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="addressFormValues.is_house_registered"
                type="checkbox"
                class="rounded"
                style="border-color: #27272a"
              />
              <span class="text-sm" style="color: #09090b">ที่อยู่ตามทะเบียนบ้าน</span>
            </label>
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="addressFormValues.is_current"
                type="checkbox"
                class="rounded"
                style="border-color: #27272a"
              />
              <span class="text-sm" style="color: #09090b">ที่อยู่ปัจจุบัน</span>
            </label>
          </div>
        </div>

        <DropDownForm
          ref="addressFormRef"
          topic="ข้อมูลที่อยู่"
          :values="addressFormValues"
          @change="handleAddressValuesUpdate"
          :fields="addressFields"
        />
      </div>

      <div v-if="currentStep === STEPS.PARENT" class="max-h-96 space-y-6 overflow-y-auto p-6">
        <div
          v-for="(parent, index) in parentFormValues"
          :key="index"
          class="rounded-lg border p-4"
          style="background-color: #fdfdfd; border-color: #e5e5e5"
        >
          <div
            class="mb-4 flex items-center justify-between border-b pb-3"
            style="border-color: #e5e5e5"
          >
            <h4 class="font-semibold" style="color: #09090b">ผู้ปกครองคนที่ {{ index + 1 }}</h4>
            <Button
              v-if="parentFormValues.length > 1"
              variant="ghost"
              size="sm"
              @click="removeParent(index)"
              class="h-8 w-8 p-0 text-gray-600 hover:bg-red-50 hover:text-red-600"
            >
              ×
            </Button>
          </div>

          <DropDownForm
            :ref="
              (instance) =>
                (parentFormRefs[index] = instance as InstanceType<typeof DropDownForm> | null)
            "
            :values="parent"
            @change="(payload) => handleParentValueUpdate(index, payload)"
            :fields="parentFields"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          @click="addParent"
          class="w-full border-dashed text-gray-700 hover:bg-gray-50"
          style="border-color: #e5e5e5"
        >
          + เพิ่มผู้ปกครอง
        </Button>
      </div>

      <div
        class="flex justify-between border-t px-6 py-4"
        style="border-color: #e5e5e5; background-color: #fdfdfd"
      >
        <Button
          v-if="currentStep > 0"
          variant="outline"
          @click="handlePrevStep"
          class="flex items-center gap-2 text-gray-800 hover:bg-gray-100"
          style="background-color: #d4d4d8; border-color: #e5e5e5"
        >
          <ChevronLeft class="h-4 w-4" />
          ย้อนกลับ
        </Button>
        <div v-else />

        <div class="flex gap-3">
          <Button
            variant="outline"
            @click="requestCloseModal"
            class="text-gray-700 hover:bg-gray-100"
            style="border-color: #e5e5e5"
          >
            ยกเลิก
          </Button>
          <Button
            @click="handleNextStep"
            :disabled="isSubmitting || !canProceed"
            class="flex items-center gap-2 rounded-md text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            :style="{
              backgroundColor: currentStep === STEPS.PARENT ? '#16A34A' : '#1C509F',
            }"
          >
            {{ currentStep === STEPS.PARENT ? 'บันทึก' : 'ถัดไป' }}
            <ChevronRight v-if="currentStep < STEPS.PARENT" class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <ConfirmModal
    v-if="showCloseConfirm"
    action="delete"
    topic="ข้อมูลที่กรอกไว้"
    @confirm="handleCloseConfirm"
  />
</template>

<style scoped>
:deep(.dialog-content) {
  width: 90vw;
  max-width: 1200px;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
