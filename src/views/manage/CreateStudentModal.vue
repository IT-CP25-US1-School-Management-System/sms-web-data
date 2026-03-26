<script setup lang="ts">
import { ref, computed } from 'vue'
import DropDownForm from '@/components/form/DropDownForm.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { createStudent, createStudentAddress, createStudentParent } from '@/stores/students'
import type { StudentCreateDTO, AddressCreateDTO, ParentCreateDTO } from '@/types/student'
import { useToast } from '@/composables/useToast'
import { generateUUID } from '@/lib/helpers'

const { showError, showSuccess } = useToast()

const emit = defineEmits<{
  close: []
  success: []
}>()

// Steps
const STEPS = {
  STUDENT_INFO: 0,
  ADDRESS: 1,
  PARENT: 2,
}

const currentStep = ref(0)
const isSubmitting = ref(false)
const studentId = ref<string>('')
const addressId = ref<string>('')

// Form data
const studentFormValues = ref<Record<string, any>>({})
const addressFormValues = ref<Record<string, any>>({})
const parentFormValues = ref<Record<string, any>[]>([{}])

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

const stepTitle = computed(() => {
  const titles = [
    'ข้อมูลนักเรียน',
    'ข้อมูลที่อยู่',
    'ข้อมูลผู้ปกครอง'
  ]
  return titles[currentStep.value]
})

const canProceed = computed(() => {
  if (currentStep.value === STEPS.STUDENT_INFO) {
    const { first_name_th, last_name_th } = studentFormValues.value
    return !!(first_name_th && last_name_th)
  } else if (currentStep.value === STEPS.ADDRESS) {
    return true // Address is optional
  }
  return true
})

const prefixMap: Record<string, string> = {
  'เด': '1',
  'น.ส.': '2',
  นาย: '1',
  นาง: '2',
  นางสาว: '3',
}

async function handleNextStep() {
  if (!canProceed.value) return

  if (currentStep.value === STEPS.STUDENT_INFO) {
    // Create student
    try {
      isSubmitting.value = true
      const firstName = studentFormValues.value.first_name_th?.trim()
      const lastName = studentFormValues.value.last_name_th?.trim()

      if (!firstName || !lastName) {
        showError('กรุณากรอกชื่อและนามสกุล')
        return
      }

      studentId.value = generateUUID()
      addressId.value = generateUUID()

      const payload: StudentCreateDTO = {
        student_id: studentFormValues.value.student_id || generateUUID(),
        grade_level: studentFormValues.value.grade_level || '',
        class_section: studentFormValues.value.class_section || '',
        prefixe_id: prefixMap[studentFormValues.value.prefixe_id] ?? '1',
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
      }

      await createStudent(payload)
      currentStep.value = STEPS.ADDRESS
    } catch (error: any) {
      showError('ไม่สามารถบันทึกข้อมูลนักเรียน', {
        description: error?.response?.data?.message || error?.message,
      })
    } finally {
      isSubmitting.value = false
    }
  } else if (currentStep.value === STEPS.ADDRESS) {
    // Create address
    try {
      isSubmitting.value = true

      const addressPayload: AddressCreateDTO = {
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
      }

      await createStudentAddress(addressPayload)
      currentStep.value = STEPS.PARENT
    } catch (error: any) {
      showError('ไม่สามารถบันทึกข้อมูลที่อยู่', {
        description: error?.response?.data?.message || error?.message,
      })
    } finally {
      isSubmitting.value = false
    }
  } else if (currentStep.value === STEPS.PARENT) {
    // Create parents - loop through all entries
    try {
      isSubmitting.value = true

      for (const parent of parentFormValues.value) {
        if (parent.first_name_th?.trim() && parent.last_name_th?.trim()) {
          const parentPayload: ParentCreateDTO = {
            student_id: studentId.value,
            prefixe_id: prefixMap[parent.prefixe_id] ?? '1',
            first_name_th: parent.first_name_th.trim(),
            last_name_th: parent.last_name_th.trim(),
            first_name_en: parent.first_name_en || undefined,
            last_name_en: parent.last_name_en || undefined,
            occupation: parent.occupation || undefined,
            phone_number: parent.phone_number || undefined,
            relation: parent.relation || '',
          }

          await createStudentParent(parentPayload)
        }
      }

      showSuccess('บันทึกข้อมูลนักเรียนสำเร็จ')
      emit('success')
      emit('close')
    } catch (error: any) {
      showError('ไม่สามารถบันทึกข้อมูลผู้ปกครอง', {
        description: error?.response?.data?.message || error?.message,
      })
    } finally {
      isSubmitting.value = false
    }
  }
}

const handlePrevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const addParent = () => {
  parentFormValues.value.push({})
}

const removeParent = (index: number) => {
  parentFormValues.value.splice(index, 1)
}
</script>

<template>
  <Dialog open @update:open="emit('close')">
    <DialogContent class="max-w-7xl bg-white border border-gray-300 rounded-xl p-0 shadow-sm" style="max-width: 90vw; width: 90vw">
      <!-- Header with blue background matching Figma #1C509F -->
      <div class="rounded-t-xl px-6 py-4 text-white" style="background-color: #1C509F">
        <DialogTitle class="text-xl font-semibold text-white">{{ stepTitle }}</DialogTitle>
        <DialogDescription class="mt-1 text-sm opacity-90 text-white">ขั้นตอนที่ {{ currentStep + 1 }} จาก 3</DialogDescription>
      </div>

      <!-- Step 1: Student Info -->
      <div v-if="currentStep === STEPS.STUDENT_INFO" class="space-y-6 max-h-96 overflow-y-auto p-6">
        <DropDownForm
          topic="ข้อมูลทั่วไป"
          :values="studentFormValues"
          @change="handleStudentValuesUpdate"
          :fields="[
            { name: 'student_id', label: 'เลขประจำตัวนักเรียน', type: 'text', required: true, placeholder: 'กรุณาระบุเลขประจำตัว' },
            {
              name: 'prefixe_id',
              label: 'คำนำหน้า',
              type: 'select',
              required: true,
              placeholder: 'เลือกคำนำหน้า',
              options: [
                { label: 'เด', value: 'เด' },
                { label: 'น.ส.', value: 'น.ส.' },
              ],
            },
            { name: 'first_name_th', label: 'ชื่อ', type: 'text', required: true, placeholder: 'กรุณาระบุชื่อ' },
            { name: 'last_name_th', label: 'นามสกุล', type: 'text', required: true, placeholder: 'กรุณาระบุนามสกุล' },
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
            { name: 'blood_type', label: 'กลุ่มเลือด', type: 'select', placeholder: 'เลือกหมู่เลือด',
              options: [
                { label: 'A', value: 'A' },
                { label: 'B', value: 'B' },
                { label: 'AB', value: 'AB' },
                { label: 'O', value: 'O' },
              ],
            },
            { name: 'phone_number', label: 'หมายเลขโทรศัพท์', type: 'text' },
            { name: 'gender', label: 'เพศ', type: 'select', placeholder: 'เลือกเพศ',
              options: [
                { label: 'ชาย', value: 'ชาย' },
                { label: 'หญิง', value: 'หญิง' },
                { label: 'อื่นๆ', value: 'อื่นๆ' },
              ],
            },
            { name: 'grade_level', label: 'ชั้น', type: 'text', placeholder: 'เช่น ม.1' },
            { name: 'class_section', label: 'ห้อง', type: 'text', placeholder: 'เช่น 1' },
            { name: 'religion', label: 'ศาสนา', type: 'text' },
            { name: 'nationality', label: 'สัญชาติ', type: 'text' },
          ]"
        />
      </div>

      <!-- Step 2: Address -->
      <div v-if="currentStep === STEPS.ADDRESS" class="space-y-6 max-h-96 overflow-y-auto p-6">
        <div class="rounded-lg border p-4" style="background-color: #FDFDFD; border-color: #E5E5E5">
          <label class="text-sm font-semibold" style="color: #09090B">ประเภทที่อยู่</label>
          <div class="mt-3 flex gap-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="addressFormValues.is_house_registered" class="rounded" style="border-color: #27272A" />
              <span class="text-sm" style="color: #09090B">ที่อยู่ตามทะเบียนบ้าน</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="addressFormValues.is_current" class="rounded" style="border-color: #27272A" />
              <span class="text-sm" style="color: #09090B">ที่อยู่ปัจจุบัน</span>
            </label>
          </div>
        </div>
        <DropDownForm
          topic="ข้อมูลที่อยู่"
          :values="addressFormValues"
          @change="handleAddressValuesUpdate"
          :fields="[
            { name: 'province', label: 'จังหวัด', type: 'text', placeholder: 'กรุณาระบุจังหวัด' },
            { name: 'district', label: 'อำเภอ', type: 'text', placeholder: 'กรุณาระบุอำเภอ' },
            { name: 'subdistrict', label: 'ตำบล', type: 'text', placeholder: 'กรุณาระบุตำบล' },
            { name: 'postal_code', label: 'รหัสไปรษณีย์', type: 'text', placeholder: 'กรุณาระบุรหัสไปรษณีย์' },
            { name: 'road', label: 'ถนน', type: 'text', placeholder: 'กรุณาระบุถนน' },
            { name: 'soi', label: 'ซอย', type: 'text', placeholder: 'กรุณาระบุซอย' },
            { name: 'house_no', label: 'บ้านเลขที่', type: 'text', placeholder: 'กรุณาระบุบ้านเลขที่' },
            { name: 'moo', label: 'หมู่ที่', type: 'text', placeholder: 'กรุณาระบุหมู่ที่' },
          ]"
        />
      </div>

      <!-- Step 3: Parent -->
      <div v-if="currentStep === STEPS.PARENT" class="space-y-6 max-h-96 overflow-y-auto p-6">
        <div v-for="(parent, index) in parentFormValues" :key="index" class="rounded-lg border p-4" style="background-color: #FDFDFD; border-color: #E5E5E5">
          <div class="mb-4 flex items-center justify-between border-b pb-3" style="border-color: #E5E5E5">
            <h4 class="font-semibold" style="color: #09090B">ผู้ปกครองคนที่ {{ index + 1 }}</h4>
            <Button
              v-if="parentFormValues.length > 1"
              variant="ghost"
              size="sm"
              @click="removeParent(index)"
              class="h-8 w-8 p-0 text-gray-600 hover:bg-red-50 hover:text-red-600"
            >
              ✕
            </Button>
          </div>
          <DropDownForm
            :values="parent"
            @change="(payload) => handleParentValueUpdate(index, payload)"
            :fields="[
              {
                name: 'prefixe_id',
                label: 'คำนำหน้า',
                type: 'select',
                options: [
                  { label: 'นาย', value: 'นาย' },
                  { label: 'นาง', value: 'นาง' },
                ],
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
            ]"
          />
        </div>
        <Button variant="outline" size="sm" @click="addParent" class="w-full border-dashed text-gray-700 hover:bg-gray-50" style="border-color: #E5E5E5">
          + เพิ่มผู้ปกครอง
        </Button>
      </div>

      <!-- Navigation Footer -->
      <div class="flex justify-between border-t px-6 py-4" style="border-color: #E5E5E5; background-color: #FDFDFD">
        <Button
          v-if="currentStep > 0"
          variant="outline"
          @click="handlePrevStep"
          class="flex items-center gap-2 text-gray-800 hover:bg-gray-100"
          style="background-color: #D4D4D8; border-color: #E5E5E5"
        >
          <ChevronLeft class="h-4 w-4" />
          ย้อนกลับ
        </Button>
        <div v-else />
        
        <div class="flex gap-3">
          <Button variant="outline" @click="emit('close')" class="text-gray-700 hover:bg-gray-100" style="border-color: #E5E5E5">
            ยกเลิก
          </Button>
          <Button
            @click="handleNextStep"
            :disabled="isSubmitting || !canProceed"
            class="flex items-center gap-2 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
            :style="{
              backgroundColor: currentStep === STEPS.PARENT ? '#16A34A' : '#1C509F'
            }"
          >
            {{ currentStep === STEPS.PARENT ? 'บันทึก' : 'ถัดไป' }}
            <ChevronRight v-if="currentStep < STEPS.PARENT" class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* Dialog sizing for Figma match (1144px) */
:deep(.dialog-content) {
  width: 90vw;
  max-width: 1200px;
}

/* Scrollbar styling */
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
