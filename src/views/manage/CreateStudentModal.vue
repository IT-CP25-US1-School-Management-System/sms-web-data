<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import DropDownForm from '@/components/form/DropDownForm.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/composables/useToast'
import { formatDateInput, generateUUID, PREFIX_NAME_BY_ID } from '@/lib/helpers'
import {
  createStudent,
  createStudentAddress,
  createStudentParent,
  deleteStudentParent,
  getStudentAddressById,
  getStudentById,
  getStudentParentsByStudentId,
  updateStudent,
  updateStudentAddress,
  updateStudentParent,
} from '@/stores/students'
import type {
  Address,
  AddressCreateDTO,
  Parent,
  ParentCreateDTO,
  Student,
  StudentCreateDTO,
  StudentUpdateDTO,
} from '@/types/student'
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

type ParentFormValue = Record<string, any> & {
  id?: string
  created_at?: string
  updated_at?: string
}

const props = withDefaults(
  defineProps<{
    mode?: 'create' | 'edit'
    studentId?: string | null
    studentData?: Student | null
  }>(),
  {
    mode: 'create',
    studentId: null,
    studentData: null,
  },
)

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
const isLoading = ref(false)
const showCloseConfirm = ref(false)
const studentRowId = ref('')
const addressRowId = ref('')
const removedParentIds = ref<string[]>([])
const studentCreatedAt = ref('')
const addressCreatedAt = ref('')
const originalStudentValue = ref<Record<string, any> | null>(null)
const originalAddressValue = ref<Record<string, any> | null>(null)
const originalParentValues = ref<Array<Record<string, any>>>([])
const studentFormRef = ref<InstanceType<typeof DropDownForm> | null>(null)
const addressFormRef = ref<InstanceType<typeof DropDownForm> | null>(null)
const parentFormRefs = ref<Array<InstanceType<typeof DropDownForm> | null>>([])

const studentFormValues = ref<Record<string, any>>({})
const addressFormValues = ref<Record<string, any>>({})
const parentFormValues = ref<ParentFormValue[]>([{}])

const isEditMode = computed(() => props.mode === 'edit' && !!props.studentId)

const prefixOptions = Object.entries(PREFIX_NAME_BY_ID).map(([value, label]) => ({
  label,
  value,
}))

const PREFIX_EN_BY_ID: Record<string, string> = {
  '250ae8ee-9f0a-4b94-a2c4-a475752dc3e6': 'Mr.',
  '6ec2c1dd-ab31-47d3-8870-680baac1b8da': 'Mrs.',
  '9b91d6d5-c414-4a92-b44a-2ad07250271c': 'Ms.',
}

function getPrefixEn(prefixId?: string | null, fallback?: string | null) {
  if (fallback) return fallback
  if (!prefixId) return ''
  return PREFIX_EN_BY_ID[String(prefixId)] || ''
}

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
  const base = ['ข้อมูลนักเรียน', 'ข้อมูลที่อยู่', 'ข้อมูลผู้ปกครอง']
  return base[currentStep.value]
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

function normalizeAddress(source?: Address | Address[] | null): Address | null {
  if (!source) return null
  return Array.isArray(source) ? (source[0] ?? null) : source
}

function normalizeParents(source?: Parent[] | Parent | null): Parent[] {
  if (!source) return []
  return Array.isArray(source) ? source : [source]
}

function extractStudentRecord(source: any): Record<string, any> | null {
  if (!source) return null
  if (Array.isArray(source.data)) return source.data[0] || null
  if (source.data && Array.isArray(source.data.data)) return source.data.data[0] || null
  if (source.data && typeof source.data === 'object') return source.data
  if (Array.isArray(source)) return source[0] || null
  return source
}

function normalizeStudentAddress(source?: any[] | any | null): Address | null {
  if (!source) return null
  const entry = Array.isArray(source) ? (source[0] ?? null) : source
  if (!entry) return null

  return {
    id: entry.id || '',
    student_id: entry.student_id || '',
    house_registry_no: entry.student_address_house_registry_no ?? entry.house_registry_no ?? '',
    house_no: entry.student_address_house_no ?? entry.house_no ?? '',
    moo: entry.student_address_moo ?? entry.moo ?? '',
    building: entry.student_address_building ?? entry.building ?? '',
    soi: entry.student_address_soi ?? entry.soi ?? '',
    road: entry.student_address_road ?? entry.road ?? '',
    subdistrict_code: entry.student_address_subdistrict_code ?? entry.subdistrict_code ?? '',
    subdistrict: entry.student_address_subdistrict ?? entry.subdistrict ?? '',
    district_code: entry.student_address_district_code ?? entry.district_code ?? '',
    district: entry.student_address_district ?? entry.district ?? '',
    province_code: entry.student_address_province_code ?? entry.province_code ?? '',
    province: entry.student_address_province ?? entry.province ?? '',
    postal_code: entry.student_address_postal_code ?? entry.postal_code ?? '',
    is_house_registered:
      entry.student_address_is_house_registered ?? entry.is_house_registered ?? false,
    is_current: entry.student_address_is_current ?? entry.is_current ?? false,
    created_at: entry.student_address_created_at ?? entry.created_at ?? '',
    updated_at: entry.student_address_updated_at ?? entry.updated_at ?? '',
  }
}

function normalizeStudentParents(source?: any[] | any | null): Parent[] {
  if (!source) return []
  const entries = Array.isArray(source) ? source : [source]

  return entries.map((entry) => ({
    id: entry.id || '',
    student_id: entry.student_id || '',
    prefixe_id: String(entry.student_parent_prefixe_id ?? entry.prefixe_id ?? ''),
    first_name_th: entry.student_parent_first_name_th ?? entry.first_name_th ?? '',
    last_name_th: entry.student_parent_last_name_th ?? entry.last_name_th ?? '',
    first_name_en: entry.student_parent_first_name_en ?? entry.first_name_en ?? '',
    last_name_en: entry.student_parent_last_name_en ?? entry.last_name_en ?? '',
    occupation: entry.student_parent_occupation ?? entry.occupation ?? '',
    phone_number: entry.student_parent_phone_number ?? entry.phone_number ?? '',
    relation: entry.student_parent_relation ?? entry.relation ?? '',
    created_at: entry.student_parent_created_at ?? entry.created_at ?? '',
    updated_at: entry.student_parent_updated_at ?? entry.updated_at ?? '',
  }))
}

function mergeDefined<T extends Record<string, any>>(base: T, override?: Record<string, any> | null): T {
  if (!override) return base

  const merged: Record<string, any> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    if (value !== undefined && value !== null && value !== '') {
      merged[key] = value
    }
  }
  return merged as T
}

function buildStudentInitialValues(student: Student) {
  return {
    student_id: student.student_id || '',
    prefixe_id: student.prefixe_id ? String(student.prefixe_id) : '',
    prefixEn: getPrefixEn(
      student.prefixe_id ? String(student.prefixe_id) : '',
      (student as any)?.prefixes?.name_en,
    ),
    first_name_th: student.first_name_th || '',
    last_name_th: student.last_name_th || '',
    first_name_en: student.first_name_en || '',
    last_name_en: student.last_name_en || '',
    date_of_birth: formatDateInput(student.date_of_birth),
    age_years: student.age_years ?? '',
    birth_province: student.birth_province || '',
    weight_kg: student.weight_kg ?? '',
    height_cm: student.height_cm ?? '',
    blood_type: student.blood_type || '',
    phone_number: student.phone_number || '',
    gender: student.gender || '',
    grade_level: student.grade_level || '',
    class_section: student.class_section || '',
    religion: student.religion || '',
    nationality: student.nationality || '',
    academic_track: student.academic_track || '',
    student_type: student.student_type || '',
    ethnicity: student.ethnicity || '',
    marital_status: student.marital_status || '',
  }
}

function buildAddressInitialValues(address?: Address | null) {
  return {
    id: address?.id || '',
    house_registry_no: address?.house_registry_no || '',
    house_no: address?.house_no || '',
    moo: address?.moo || '',
    building: address?.building || '',
    soi: address?.soi || '',
    road: address?.road || '',
    subdistrict: address?.subdistrict || '',
    district: address?.district || '',
    province: address?.province || '',
    postal_code: address?.postal_code || '',
    is_house_registered: address?.is_house_registered ?? false,
    is_current: address?.is_current ?? false,
    created_at: address?.created_at || '',
  }
}

function buildParentInitialValues(parent?: Parent): ParentFormValue {
  return {
    id: parent?.id || '',
    prefixe_id: parent?.prefixe_id ? String(parent.prefixe_id) : '',
    first_name_th: parent?.first_name_th || '',
    last_name_th: parent?.last_name_th || '',
    first_name_en: parent?.first_name_en || '',
    last_name_en: parent?.last_name_en || '',
    occupation: parent?.occupation || '',
    phone_number: parent?.phone_number || '',
    relation: parent?.relation || '',
    created_at: parent?.created_at || '',
    updated_at: parent?.updated_at || '',
  }
}

async function loadStudentForEdit() {
  if (!props.studentId && !props.studentData?.id) return

  isLoading.value = true
  try {
    let student = props.studentData as Record<string, any> | null

    if (!student && props.studentId) {
      const studentResponse = await getStudentById(props.studentId)
      student = extractStudentRecord(studentResponse)
    }

    if (!student) return

    originalStudentValue.value = { ...student }
    studentRowId.value = student.id
    studentCreatedAt.value = student.created_at || ''
    studentFormValues.value = buildStudentInitialValues(student as Student)

    let address =
      normalizeStudentAddress(student.student_address) ||
      normalizeAddress(student.addresses) ||
      normalizeAddress(student.address)

    if (!address && student.address_id) {
      const addressResponse = await getStudentAddressById(student.address_id)
      address = addressResponse.data || null
    } else if (student.address_id) {
      const addressResponse = await getStudentAddressById(student.address_id)
      address = mergeDefined(address || ({} as Address), addressResponse.data || null)
    }

    originalAddressValue.value = address ? { ...address } : null
    addressRowId.value = address?.id || student.address_id || ''
    addressCreatedAt.value = address?.created_at || ''
    addressFormValues.value = buildAddressInitialValues(address)

    let parents =
      normalizeStudentParents(student.student_parent) ||
      normalizeParents(student.parents) ||
      normalizeParents(student.parent)

    const parentsResponse = await getStudentParentsByStudentId(student.id).catch(() => null)
    const fetchedParents = parentsResponse?.data || []

    if (fetchedParents.length > 0) {
      const maxLength = Math.max(parents.length, fetchedParents.length)
      parents = Array.from({ length: maxLength }, (_, index) =>
        mergeDefined((parents[index] || {}) as Parent, fetchedParents[index] || null),
      )
    }

    originalParentValues.value = parents.map((parent) => ({ ...parent }))
    parentFormValues.value = parents.length
      ? parents.map((parent) => buildParentInitialValues(parent))
      : [{}]
    parentFormRefs.value = parentFormValues.value.map(() => null)
  } catch (error: any) {
    showError('ไม่สามารถโหลดข้อมูลนักเรียน', {
      description: error?.response?.data?.message || error?.message,
    })
  } finally {
    isLoading.value = false
  }
}

const handleStudentValuesUpdate = (payload: { values: Record<string, any>; isDirty: boolean }) => {
  const nextValues = { ...studentFormValues.value, ...payload.values }
  nextValues.prefixEn = getPrefixEn(nextValues.prefixe_id, nextValues.prefixEn)
  studentFormValues.value = nextValues
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

function buildStudentPayload(now: string): StudentCreateDTO | StudentUpdateDTO {
  const firstName = studentFormValues.value.first_name_th?.trim()
  const lastName = studentFormValues.value.last_name_th?.trim()
  const originalStudent = originalStudentValue.value || {}

  return {
    id: studentRowId.value,
    student_id: studentFormValues.value.student_id || generateUUID(),
    grade_level: studentFormValues.value.grade_level || '',
    class_section: studentFormValues.value.class_section || '',
    prefixe_id: String(studentFormValues.value.prefixe_id || ''),
    first_name_th: firstName,
    last_name_th: lastName,
    first_name_en: studentFormValues.value.first_name_en || undefined,
    last_name_en: studentFormValues.value.last_name_en || undefined,
    age_years: studentFormValues.value.age_years || 0,
    address_id: addressRowId.value,
    academic_track: originalStudent.academic_track || undefined,
    student_type: originalStudent.student_type || undefined,
    date_of_birth: studentFormValues.value.date_of_birth || undefined,
    birth_province: studentFormValues.value.birth_province || undefined,
    weight_kg: studentFormValues.value.weight_kg || undefined,
    height_cm: studentFormValues.value.height_cm || undefined,
    blood_type: studentFormValues.value.blood_type || undefined,
    gender: studentFormValues.value.gender || undefined,
    religion: studentFormValues.value.religion || undefined,
    ethnicity: originalStudent.ethnicity || undefined,
    nationality: studentFormValues.value.nationality || undefined,
    phone_number: studentFormValues.value.phone_number || undefined,
    marital_status: originalStudent.marital_status || undefined,
    created_at: studentCreatedAt.value || originalStudent.created_at || now,
    updated_at: now,
  }
}

function buildAddressPayload(now: string): AddressCreateDTO {
  const originalAddress = originalAddressValue.value || {}

  return {
    id: addressRowId.value,
    student_id: studentRowId.value,
    house_registry_no: addressFormValues.value.house_registry_no || originalAddress.house_registry_no || undefined,
    house_no: addressFormValues.value.house_no || undefined,
    moo: addressFormValues.value.moo || undefined,
    building: addressFormValues.value.building || originalAddress.building || undefined,
    soi: addressFormValues.value.soi || undefined,
    road: addressFormValues.value.road || undefined,
    subdistrict: addressFormValues.value.subdistrict || undefined,
    district: addressFormValues.value.district || undefined,
    province: addressFormValues.value.province || undefined,
    postal_code: addressFormValues.value.postal_code || undefined,
    subdistrict_code: originalAddress.subdistrict_code || undefined,
    district_code: originalAddress.district_code || undefined,
    province_code: originalAddress.province_code || undefined,
    is_house_registered: addressFormValues.value.is_house_registered ?? false,
    is_current: addressFormValues.value.is_current ?? false,
    created_at: addressCreatedAt.value || originalAddress.created_at || now,
    updated_at: now,
  }
}

function buildParentPayload(parent: ParentFormValue, index: number, now: string): ParentCreateDTO {
  const originalParent = originalParentValues.value[index] || {}

  return {
    id: parent.id || originalParent.id || generateUUID(),
    student_id: studentRowId.value,
    prefixe_id: String(parent.prefixe_id || originalParent.prefixe_id || ''),
    first_name_th: parent.first_name_th?.trim(),
    last_name_th: parent.last_name_th?.trim(),
    first_name_en: parent.first_name_en || originalParent.first_name_en || undefined,
    last_name_en: parent.last_name_en || originalParent.last_name_en || undefined,
    occupation: parent.occupation || originalParent.occupation || undefined,
    phone_number: parent.phone_number || originalParent.phone_number || undefined,
    relation: parent.relation || originalParent.relation || '',
    created_at: parent.created_at || originalParent.created_at || now,
    updated_at: now,
  }
}

async function handleNextStep() {
  if (!canProceed.value) return

  if (currentStep.value === STEPS.STUDENT_INFO) {
    const isValid = await studentFormRef.value?.submitForm?.()
    if (isValid === false) return
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

    const now = new Date().toISOString()

    if (!studentRowId.value) {
      studentRowId.value = props.studentId || generateUUID()
    }

    if (!addressRowId.value) {
      addressRowId.value = addressFormValues.value.id || generateUUID()
    }

    const studentPayload = buildStudentPayload(now)
    const addressPayload = buildAddressPayload(now)

    if (isEditMode.value && props.studentId) {
      await updateStudent(props.studentId, studentPayload)
      if (addressRowId.value) {
        await updateStudentAddress(addressRowId.value, addressPayload)
      } else {
        await createStudentAddress(addressPayload)
      }
    } else {
      await createStudent(studentPayload as StudentCreateDTO)
      await createStudentAddress(addressPayload)
    }

    for (const [index, parent] of parentFormValues.value.entries()) {
      if (parent.first_name_th?.trim() && parent.last_name_th?.trim()) {
        const payload = buildParentPayload(parent, index, now)

        if (isEditMode.value && parent.id) {
          await updateStudentParent(parent.id, payload)
        } else {
          await createStudentParent(payload)
        }
      }
    }

    if (isEditMode.value && removedParentIds.value.length > 0) {
      await Promise.all(removedParentIds.value.map((parentId) => deleteStudentParent(parentId)))
    }

    showSuccess(isEditMode.value ? 'แก้ไขข้อมูลนักเรียนสำเร็จ' : 'บันทึกข้อมูลนักเรียนสำเร็จ')
    emit('success')
    emit('close')
  } catch (error: any) {
    showError(
      isEditMode.value ? 'ไม่สามารถแก้ไขข้อมูลนักเรียน' : 'ไม่สามารถบันทึกข้อมูลนักเรียน',
      {
        description: error?.response?.data?.message || error?.message,
      },
    )
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
  const target = parentFormValues.value[index]
  if (target?.id) {
    removedParentIds.value.push(target.id)
  }
  parentFormValues.value.splice(index, 1)
  parentFormRefs.value.splice(index, 1)
  if (parentFormValues.value.length === 0) {
    parentFormValues.value = [{}]
    parentFormRefs.value = [null]
  }
}

function requestCloseModal() {
  if (isSubmitting.value || isLoading.value) return
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

onMounted(() => {
  if (isEditMode.value) {
    loadStudentForEdit()
  }
})
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
      <div class="rounded-t-xl bg-[#1c509f] px-6 py-4 text-white">
        <DialogTitle class="text-xl font-semibold text-white">{{ stepTitle }}</DialogTitle>
        <DialogDescription class="mt-1 text-sm text-white/90">
          ขั้นตอนที่ {{ currentStep + 1 }} จาก 3
        </DialogDescription>
      </div>

      <div v-if="isLoading" class="p-6 text-center text-sm text-muted-foreground">
        กำลังโหลดข้อมูลนักเรียน...
      </div>

      <template v-else>
        <div
          v-if="currentStep === STEPS.STUDENT_INFO"
          class="max-h-96 space-y-6 overflow-y-auto p-6"
        >
          <DropDownForm
            ref="studentFormRef"
            topic="ข้อมูลทั่วไป"
            :values="studentFormValues"
            @change="handleStudentValuesUpdate"
            :fields="studentFields"
          />
        </div>

        <div v-if="currentStep === STEPS.ADDRESS" class="max-h-96 space-y-6 overflow-y-auto p-6">
          <div class="rounded-lg border border-[#e5e5e5] bg-[#fdfdfd] p-4">
            <label class="text-sm font-semibold text-[#09090b]">ประเภทที่อยู่</label>
            <div class="mt-3 flex gap-6">
              <label class="flex cursor-pointer items-center gap-2">
                <input
                  v-model="addressFormValues.is_house_registered"
                  type="checkbox"
                  class="rounded"
                  style="border-color: #27272a"
                />
                <span class="text-sm text-[#09090b]">ที่อยู่ตามทะเบียนบ้าน</span>
              </label>
              <label class="flex cursor-pointer items-center gap-2">
                <input
                  v-model="addressFormValues.is_current"
                  type="checkbox"
                  class="rounded"
                  style="border-color: #27272a"
                />
                <span class="text-sm text-[#09090b]">ที่อยู่ปัจจุบัน</span>
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
            :key="parent.id || index"
            class="rounded-lg border border-[#e5e5e5] bg-[#fdfdfd] p-4"
          >
            <div class="mb-4 flex items-center justify-between border-b border-[#e5e5e5] pb-3">
              <h4 class="font-semibold text-[#09090b]">ผู้ปกครองคนที่ {{ index + 1 }}</h4>
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
          class="flex justify-between border-t border-[#e5e5e5] bg-[#fdfdfd] px-6 py-4"
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
              :disabled="isSubmitting || isLoading || !canProceed"
              class="flex items-center gap-2 rounded-md text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              :style="{
                backgroundColor: currentStep === STEPS.PARENT ? '#16A34A' : '#1C509F',
              }"
            >
              {{
                currentStep === STEPS.PARENT
                  ? isEditMode
                    ? 'บันทึกการแก้ไข'
                    : 'บันทึก'
                  : 'ถัดไป'
              }}
              <ChevronRight v-if="currentStep < STEPS.PARENT" class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </template>
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
